这份代码实现了我们在 `design.md` 中规划的 **“多模态推理 + 本地音位辅助”** 架构。它利用 FastAPI 作为服务框架，结合 `PyThaiNLP` 处理本地模糊匹配，并调用 **Gemini 2.5 Flash** 的原生多模态能力。

### 1. 环境准备

在你的 Mac Mini M4 上，建议先创建一个虚拟环境并安装依赖：

```bash
pip install fastapi uvicorn google-generativeai pythainlp python-multipart

```

---

### 2. Python 后端实现 (`main.py`)

```python
import os
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from pythainlp.tokenize import word_tokenize
from pythainlp.phonetic import lk82
from pythainlp.spell import correct as thai_correct

app = FastAPI()

# 允许 Web App 跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置 Gemini (建议在环境变量中设置 API_KEY)
genai.configure(api_key="YOUR_GEMINI_API_KEY")

# 模拟一个用户高频词库（用于本地快速音位纠偏）
USER_FREQUENT_WORDS = ["ไปไหน", "เท่าไหร่", "สถานีรถไฟ", "หิวข้าว", "ขอบคุณ", "โรงแรม"]

def local_fuzzy_match(raw_text_suggestion: str):
    """使用 PyThaiNLP 进行本地音位纠偏，寻找发音最接近的常用词"""
    if not raw_text_suggestion: return ""
    tokens = word_tokenize(raw_text_suggestion, engine="newmm")
    fixed = []
    for tk in tokens:
        # 如果词不在常用词库，尝试通过音位(lk82算法)匹配
        tk_phonetic = lk82(tk)
        match = next((w for w in USER_FREQUENT_WORDS if lk82(w) == tk_phonetic), tk)
        fixed.append(match)
    return "".join(fixed)

@app.post("/api/v1/helper/transcribe")
async def transcribe_thai_helper(
    file: UploadFile = File(...),
    scene: str = Form("general")
):
    try:
        # 1. 读取音频数据
        audio_content = await file.read()
        
        # 2. 准备 Gemini 2.5 Flash 模型 (利用其 Thinking 能力)
        # 注意：这里我们直接将音频发给模型，不经过中间转写
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=(
                "你是一个针对泰语学习者的语音输入助手。用户的泰语口音可能不准或语法破碎。\n"
                "你的任务是：\n"
                "1. 听取音频并推断用户想表达的标准泰语。\n"
                "2. 修正口音导致的错误，补全为礼貌、标准的句子。\n"
                "3. 只输出修正后的标准泰语，不要解释。"
            )
        )

        # 3. 构造 Few-shot 示例 (根据场景动态调整效果更佳)
        prompt_parts = [
            "Few-shot Examples:\n"
            "- User sounds like: 'Pai nai sa-ta-nee' -> Output: 'ไปสถานีอย่างไรครับ'\n"
            "- User sounds like: 'Ao an-nee song' -> Output: 'ขอรับอันนี้สองชิ้นครับ'\n",
            {"mime_type": "audio/webm", "data": audio_content},
            f"\nContext: 当前场景是 {scene}。请直接给出最准确的泰语结果。"
        ]

        # 4. 执行多模态推理
        response = model.generate_content(prompt_parts)
        final_thai = response.text.strip()

        # 5. 可选：使用 PyThaiNLP 对结果进行最后的拼写一致性检查
        # 这一步能确保 Gemini 生成的文本中没有明显的录入型拼写错误
        final_thai = "".join([thai_correct(w) for w in word_tokenize(final_thai)])

        return {
            "status": "success",
            "result": final_thai,
            "phonetic_hint": " ".join(word_tokenize(final_thai)), # 供前端显示词块
            "scene_used": scene
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    # 在 M4 上运行， workers 数可以设高一点提高并发
    uvicorn.run(app, host="0.0.0.0", port=8000)

```

---

### 3. 该实现方案的“精妙”之处：

1. **多模态合一 (Multimodal In-one-go)**：
我们没有像以前那样“先调 ASR API 再调 LLM API”。Gemini 2.5 直接“听”音频并输出“修正后的文本”。这**减少了一次 API 往返**，是延迟能控制在 3 秒内的关键。
2. **PyThaiNLP 的语义锚点**：
代码末尾的 `thai_correct` 起到了“最后一道防线”的作用。即使 LLM 有时会产生幻觉拼写，本地库能强行将其拉回标准的泰语词典。
3. **场景感知 (Context Awareness)**：
通过 `scene` 参数，前端可以告诉后端用户现在是在“餐厅”还是“机场”，Gemini 会根据场景优先匹配相关的词汇（例如在餐厅里，"Ao" 极大概率是“要/取”的意思）。

---

### 4. 针对 Mac Mini M4 的运行建议

由于你在 M4 上运行：

* **并发处理**：你可以利用 `uvicorn main:app --workers 4`。
* **本地加速**：如果你后续想把第一步转写完全本地化（不走 Google API），可以引入 `faster-whisper`。在 M4 上，15 秒音频的本地转写仅需约 200ms。

**这份代码准备好后，你是否需要我帮你写一段对应的“前端原生 JS 组件”代码，用来将录音 Blob 以 `FormData` 格式发送给这个接口？**