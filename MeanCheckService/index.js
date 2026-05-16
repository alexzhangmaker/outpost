import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

// Register CORS
await fastify.register(cors);

// Configuration
const OLLAMA_API = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'qwen2.5:1.5b'; 
const resultCache = new Map();

// Helper: Normalize text for simple matching
function normalize(text) {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/[.,!?;:()]/g, '');
}

// API: Evaluation Endpoint
fastify.post('/evaluate', async (request, reply) => {
    const { studentInput, standardMeanings } = request.body;

    if (!studentInput || !standardMeanings || !Array.isArray(standardMeanings)) {
        return reply.status(400).send({ error: 'Invalid input.' });
    }

    const normInput = normalize(studentInput);
    const standardText = standardMeanings.join('; ');
    
    // 1. 缓存检查 (Identical Request)
    const cacheKey = `${normInput}|${normalize(standardText)}`;
    if (resultCache.has(cacheKey)) {
        console.log(`[MeanCheck] Cache Hit for "${studentInput}"`);
        return resultCache.get(cacheKey);
    }

    // 2. 快速路径：精确匹配或简单包含 (0ms 延迟)
    const isQuickMatch = standardMeanings.some(m => {
        const normM = normalize(m);
        return normM === normInput || normM.includes(normInput) && normInput.length > 2;
    });

    if (isQuickMatch) {
        console.log(`[MeanCheck] Quick Match Hit for "${studentInput}"`);
        const quickResult = {
            isCorrect: true,
            similarity: 1.0,
            correctedInput: studentInput,
            bestMatch: standardMeanings[0],
            reason: '精确匹配或核心词包含 (快速路径)',
            category: '快速匹配'
        };
        resultCache.set(cacheKey, quickResult);
        return quickResult;
    }

    // 3. LLM 路径 (当快速路径无法判断时)
    console.log(`[MeanCheck] Calling LLM for "${studentInput}"...`);

    const systemPrompt = `你是一个智能且通情达理的语言学习助手。你的任务是判断学生的输入（输入 B）与标准答案（输入 A）在意思上是否匹配。

判定准则（请务必遵守）：
1. **核心匹配**：如果输入 B 是输入 A 中提到的核心单词或短语之一，判定为 true。
2. **意思一致**：只要两句话传达相同的基本社交意图或核心含义，判定为 true。
3. **宽容处理**：不要纠结于形式区别，重点看语义。
4. **严格拒绝（极度重要）**：如果输入 B 与输入 A 的意思完全无关或毫不相干（例如 A 是 "it"，B 是 "oily"；或者 A 是苹果，B 是汽车），必须判定为 false！绝不能误判为 true。

请严格按照以下 JSON 格式输出，限制输出长度：
{
"is_semantically_close": true/false,
"similarity_score": 0.0 to 1.0,
"category": "分类",
"explanation": "简述理由"
}`;

    const userPrompt = `A: "${standardText}"\nB: "${studentInput}"`;

    try {
        const response = await fetch(OLLAMA_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                stream: false,
                format: 'json',
                options: {
                    num_predict: 100, // 限制生成长度，加快速度
                    temperature: 0.1  // 降低随机性，提高稳定性
                }
            })
        });

        if (!response.ok) throw new Error(`Ollama API error`);

        const result = await response.json();
        const llmResponse = JSON.parse(result.message.content);

        const finalResult = {
            isCorrect: llmResponse.is_semantically_close,
            similarity: llmResponse.similarity_score,
            correctedInput: studentInput,
            bestMatch: standardMeanings[0],
            reason: llmResponse.explanation,
            category: llmResponse.category
        };

        // 存入缓存
        resultCache.set(cacheKey, finalResult);
        return finalResult;

    } catch (err) {
        console.error('[MeanCheck] LLM Error:', err);
        return reply.status(500).send({ error: 'Evaluation error' });
    }
});

// Health Check
fastify.get('/health', async () => ({ status: 'ok', model: MODEL_NAME }));

// Startup
const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log(`[MeanCheck] Service running on port 3001`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
