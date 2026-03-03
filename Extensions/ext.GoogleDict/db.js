const DB_NAME = 'GoogleDictDB';
const STORE_NAME = 'translations';
const DB_VERSION = 1;

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

async function addTranslation(entry) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add({
            timestamp: Date.now(),
            ...entry
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllTranslations() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
        request.onerror = () => reject(request.error);
    });
}

async function findExisting(entry) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const item = cursor.value;
                if (item.source === entry.source &&
                    item.target === entry.target &&
                    item.langInfo === entry.langInfo) {
                    resolve(item);
                    return;
                }
                cursor.continue();
            } else {
                resolve(null);
            }
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

async function deleteTranslation(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
    module.exports = { addTranslation, getAllTranslations, deleteTranslation, findExisting };
}
