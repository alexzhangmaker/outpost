import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from the project root (one level up from src or dist)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/';
let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (serviceAccountPath) {
    // If relative, resolve it against the current working directory or a known base
    if (!path.isAbsolute(serviceAccountPath)) {
        serviceAccountPath = path.resolve(process.cwd(), serviceAccountPath);
        // If it doesn't exist relative to CWD, try relative to the project root
        if (!fs.existsSync(serviceAccountPath)) {
            serviceAccountPath = path.resolve(__dirname, '../', process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '');
        }
    }
    if (fs.existsSync(serviceAccountPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: databaseURL,
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
                });
            }
            console.log('Firebase initialized successfully with service account:', path.basename(serviceAccountPath));
        }
        catch (err) {
            console.error('Failed to parse Firebase service account JSON:', err.message);
        }
    }
    else {
        console.warn(`FIREBASE_SERVICE_ACCOUNT_PATH file not found at: ${serviceAccountPath}`);
    }
}
else {
    console.warn('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.');
}
export const db = admin.apps.length ? admin.database() : null;
export const storage = admin.apps.length ? admin.storage() : null;
/**
 * Get a specific database instance by URL.
 * If no URL is provided, returns the default database instance.
 */
export function getDatabase(url) {
    if (!admin.apps.length)
        throw new Error('Firebase not initialized');
    return url ? admin.app().database(url) : admin.database();
}
export async function saveToRealtimeDb(path, data) {
    if (!db)
        throw new Error('Firebase Database not initialized');
    const ref = db.ref(path);
    await ref.push(data);
}
export async function updateRealtimeDb(path, data) {
    if (!db)
        throw new Error('Firebase Database not initialized');
    const ref = db.ref(path);
    await ref.update(data);
}
export async function uploadAudioToStorage(buffer, fileName, directory = 'audioSentences') {
    if (!storage)
        throw new Error('Firebase Storage not initialized');
    const bucket = storage.bucket();
    const filePath = `${directory}/${fileName}`;
    const file = bucket.file(filePath);
    await file.save(buffer, {
        metadata: { contentType: 'audio/mpeg' },
        public: true
    });
    // Use common download URL format or public URL
    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}
export async function saveArticleToFirebase(article) {
    const articlesDbUrl = process.env.FIREBASE_ARTICLES_DATABASE_URL;
    const targetDb = articlesDbUrl ? getDatabase(articlesDbUrl) : db;
    if (!targetDb)
        throw new Error('Firebase Database not initialized');
    const ref = targetDb.ref(`ThaiCLoseReading/${article.id}`);
    await ref.set(article);
}
export async function getFromRealtimeDb(path) {
    if (!db)
        throw new Error('Firebase Database not initialized');
    const ref = db.ref(path);
    const snapshot = await ref.once('value');
    return snapshot.val();
}
//# sourceMappingURL=firebase.js.map