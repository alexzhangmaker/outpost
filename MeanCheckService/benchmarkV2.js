import { performance } from 'perf_hooks';

// 1. 配置要测试的模型列表
const MODELS = ['qwen2.5:1.5b', 'qwen2.5:7b', 'gemma2:9b', 'llama3.1:8b'];

// 2. 健壮的 JSON 提取器：防止本地模型夹带 Markdown 标签或解释性文本
function extractAndParseJSON(rawText) {
  try {
    // 匹配最外层的 {} 或 []
    const jsonRegex = /(\[\s*[\s\S]*?\s*\]|\{\s*[\s\S]*?\s*\})/;
    const match = rawText.match(jsonRegex);
    if (!match) throw new Error("文本中未包含任何 JSON 结构");
    return JSON.parse(match[0]);
  } catch (e) {
    throw new Error(`JSON 解析失败: ${e.message} | 原始文本: ${rawText.slice(0, 100)}...`);
  }
}

// 3. 泰语多维度能力测试集 (升级版：加入 Few-shot 范例与边缘场景测试)
const THAI_TEST_SUITE = [
  {
    category: '单词同/近义词提炼',
    userPrompt: `将泰语词汇的繁琐释义提炼为精准的[英文核心词, 中文核心词]数组。
范例输入: โรงเรียน | 释义: A place where children go to be educated; school. : 学校。 -> 预期输出: ["school", "学校"]

请处理以下输入：
输入单词: ภาพยนตร์
释义: motion picture; film; movie: 电影；影片; cinema as an art form or industry: 电影艺术。
输出格式必须为: ["English", "Chinese"]`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return Array.isArray(obj) && obj.length === 2 && typeof obj[0] === 'string';
    }
  },
  {
    category: '单词造句与语法解析',
    userPrompt: `使用泰语单词 "กล้วย" (香蕉) 造一个适合初学者的日常短句，并提供翻译。
预期输出格式：{"thai_sentence": "泰语造句", "english_translation": "英文翻译", "chinese_translation": "中文翻译"}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return !!(obj.thai_sentence && obj.chinese_translation);
    }
  },
  {
    category: '泰语分词 (Tokenization)',
    userPrompt: `泰语不使用空格分词，请将没有空格的泰语长句拆分为独立的单词/语义元数组。
范例输入: ผมรักคุณ -> 预期输出: ["ผม", "รัก", "คุณ"]

请处理以下输入：
输入句子: ฉันชอบเรียนภาษาไทย
输出格式必须为: ["词1", "词2", "词3", ...]`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return Array.isArray(obj) && obj.includes('ฉัน') && obj.includes('ภาษาไทย');
    }
  },
  {
    category: '国际音标与声调标注',
    userPrompt: `分析泰语单词 "สวัสดี" 的国际音标(IPA)和各音节声调。
预期输出格式：{"word": "สวัสดี", "ipa": "IPA音标", "tones": ["各音节声调描述"]}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return !!(obj.ipa && Array.isArray(obj.tones));
    }
  },
  {
    category: '语境含义一致性裁判',
    userPrompt: `你是一个懂社交语境的裁判。判断两句话在日常交际功能（如道别、问候）上是否可以等价替换。
注意：不要过度陷入字面细节。只要它们在日常交流中传达的核心社交意图、情感相似，即判定为相近。

范例 A: "happy to know you" | 范例 B: "nice to meet you" -> 预期输出: {"is_semantically_close": true, "reason": "核心都是表达结识某人的喜悦"}

请裁判以下输入：
输入 A: "see you soon" 
输入 B: "see you again;goodbye"
输出格式: {"is_semantically_close": true/false, "reason": "中文场景辨析"}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return obj.is_semantically_close === true; // 有了 Few-shot 引导，看模型是否开窍
    }
  },
  {
    category: '敬语级别与语气分类',
    userPrompt: `分析以下泰语短句的礼貌级别(Politeness Level)和适用场景。
输入短句: กินไรยัง (吃了吗？)
预期输出格式: {"level": "Informal/Formal/Royal", "target_audience": "适用对象描述", "formal_equivalent": "其对应的正式版泰语表达"}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return ['Informal', 'Formal', 'Royal'].includes(obj.level) && !!obj.formal_equivalent;
    }
  },
  {
    category: '语法偏误诊断与纠错',
    userPrompt: `检查并修正初学者写的泰语错误句子。
错误输入: *ฉันไปโรงเรียนด้วย车* 
预期输出格式: {"is_correct": false, "corrected_thai": "修正后的地道泰语", "error_analysis": "中文错误原因分析"}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return obj.is_correct === false && !!obj.corrected_thai;
    }
  },
  {
    category: '💥 新增：语音助理抗噪鲁棒性',
    userPrompt: `在实际语音交互中，语音转文字(STT)常因环境噪音导致输入的文本断断续续、丢失主体。
请根据下面这段充满噪音、破碎的泰语，猜测用户的核心助理意图，并补全句子。
模糊输入: "...去...清迈...火车站...几点..."
预期输出格式: {"guessed_intent": "询问火车班次/去火车站的交通", "completed_thai_sentence": "补全后的地道泰语", "confidence": 0.0 to 1.0}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return !!(obj.guessed_intent && obj.completed_thai_sentence && obj.confidence > 0.5);
    }
  },
  {
    category: '💥 新增：防幻觉与强否认能力',
    userPrompt: `你是一个严谨的语言教练，绝不能瞎编。判断输入的泰语是否是一个真实存在的泰语单词。如果是伪造的词，必须大方否认。
输入词汇: "ขวดกล้วย" (这是一个故意拼凑的伪词：意思是香蕉瓶)
预期输出格式: {"is_valid_word": true/false, "explanation": "中文解释说明为什么这个词不符合泰语常理"}`,
    validator: (rawData) => {
      const obj = extractAndParseJSON(rawData);
      return obj.is_valid_word === false; // 预期应该聪明地发现这是个不存在的伪词
    }
  }
];

// 4. 模型常驻内存预热机制 (修复版：确保标准的本地端点和完整的 POST 结构)
async function warmupModel(model) {
  try {
    await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: '预热数据',
        stream: false
      })
    });
  } catch (e) {
    console.error(`❌ 预热模型 ${model} 失败，请确保终端执行了 'ollama serve'。错误: ${e.message}`);
  }
}

// 5. 单测核心逻辑 (修复版)
async function runSingleTask(model, task) {
  const systemPrompt = "You are a professional Thai Language NLP API. Your output MUST be strictly a well-formed JSON object or array. Do not wrap the JSON in markdown code blocks. Do not talk to the user outside the JSON.";
  const startTime = performance.now();
  let firstTokenTime = null;
  let fullText = '';

  try {
    // 确保这里的 URL 字符串极其干净，不带任何隐藏格式
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive' // 保持长连接减少握手延迟
      },
      body: JSON.stringify({
        model: model,
        prompt: task.userPrompt,
        system: systemPrompt,
        stream: true,
        options: { temperature: 0.0 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama 响应异常状态码: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);
        if (!firstTokenTime) firstTokenTime = performance.now();
        if (parsed.response) {
          fullText += parsed.response;
        }
      }
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    const ttftMs = firstTokenTime - startTime;
    const speedFps = (fullText.length / 4 / ((totalTimeMs - ttftMs) / 1000)).toFixed(1);

    let isValid = false;
    try {
      isValid = task.validator(fullText);
    } catch (e) {
      isValid = false;
    }

    return { success: true, ttftMs: Math.round(ttftMs), speed: parseFloat(speedFps), isValid };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// 6. 评测总控
async function startBenchmark() {
  console.log('🚀 开始【升级版】本地 LLM 泰语教育/助理专属全方位能力测试 (Mac mini M4)...');
  const resultsTable = [];

  for (const model of MODELS) {
    console.log(`\n=======================================\n[ 模型预热与压测 ] 正在处理: ${model}`);
    await warmupModel(model);

    let totalTTFT = 0;
    let totalSpeed = 0;
    let passedCount = 0;

    for (const task of THAI_TEST_SUITE) {
      const res = await runSingleTask(model, task);
      if (res.success) {
        totalTTFT += res.ttftMs;
        totalSpeed += res.speed;
        if (res.isValid) passedCount++;
        console.log(`- 〖${task.category}〗-> TTFT: ${res.ttftMs}ms | JSON验证: ${res.isValid ? '✅ 通过' : '❌ 失败'}`);
      } else {
        console.log(`- 〖${task.category}〗-> 🛠️ 发生异常: ${res.error}`);
      }
    }

    resultsTable.push({
      model,
      avgTtft: `${Math.round(totalTTFT / THAI_TEST_SUITE.length)} ms`,
      score: `${passedCount} / ${THAI_TEST_SUITE.length}`
    });
  }

  console.log('\n=================== 📊 泰语能力本地 LLM 终极技术选型报告 (升级版) ===================\n');
  console.table(resultsTable);
}

startBenchmark();