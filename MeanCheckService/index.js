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

// API: Evaluation Endpoint
fastify.post('/evaluate', async (request, reply) => {
    const { studentInput, standardMeanings } = request.body;

    if (!studentInput || !standardMeanings || !Array.isArray(standardMeanings)) {
        return reply.status(400).send({ error: 'Invalid input. studentInput and standardMeanings (array) are required.' });
    }

    try {
        // 1. Spell Correction (Pre-processing)
        // Checks if studentInput is close to any of the standard meanings
        const correctedInput = didYouMean(studentInput, standardMeanings) || studentInput;

        // 2. Semantic Embedding for user input
        const userVector = await getEmbedding(correctedInput);

        // 3. Compare against all standard meanings
        let maxSim = 0;
        let bestMatch = '';

        for (const meaning of standardMeanings) {
            const stdVector = await getEmbedding(meaning);
            const sim = cosineSimilarity(userVector, stdVector);

            if (sim > maxSim) {
                maxSim = sim;
                bestMatch = meaning;
            }
        }

        const isCorrect = maxSim >= SIMILARITY_THRESHOLD;

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
