import Fastify from 'fastify';
import cors from '@fastify/cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Register CORS
await fastify.register(cors);

// Configuration
const OLLAMA_API = 'http://localhost:11434/api/chat';
const MODEL_NAME = 'qwen2.5:1.5b'; 
const resultCache = new Map();

// Initialize SQLite database
const dbPath = path.join(__dirname, 'meancheck.sqlite');
const db = new (sqlite3.verbose().Database)(dbPath, (err) => {
    if (err) {
        console.error('Error opening SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        db.run(`CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_input TEXT,
            standard_meanings TEXT,
            is_correct INTEGER,
            similarity REAL,
            category TEXT,
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// Helper to log evaluation to SQLite
function logEvaluation(studentInput, standardMeanings, result) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO evaluations (student_input, standard_meanings, is_correct, similarity, category, reason) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [
            studentInput,
            JSON.stringify(standardMeanings),
            result.isCorrect ? 1 : 0,
            result.similarity,
            result.category,
            result.reason
        ];
        db.run(sql, params, function(err) {
            if (err) {
                console.error('[DB] Log failed:', err.message);
                reject(err);
            } else {
                console.log('[DB] Logged evaluation ID:', this.lastID);
                resolve(this.lastID);
            }
        });
    });
}

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
        const cachedResult = resultCache.get(cacheKey);
        await logEvaluation(studentInput, standardMeanings, cachedResult).catch(console.error);
        return cachedResult;
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
        await logEvaluation(studentInput, standardMeanings, quickResult).catch(console.error);
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
        await logEvaluation(studentInput, standardMeanings, finalResult).catch(console.error);
        return finalResult;

    } catch (err) {
        console.error('[MeanCheck] LLM Error:', err);
        return reply.status(500).send({ error: 'Evaluation error' });
    }
});

// API: Get historical records
fastify.get('/records', async (request, reply) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM evaluations ORDER BY created_at DESC`, [], (err, rows) => {
            if (err) {
                reply.status(500).send({ error: err.message });
                reject(err);
            } else {
                const parsedRows = rows.map(r => {
                    try {
                        r.standard_meanings = JSON.parse(r.standard_meanings);
                    } catch (e) {
                        // ignore parsing error
                    }
                    return r;
                });
                reply.send(parsedRows);
                resolve();
            }
        });
    });
});

// API: Delete a record
fastify.delete('/records/:id', async (request, reply) => {
    const { id } = request.params;
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM evaluations WHERE id = ?`, [id], function(err) {
            if (err) {
                reply.status(500).send({ error: err.message });
                reject(err);
            } else {
                reply.send({ success: true, changes: this.changes });
                resolve();
            }
        });
    });
});

// View console
fastify.get('/console.html', async (request, reply) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, 'console.html'), 'utf8');
        reply.type('text/html').send(html);
    } catch (err) {
        reply.status(500).send({ error: 'Failed to load console.html' });
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
