import Fastify from 'fastify';
import cors from '@fastify/cors';
import { pipeline } from '@xenova/transformers';
import didYouMean from 'didyoumean';

const fastify = Fastify({ logger: true });

// Register CORS
await fastify.register(cors);

// Configuration
const SIMILARITY_THRESHOLD = 0.85;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

// State
let extractor;
const embeddingCache = new Map(); // Cache embeddings for standard meanings

// Initialize model
async function initModel() {
    console.log(`[MeanCheck] Loading model: ${MODEL_NAME}...`);
    extractor = await pipeline('feature-extraction', MODEL_NAME);
    console.log('[MeanCheck] Model loaded.');
}

// Math Utility: Cosine Similarity
function cosineSimilarity(vector1, vector2) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vector1.length; i++) {
        dotProduct += vector1[i] * vector2[i];
        normA += vector1[i] * vector1[i];
        normB += vector2[i] * vector2[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Get or create embedding
async function getEmbedding(text) {
    if (embeddingCache.has(text)) {
        return embeddingCache.get(text);
    }
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    embeddingCache.set(text, vector);
    return vector;
}

// Helper: Normalize text for comparison (remove "to " prefix, lowercase, trim)
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/^to\s+/i, '');
}

// API: Evaluation Endpoint
fastify.post('/evaluate', async (request, reply) => {
    const { studentInput, standardMeanings } = request.body;

    if (!studentInput || !standardMeanings || !Array.isArray(standardMeanings)) {
        return reply.status(400).send({ error: 'Invalid input. studentInput and standardMeanings (array) are required.' });
    }

    console.log(`[Evaluate Request] studentInput: "${studentInput}", standardMeanings:`, standardMeanings);

    try {
        // 0. Flatten and Normalize standard meanings
        // A single standard meaning string might contain multiple synonyms separated by comma/semicolon/slash
        const flattenedMeanings = [];
        for (const originalMeaning of standardMeanings) {
            if (typeof originalMeaning === 'string') {
                const parts = originalMeaning.split(/[,;\/]/).map(p => p.trim()).filter(p => p);
                for (const part of parts) {
                    flattenedMeanings.push({ 
                        original: originalMeaning, 
                        normalized: normalizeText(part) 
                    });
                }
            }
        }

        const normStudentInput = normalizeText(studentInput);
        const normStandardMeanings = flattenedMeanings.map(m => m.normalized);

        // 1. Spell Correction (Pre-processing)
        // Checks if studentInput is close to any of the standard meanings
        let correctedInput = didYouMean(normStudentInput, normStandardMeanings) || normStudentInput;

        // If spell correction didn't find anything, fallback to original just in case
        if (!correctedInput && normStudentInput) {
             correctedInput = normStudentInput;
        }

        // 2. Semantic Embedding for user input
        const userVector = await getEmbedding(correctedInput);

        // 3. Compare against all standard meanings
        let maxSim = 0;
        let bestMatch = '';

        for (const item of flattenedMeanings) {
            const stdVector = await getEmbedding(item.normalized);
            const sim = cosineSimilarity(userVector, stdVector);

            if (sim > maxSim) {
                maxSim = sim;
                bestMatch = item.original;
            }
        }

        const isCorrect = maxSim >= SIMILARITY_THRESHOLD;

        console.log(`[Evaluate Result] isCorrect: ${isCorrect}, maxSim: ${maxSim}, correctedInput: "${correctedInput}", bestMatch: "${bestMatch}"`);

        return {
            isCorrect,
            similarity: parseFloat(maxSim.toFixed(4)),
            correctedInput,
            bestMatch,
            thresholdUsed: SIMILARITY_THRESHOLD
        };

    } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal evaluation error' });
    }
});

// Health Check
fastify.get('/health', async () => ({ status: 'ok', model: MODEL_NAME }));

// Startup
const start = async () => {
    try {
        await initModel();
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('[MeanCheck] Service listening on port 3001');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
