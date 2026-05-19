import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ override: true, path: path.resolve(__dirname, '../.env') });
const client = new TextToSpeechClient();
export async function generateThaiAudio(text) {
    const request = {
        input: { text },
        voice: { languageCode: 'th-TH', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await client.synthesizeSpeech(request);
    return response.audioContent;
}
//# sourceMappingURL=tts.js.map