importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js');

let firebaseDb;
let userId;
const CACHE_NAME = 'outpost-v3-cache-v1';
const ASSETS = [
    './appOutpostV3.html'
];

// --- IndexedDB Helpers ---
const openIDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open('OutpostDB', 2);
    req.onblocked = () => {
        console.warn('SW: IDB Open Blocked! Please close other tabs.');
    };
    req.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('todos')) {
            db.createObjectStore('todos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
        }
        console.log('SW: IDB Upgrade performed in SW');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

const getAllFromIDB = (db, storeName) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

const putToIDB = (db, storeName, data) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
});

const deleteFromIDB = (db, storeName, id) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
});

// --- Sync Engine ---
let isSyncing = false;
const syncWithFirebase = async () => {
    if (!firebaseDb || !userId || isSyncing) return;
    isSyncing = true;
    console.log('SW: Starting Sync...');

    try {
        console.log('SW: Getting Firebase Ref...');
        const fbRef = firebaseDb.ref(`todos/${userId}`);
        const snapshot = await fbRef.get();
        console.log('SW: Firebase Data Received.');
        const firebaseData = snapshot.val() || {};
        
        console.log('SW: Opening IndexedDB...');
        const idb = await openIDB();
        console.log('SW: IndexedDB Opened.');
        const localData = await getAllFromIDB(idb, 'todos');
        console.log('SW: Local Data Loaded.');
        
        const localMap = new Map(localData.map(t => [t.id, t]));
        let hasChanges = false;

        // 1. Firebase -> Local
        for (const id in firebaseData) {
            const fbTodo = firebaseData[id];
            const localTodo = localMap.get(id);
            if (!localTodo || (fbTodo.updatedAt > (localTodo.updatedAt || 0))) {
                await putToIDB(idb, 'todos', fbTodo);
                hasChanges = true;
                console.log(`SW: Synced from Firebase -> ${id}`);
            }
        }

        // 2. Local -> Firebase (New items only)
        for (const localTodo of localData) {
            if (!firebaseData[localTodo.id]) {
                await fbRef.child(localTodo.id).set(localTodo);
                console.log(`SW: Synced to Firebase -> ${localTodo.id}`);
            }
        }

        if (hasChanges) {
            const clients = await self.clients.matchAll();
            clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETE' }));
        }
    } catch (err) {
        console.error('SW Sync Error:', err);
    } finally {
        isSyncing = false;
    }
};

// --- SW Lifecycle ---
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
            .catch(err => console.warn('Pre-cache warning (ignored):', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(res => {
                if (event.request.url.startsWith('http')) {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(event.request, resClone));
                }
                return res;
            });
        })
    );
});

self.addEventListener('message', async (event) => {
    const { type, payload } = event.data;
    if (type === 'INIT_FIREBASE') {
        if (!firebase.apps.length) {
             firebase.initializeApp(payload.config);
        }
        firebaseDb = firebase.database();
    } else if (type === 'SET_USER') {
        userId = payload.userId;
        if (userId) {
            // Initial Sync
            syncWithFirebase();
            // Realtime Listener
            firebaseDb.ref(`todos/${userId}`).on('value', async (snapshot) => {
                if (isSyncing) return;
                const fbData = snapshot.val() || {};
                const idb = await openIDB();
                const localData = await getAllFromIDB(idb, 'todos');
                const localMap = new Map(localData.map(t => [t.id, t]));
                let changed = false;

                for (const id in fbData) {
                    const fbTodo = fbData[id];
                    const localTodo = localMap.get(id);
                    if (!localTodo || fbTodo.updatedAt > (localTodo.updatedAt || 0)) {
                        await putToIDB(idb, 'todos', fbTodo);
                        changed = true;
                    }
                }
                
                if (changed) {
                    const clients = await self.clients.matchAll();
                    clients.forEach(c => c.postMessage({ type: 'SYNC_COMPLETE' }));
                }
            });
        }
    } else if (['ADD_TODO', 'UPDATE_TODO', 'DELETE_TODO'].includes(type) && firebaseDb && userId) {
        const path = `todos/${userId}/${payload.id}`;
        if (type === 'ADD_TODO' || type === 'UPDATE_TODO') {
            firebaseDb.ref(path).set(payload.data);
        } else if (type === 'DELETE_TODO') {
            firebaseDb.ref(path).remove();
        }
    }
});
