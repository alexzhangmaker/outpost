import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const CACHE_NAME = 'outpost-v2-cache-v4';
const DB_NAME = 'OutpostDB';
const DB_VERSION = 2;
const STORE_NAME = 'todos';

let db;
let firebaseApp;
let firestore;
let unsubscribeTodos = null;
let currentUserId = null;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => reject(event.target.error);
    });
};

const initFirebase = (config) => {
    if (!firebaseApp) {
        firebaseApp = initializeApp(config);
        firestore = getFirestore(firebaseApp);
    }
};

self.addEventListener('install', (event) => {
    const coreAssets = [
        './appOutpostV2.html',
        './'
    ];
    const externalAssets = [
        'https://cdn.tailwindcss.com?plugins=forms,container-queries',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
        'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
        'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
        'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
    ];

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // 1. Cache core local assets (blocking)
            await cache.addAll(coreAssets);

            // 2. Cache external assets with appropriate CORS mode
            await Promise.all(externalAssets.map(url => {
                // Firebase SDKs (modules) MUST have CORS. 
                // Styles and fonts can use no-cors (opaque) if they fail CORS.
                const isFirebase = url.includes('firebase');
                return fetch(url, { mode: isFirebase ? 'cors' : 'no-cors' })
                    .then(response => {
                        // For cors mode, check ok. For no-cors, response.ok is always false (type: opaque)
                        if (isFirebase && !response.ok) throw new Error(`Fetch failed: ${url}`);
                        return cache.put(url, response);
                    })
                    .catch(err => console.warn('Failed to cache external asset:', url, err));
            }));

            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

const syncFirestoreToIdb = (userId) => {
    if (unsubscribeTodos) {
        unsubscribeTodos();
        unsubscribeTodos = null;
    }
    if (!userId) return;
    currentUserId = userId;

    const q = query(collection(firestore, 'todos'), where('owner', '==', userId));
    unsubscribeTodos = onSnapshot(q, async (snapshot) => {
        if (!db) await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const id = change.doc.id;
            if (change.type === 'removed') {
                store.delete(id);
            } else {
                store.put({ id, ...data });
            }
        });
        tx.oncomplete = async () => {
            const allClients = await clients.matchAll();
            allClients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
        };
    }, (error) => {
        console.error("Firestore sync error:", error);
    });
};

self.addEventListener('message', async (event) => {
    const { type, payload } = event.data;
    try {
        if (!db) await initDB();
        switch (type) {
            case 'INIT_FIREBASE':
                initFirebase(payload.config);
                break;
            case 'SET_USER':
                syncFirestoreToIdb(payload.userId);
                break;
            case 'ADD_TODO':
                if (firestore && currentUserId) {
                    await setDoc(doc(firestore, 'todos', payload.id), {
                        ...payload.data,
                        owner: currentUserId,
                        createdAt: payload.data.createdAt || serverTimestamp()
                    });
                }
                break;
            case 'UPDATE_TODO':
                if (firestore) {
                    await updateDoc(doc(firestore, 'todos', payload.id), payload.data);
                }
                break;
            case 'DELETE_TODO':
                if (firestore) {
                    await deleteDoc(doc(firestore, 'todos', payload.id));
                }
                break;
        }
    } catch (error) {
        console.error('Error handling message:', type, error);
    }
});

self.addEventListener('fetch', (event) => {
    // Isolated matching: Only search the current valid cache version
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                return response || fetch(event.request);
            });
        })
    );
});
