import { performance } from 'perf_hooks';

// 1. 配置要测试的模型列表
const MODELS = ['qwen2.5:1.5b', 'gemma2:9b', 'qwen2.5:7b', 'llama3.1:8b'];

// 2. 定义测试场景数据集
const TEST_CASES = [
  {
    scene: '个人助理 - 意图转 JSON',
    systemPrompt: `You are an AI Assistant. Respond ONLY with a valid JSON object matching the requested schema. No explanations.`,
    userPrompt: `将以下日常话语转换为日程 JSON 格式：'帮我安排明天下午3点和王总开会，讨论下季度预算。'
Schema:
{
  "action": "create_event",
  "title": "会议名称",
  "time": "YYYY-MM-DD HH:mm:ss",
  "participants": ["姓名"]
}`,
    validator: (text) => {
      try {
        const obj = JSON.parse(text.trim());
        return obj.action === 'create_event' && obj.time.includes('15:00:00');
      } catch {
        return false;
      }
    }
  },
  {
    scene: '语言学习 - 社交语境对齐',
    systemPrompt: `你是一个智能语言学习助手。判断两句话在日常交流中传达的社交功能是否相近（例如同属告别、同属问候）。严格输出JSON：{"is_semantically_close": true/false, "explanation": "原因"}`,
    userPrompt: `判断这两句话意思是否接近：
输入 A: "see you soon"
输入 B: "see you again;goodbye"`,
    validator: (text) => {
      try {
        const obj = JSON.parse(text.trim());
        return obj.is_semantically_close === true; // 预期应该聪明地判定为 true
      } catch {
        return false;
      }
    }
  }
];

// 3. 测试单个模型在特定 Case 上的表现
async function testModelCase(model, testCase) {
  const startTime = performance.now();
  let firstTokenTime = null;
  let fullText = '';

  try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: testCase.userPrompt,
        system: testCase.systemPrompt,
        stream: true,
        options: { temperature: 0.0 } // 设为0降低随机性，保证Benchmark结果可复现
      })
    });

    if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let tokenCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);

        if (!firstTokenTime) {
          firstTokenTime = performance.now(); // 记录首字时间
        }

        if (parsed.response) {
          fullText += parsed.response;
          tokenCount++;
        }
      }
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    const ttftMs = firstTokenTime - startTime; // 首字延迟
    const speedFps = (tokenCount / ((totalTimeMs - ttftMs) / 1000)).toFixed(1); // 纯生成速度

    // 清洗模型可能夹带的 markdown 代码块包裹 (```json ... ```)
    const cleanedText = fullText.replace(/```json|```/g, '').trim();
    const isValid = testCase.validator(cleanedText);

    return {
      success: true,
      ttftMs: Math.round(ttftMs),
      speed: parseFloat(speedFps),
      isValid: isValid,
      rawOutput: cleanedText
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 4. 主控评估流程
async function runBenchmark() {
  console.log('🚀 开始本地 LLM 选型性能测试 (Mac mini M4)...');
  const reports = [];

  for (const model of MODELS) {
    console.log(`\n正在评估模型: [ ${model} ] ...`);
    let totalTTFT = 0;
    let totalSpeed = 0;
    let passedCases = 0;

    for (const [index, testCase] of TEST_CASES.entries()) {
      console.log(`  -> 正在运行场景 ${index + 1}: ${testCase.scene}`);
      const res = await testModelCase(model, testCase);

      if (res.success) {
        totalTTFT += res.ttftMs;
        totalSpeed += res.speed;
        if (res.isValid) passedCases++;
        console.log(`     [成功] TTFT: ${res.ttftMs}ms | 速度: ${res.speed} t/s | JSON有效性: ${res.isValid ? '通过' : '未通过'}`);
      } else {
        console.log(`     [失败] 错误信息: ${res.error}`);
      }
    }

    reports.push({
      model: model,
      avgTtft: Math.round(totalTTFT / TEST_CASES.length),
      avgSpeed: (totalSpeed / TEST_CASES.length).toFixed(1),
      accuracy: `${passedCases}/${TEST_CASES.length}`
    });
  }

  // 5. 打印最终选型 Markdown 报表
  console.log('\n=================== 📊 本地 LLM 选型评估报告 ===================\n');
  console.log('| 模型版本 | 平均首字延迟 (TTFT) | 平均生成速度 (Tokens/s) | 业务逻辑准确率 |');
  console.log('| :--- | :---: | :---: | :---: |');
  reports.forEach(r => {
    console.log(`| **${r.model}** | ${r.avgTtft} ms | ${r.avgSpeed} t/s | ${r.accuracy} |`);
  });
  console.log('\n💡 选型策略建议：');
  console.log('1. 语音交互优先看 TTFT（应 < 400ms）和 Speed（应 > 35 t/s）。');
  console.log('2. 助理后台指令优先看“业务逻辑准确率”（必须全通）。');
}

runBenchmark();