console.log('[SharedWorker] Starting...');

try {
    importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-database-compat.js');
    importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');
    console.log('[SharedWorker] Scripts imported');
} catch (e) {
    console.error('[SharedWorker] Import scripts failed:', e);
}

const ports = [];
let db;
try {
    db = localforage.createInstance({ name: 'firebaseLocalCopy', storeName: 'data' });
    console.log('[SharedWorker] LocalForage initialized');
} catch (e) {
    console.error('[SharedWorker] LocalForage init failed:', e);
}

const firebaseConfig = {
    apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",
    authDomain: "outpost-8d74e.firebaseapp.com",
    databaseURL: "https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/",
    projectId: "outpost-8d74e",
    storageBucket: "outpost-8d74e.firebasestorage.app",
    messagingSenderId: "724993324937",
    appId: "1:724993324937:web:ce6c7e6b06489331c79358",
    measurementId: "G-QPHWRTH6BH"
};

let database;
try {
    const app = firebase.initializeApp(firebaseConfig);
    console.log('[SharedWorker] Firebase initialized');
    database = firebase.database(app);
    firebase.auth().signInAnonymously().then(() => {
        console.log('[SharedWorker] Authenticated anonymously');
    }).catch(e => {
        console.error('[SharedWorker] Auth failed:', e);
    });
} catch (e) {
    console.error('[SharedWorker] Firebase init failed:', e);
}

function logStatus(message) {
    console.log(`[SharedWorker] ${message}`);
    ports.forEach(port => {
        try {
            port.postMessage({ type: 'status', message });
        } catch (e) {
            console.error('[SharedWorker] Failed to send status to port:', e);
        }
    });
}

function sanitizeKey(key) {
    return key.replace(/[\.#$/[\]]/g, '_').replace(/\u2026/g, '...');
}

function setupSync(){
    if (!database) {
        logStatus('Firebase not initialized, skipping sync');
        console.error('[SharedWorker] Firebase not initialized');
        return;
    }
    logStatus('Setting up Firebase sync...');
    console.log('[SharedWorker] Setting up Firebase listener');
    try {
        const rootRef = database.ref('/');
        rootRef.on('value', async (snapshot) => {
            try {
                let data = snapshot.val() || {};
                // Sanitize keys in Firebase data
                data = sanitizeObjectKeys(data);
                console.log('[SharedWorker] Firebase data received:', JSON.stringify(data, null, 2));
                await db.setItem('root', data);
                console.log('[SharedWorker] LocalForage updated with Firebase data');
                logStatus('Firebase data synced to local copy');
            } catch (error) {
                console.error('[SharedWorker] Sync error:', error);
                logStatus('Sync error: ' + error.message);
            }
        }, error => {
            console.error('[SharedWorker] Firebase listener error:', error);
            logStatus('Firebase listener error: ' + error.message);
        });
    } catch (e) {
        console.error('[SharedWorker] Sync setup failed:', e);
        logStatus('Sync setup failed: ' + e.message);
    }
}

function sanitizeObjectKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [sanitizeKey(key), sanitizeObjectKeys(value)])
    );
}

self.onconnect = function(e) {
    const port = e.ports[0];
    ports.push(port);
    console.log('[SharedWorker] Client connected. Total clients:', ports.length);
    logStatus(`Client connected. Total clients: ${ports.length}`);

    port.onclose = () => {
        ports.splice(ports.indexOf(port), 1);
        console.log('[SharedWorker] Client disconnected. Total clients:', ports.length);
        logStatus(`Client disconnected. Total clients: ${ports.length}`);
    };

    port.onmessage = async function(event) {
        let { action, path, data } = event.data;
        console.log('[SharedWorker] Received message:', { action, path, data });
        logStatus(`Received ${action} request for path: ${path || 'N/A'}`);

        try {
            if (!db || !database) throw new Error('Worker not fully initialized');
            if (action === 'ping') {
                console.log('[SharedWorker] Ping received');
                logStatus(`Worker is alive. Total clients: ${ports.length}`);
                port.postMessage({ type: 'response', data: 'Worker is alive' });
                return;
            }
            if (action === 'dump') {
                const localData = await db.getItem('root') || {};
                console.log('[SharedWorker] Dumped local data:', JSON.stringify(localData, null, 2));
                logStatus('Dumped local data');
                port.postMessage({ type: 'response', data: localData });
                return;
            }

            if (!path) throw new Error('Path is required');
            const pathArray = path.split('/').filter(segment => segment !== '').map(sanitizeKey);
            console.log('[SharedWorker] Parsed path:', pathArray);

            const ref = database.ref(path);
            if (action === 'create' || action === 'update') {
                // Sanitize data keys
                data = sanitizeObjectKeys(data);
                await ref.set(data);
                console.log('[SharedWorker] Firebase updated:', { path, data });
                let localData = await db.getItem('root') || {};
                updateNested(localData, pathArray, data);
                await db.setItem('root', localData);
                console.log('[SharedWorker] LocalForage updated:', { path, data });
                logStatus(`Data ${action}d at ${path}`);
                port.postMessage({ type: 'response', path2Query:path,data: 'Data created/updated' });
            } else if (action === 'read') {
                const localData = await db.getItem('root') || {};
                const result = getNested(localData, pathArray);

                if(result == undefined){
                    console.log("undefined in localCopy");
                    logStatus("undefined in localCopy") ;
                }
                console.log('[SharedWorker] Read data from', path, ':', result);
                logStatus(`Read data from ${path}: ${JSON.stringify(result)}`);
                port.postMessage({ type: 'response', path2Query:path,data: result });
            } else if (action === 'delete') {
                await ref.remove();
                console.log('[SharedWorker] Firebase deleted:', path);
                let localData = await db.getItem('root') || {};
                removeNested(localData, pathArray);
                await db.setItem('root', localData);
                console.log('[SharedWorker] LocalForage deleted:', path);
                logStatus(`Deleted data at ${path}`);
                port.postMessage({ type: 'response', path2Query:path,data: 'Data deleted' });
            } else {
                throw new Error('Invalid action');
            }
        } catch (error) {
            console.error('[SharedWorker] Error in', action, ':', error);
            logStatus(`Error in ${action}: ${error.message}`);
            port.postMessage({ type: 'error', error: error.message });
        }
    };

    try {
        port.start();
        console.log('[SharedWorker] Port started');
    } catch (e) {
        console.error('[SharedWorker] Port start failed:', e);
    }
};

try {
    setupSync();
    console.log('[SharedWorker] Sync setup initiated');
} catch (e) {
    console.error('[SharedWorker] Sync setup failed:', e);
}

function updateNested(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
}

function getNested(obj, path) {
    let current = obj;
    for (let key of path) {
        if (current === undefined || current === null) return undefined;
        current = current[key];
    }
    return current;
}

function removeNested(obj, path) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) return;
        current = current[path[i]];
    }
    delete current[path[path.length - 1]];
}