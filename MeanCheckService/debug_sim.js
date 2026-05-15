import { pipeline } from '@xenova/transformers';

async function run() {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
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

    async function getVec(text) {
        const out = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(out.data);
    }

    const v1 = await getVec("help");
    const v2 = await getVec("to help, assist, or aid someone");

    console.log("help vs to help... : ", cosineSimilarity(v1, v2));
}
run();
