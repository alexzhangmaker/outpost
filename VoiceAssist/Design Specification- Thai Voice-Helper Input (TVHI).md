这是一个为泰语学习者量身定制的语音输入辅助系统设计规格。它针对**“键盘输入难”**和**“口语发音不准”**这两个核心痛点，利用 2026 年最新的 Gemini 2.5 多模态能力与本地 NLP 库协同工作。

---

# Design Specification: Thai Voice-Helper Input (TVHI)

## 1. 需求概述 (Requirement Overview)

### 1.1 痛点分析

* **输入难度**：泰语键盘布局复杂（44 辅音 + 多层元音），对于非母语者效率极低。
* **发音偏差**：学习者发音不标准（声调、清浊音混淆），导致传统 ASR 识别结果为无意义的乱码。
* **环境限制**：不便建立大规模专业 RAG 知识库，需要轻量、自适应的方案。

### 1.2 核心特性

* **口音容错**：通过音位模糊匹配（Phonetic Matching）纠正发音相近的词汇。
* **意图补全**：基于 Few-shot 示例，将破碎、不标准的泰语短语补全为标准的礼貌用语。
* **多场景适配**：预设常用场景（打车、就餐、问候），动态切换纠错模型逻辑。
* **极致响应**：针对 15 秒内短语音优化，端到端延迟控制在 3 秒左右。

---

## 2. 技术架构 (Technical Architecture)

该系统采用 **“轻量级前端 + 强化级后端”** 架构。

### 2.1 技术栈 (Tech Stack)

* **Frontend**: HTML5, Plain JavaScript (ES6+), Tailwind CSS (CDN), Web MediaRecorder API.
* **Backend**: Python 3.10+, FastAPI (异步高并发).
* **AI Engine**: Google Gemini 2.5 Flash (具备 Multimodal & Thinking 能力).
* **NLP Processor**: PyThaiNLP (分词与音位算法).
* **Infrastructure**: 优化适配 Mac Mini M4 (支持本地 NPU 加速)。

---

## 3. 技术实现方案 (Implementation Plan)

### 3.1 语音处理流 (The "Thinking" Pipeline)

为了降低延迟，我们放弃“先转文字再纠错”的传统做法，采用 **Gemini 2.5 原生多模态推理**：

1. **采集层**：前端录制 16kHz 单声道 WebM 音频。
2. **音位预处理 (Local)**：
* 使用 `pythainlp.phonetic` 提取初步特征。
* 如果识别出关键词，检索本地 `Small-Scale Fuzzy Lib`（如个人常用词表）。


3. **多模态增强 (Cloud)**：
* 将 **音频流 + 文本 Prompt + Few-shot 示例** 一次性发给 Gemini 2.5 Flash。
* **Thinking Mode**：模型内部推理“学习者发音 A 可能对应的标准词 B”。



### 3.2 关键代码逻辑 (Backend)

```python
# 核心 Prompt 结构设计
PROMPT_TEMPLATE = """
System: 你是一个泰语学习辅助专家。
Context: 用户泰语水平较低，输入为含口音的语音。
Rules:
1. 忽略发音偏差，寻找发音最接近的合法泰语单词。
2. 将破碎的短语（如"去、哪、车站"）转化为标准、礼貌的句子。
3. 如果无法确定，请返回 2-3 个最可能的候选结果。

Few-shot Examples:
- User Audio Transcription: "Pai nai sa-ta-nee" -> Result: "ไปสถานีอย่างไรครับ"
- User Audio Transcription: "Ao an-nee song" -> Result: "ขอรับอันนี้สองชิ้นครับ"

Input Audio: [Multimodal Audio Stream]
"""

```

---

## 4. 性能与优化 (Performance & Optimization)

### 4.1 延迟目标 (Latency Budget)

| 阶段 | 目标耗时 | 优化手段 |
| --- | --- | --- |
| **网络传输** | < 0.5s | 压缩音频采样率至 16kHz |
| **AI 推理** | 1.5s - 2.5s | 使用 Gemini 2.5 Flash (而非 Pro) |
| **本地处理** | < 0.1s | 利用 M4 芯片并发处理音位分析 |
| **总延迟** | **~3.0s** | **满足非实时输入的流畅感** |

### 4.2 针对 M4 芯片的优化

* **本地并行化**：在 FastAPI 中使用多线程同时处理 `PyThaiNLP` 任务和 API 请求准备。
* **SSL 加速**：在 Mac Mini 上配置本地 Nginx 反向代理，优化 HTTPS 握手时间。

---

## 5. UI/UX 设计要点 (UX Design)

### 5.1 组件化封装

封装为原生 Web Component `<thai-input-helper>`，具备以下 API 接口：

* `lang`: 支持 `th-ZH`, `th-EN` 切换。
* `scene`: 支持 `travel`, `food`, `general` 等场景参数。
* `onResult`: 结果返回后的回调事件。

### 5.2 交互反馈

* **波形反馈**：录音时显示实时音量波形，缓解用户等待焦虑。
* **双行显示**：上方显示修正后的**标准泰语**（可点击复制），下方显示**音译拼音**（方便用户确认）。

---

## 6. 后续扩展 (Future Scalability)

* **个性化纠错库**：根据用户的历史错误记录，动态生成个性化的 Few-shot Prompt。
* **离线模式**：在 M4 机器上运行本地 Whisper-small 模型作为网络故障时的备选方案。

---

**Would you like me to start generating the actual Python FastAPI backend code that implements this specific "Thinking + Multimodal" logic?**