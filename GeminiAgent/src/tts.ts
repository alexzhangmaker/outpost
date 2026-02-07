import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import dotenv from 'dotenv';

dotenv.config();

const client = new TextToSpeechClient();

export async function generateThaiAudio(text: string): Promise<Buffer> {
    const request = {
        input: { text },
        voice: { languageCode: 'th-TH', ssmlGender: 'NEUTRAL' as const },
        audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await client.synthesizeSpeech(request);
    return response.audioContent as Buffer;
}
