import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/';

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
    });
} else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not found or invalid. Firebase features will not work.');
}

export const db = admin.database ? admin.database() : null;
export const storage = admin.storage ? admin.storage() : null;

export async function saveToRealtimeDb(path: string, data: any) {
    if (!db) throw new Error('Firebase Database not initialized');
    const ref = db.ref(path);
    await ref.push(data);
}

export async function uploadAudioToStorage(buffer: Buffer, fileName: string) {
    if (!storage) throw new Error('Firebase Storage not initialized');
    const bucket = storage.bucket();
    const file = bucket.file(`audioSentences/${fileName}`);

    await file.save(buffer, {
        metadata: { contentType: 'audio/mpeg' },
        public: true
    });

    return `https://storage.googleapis.com/${bucket.name}/audioSentences/${fileName}`;
}
export async function getFromRealtimeDb(path: string) {
    if (!db) throw new Error('Firebase Database not initialized');
    const ref = db.ref(path);
    const snapshot = await ref.once('value');
    return snapshot.val();
}
