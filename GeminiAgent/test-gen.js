import { geminiAgent, thaiWordLearningSchema, THAI_WORD_LEARNING_PROMPT } from './src/agent.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
async function test() {
    const word = 'โดยเฉพาะอย่างยิ่ง';
    console.log(`Testing generation for: "${word}"`);
    try {
        const result = await geminiAgent.generate([
            {
                role: 'user',
                content: [
                    { type: 'text', text: THAI_WORD_LEARNING_PROMPT },
                    { type: 'text', text: word }
                ],
            },
        ], {
            structuredOutput: {
                schema: thaiWordLearningSchema,
            },
        });
        console.log('SUCCESS!');
        console.log(JSON.stringify(result.object, null, 2));
    }
    catch (error) {
        console.error('FAILED!');
        console.error('Error Message:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
            if (error.cause.issues) {
                console.error('Zod Issues:', JSON.stringify(error.cause.issues, null, 2));
            }
        }
        console.error('Stack:', error.stack);
    }
}
test();
//# sourceMappingURL=test-gen.js.map