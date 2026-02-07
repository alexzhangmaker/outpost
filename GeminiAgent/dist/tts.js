import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';
dotenv.config();
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