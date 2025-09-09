// Ensure SharedWorker is instantiated only once
let gSharedWorker, gSharedWorkerPort;
function initializeSharedWorker() {
    if (gSharedWorker) {
        console.log('[Main] SharedWorker already initialized');
        return;
    }
    try {
        gSharedWorker = new SharedWorker('worker.js');
        console.log('[Main] SharedWorker instantiated');
        gSharedWorkerPort = gSharedWorker.port;

        gSharedWorkerPort.onmessage = function(event) {
            console.log('[Main] Received from worker:', event.data);
            const { type, data, error, message } = event.data;
            const statusDiv = document.getElementById('workerStatus');
            const statusEl = document.getElementById('status');
            const errorEl = document.getElementById('error');
            const dataDisplayEl = document.getElementById('dataDisplay');

            if (type === 'status') {
                if (statusDiv) {
                    statusDiv.textContent += `[${new Date().toLocaleTimeString()}] ${message}\n`;
                    statusDiv.scrollTop = statusDiv.scrollHeight;
                } else {
                    console.error('[Main] workerStatus element not found');
                }
            } else if (type === 'response') {
                if (statusEl) statusEl.textContent = 'Operation successful!';
                if (errorEl) errorEl.textContent = '';
                if (dataDisplayEl) dataDisplayEl.textContent = JSON.stringify(data, null, 2) || 'No data returned.';
            } else if (type === 'error') {
                if (statusEl) statusEl.textContent = '';
                if (errorEl) errorEl.textContent = error;
                if (dataDisplayEl) dataDisplayEl.textContent = '';
            } else if (type === 'sync') {
                if (statusEl) statusEl.textContent = 'Data synced from Firebase.';
            }
        };

        gSharedWorkerPort.start();
        console.log('[Main] Port started');
        window.sharedWorker = gSharedWorker; // Prevent garbage collection
    } catch (e) {
        console.error('[Main] Failed to initialize SharedWorker:', e);
        const errorEl = document.getElementById('error');
        if (errorEl) errorEl.textContent = 'Failed to start SharedWorker: ' + e.message;
    }
}


function performOperation(action) {
    if (!gSharedWorkerPort) {
        console.error('[Main] SharedWorker port not initialized');
        document.getElementById('error').textContent = 'SharedWorker not initialized';
        return;
    }
    const path = document.getElementById('path').value.trim();
    let data;
    if (action === 'create' || action === 'update') {
        try {
            data = JSON.parse(document.getElementById('data').value);
        } catch (e) {
            document.getElementById('error').textContent = 'Invalid JSON data.';
            return;
        }
    }
    if (action !== 'dump' && action !== 'ping' && !path) {
        document.getElementById('error').textContent = 'Path is required.';
        return;
    }
    console.log('[Main] Sending message:', { action, path, data });
    gSharedWorkerPort.postMessage({ action, path, data });
    document.getElementById('status').textContent = 'Processing...';
    document.getElementById('error').textContent = '';
    document.getElementById('dataDisplay').textContent = '';
}

let _onResponseMessage=null ;



function initSharedWorkerUser(cbResponse) {
    if (gSharedWorker) {
        console.log('[Main] SharedWorker already initialized');
        return;
    }
    try {
        gSharedWorker = new SharedWorker('worker.js');
        console.log('[Main] SharedWorker instantiated');
        gSharedWorkerPort = gSharedWorker.port;
        _onResponseMessage = cbResponse ;

        gSharedWorkerPort.onmessage = function(event) {
            console.log('[Main] Received from worker:', event.data);
            const { type, path2Query,data, error, message } = event.data;

            if (type === 'status') {
                console.log(message) ;
            } else if (type === 'response') {
                if(_onResponseMessage!=null){
                    _onResponseMessage(path2Query,data) ;
                }
            } else if (type === 'error') {
                console.log(error) ;
            } else if (type === 'sync') {
                console.log('Data synced from Firebase.');
            }
        };

        gSharedWorkerPort.start();
        console.log('[Main] Port started');
        window.sharedWorker = gSharedWorker; // Prevent garbage collection
    } catch (e) {
        console.error('[Main] Failed to initialize SharedWorker:', e);
    }
}


function initSharedWorkerUserAsync() {
    if (gSharedWorker) {
        console.log('[Main] SharedWorker already initialized');
        return;
    }
    try {
        gSharedWorker = new SharedWorker('worker.js');
        console.log('[Main] SharedWorker instantiated');
        gSharedWorkerPort = gSharedWorker.port;

        gSharedWorkerPort.onmessage = function(event) {
            console.log('[Main] Received from worker:', event.data);
            const { type, data, error, message } = event.data;

            if (type === 'status') {
                console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
            } else if (type === 'response') {
                console.log('[Main] Displayed data:', data);
            } else if (type === 'error') {
                console.log(error) ;
            } else if (type === 'sync') {
                console.log('Data synced from Firebase.');
            }
        };

        gSharedWorkerPort.start();
        console.log('[Main] Port started');
        window.sharedWorker = gSharedWorker; // Prevent garbage collection
    } catch (e) {
        console.error('[Main] Failed to initialize SharedWorker:', e);
    }
}


// Async function to read data from SharedWorker and wait for response
async function readDataAsync(path) {
    if (!gSharedWorkerPort) {
        throw new Error('SharedWorker port not initialized');
    }
    return new Promise((resolve, reject) => {
        // Create a one-time message handler
        const handler = (event) => {
            const { type, data, error } = event.data;
            if (type === 'response') {
                console.log("will resolve data") ;
                console.log(event.data/*.path === path*/) ;
                gSharedWorkerPort.removeEventListener('message', handler);
                resolve(data);
            } else if (type === 'error' && event.data.path === path) {
                gSharedWorkerPort.removeEventListener('message', handler);
                reject(new Error(error));
            }
        };
        gSharedWorkerPort.addEventListener('message', handler);
        // Send read request with path for correlation
        gSharedWorkerPort.postMessage({ action: 'read', path });
    });
}


function userOperation(action,path="/",data={}) {
    if (!gSharedWorkerPort) {
        console.error('[Main] SharedWorker port not initialized');
        return;
    }
    switch(action){
        case "ping":
            _actionPing();
            break ;
        case "read":
            _actionRead(path) ;
            break ;
        default:
            console.log('performOperation onDefault') ;
        break ;
    }
    /*
    if (action === 'create' || action === 'update') {
        try {
            data = JSON.parse(document.getElementById('data').value);
        } catch (e) {
            document.getElementById('error').textContent = 'Invalid JSON data.';
            return;
        }
    }
    if (action !== 'dump' && action !== 'ping' && !path) {
        document.getElementById('error').textContent = 'Path is required.';
        return;
    }
    console.log('[Main] Sending message:', { action, path, data });
    gSharedWorkerPort.postMessage({ action, path, data });
    document.getElementById('status').textContent = 'Processing...';
    document.getElementById('error').textContent = '';
    document.getElementById('dataDisplay').textContent = '';
    */
}


function _actionRead(path){
    let action="read" ;
    let data='' ;
    gSharedWorkerPort.postMessage({action,path,data});
}

function _actionPing(){
    let action="ping" ;
    let path = "/" ;
    let data = {} ;
    gSharedWorkerPort.postMessage({action,path,data});

}



// Handle async read operation from UI
async function performReadAsync() {
    const path = document.getElementById('path').value.trim();
    if (!path) {
        document.getElementById('error').textContent = 'Path is required.';
        return;
    }
    const sanitizedPath = path.split('/').map(sanitizeKey).join('/');
    document.getElementById('status').textContent = 'Processing...';
    document.getElementById('error').textContent = '';
    document.getElementById('dataDisplay').textContent = '';
    try {
        console.log('[Main] Sending async read request for path:', sanitizedPath);
        const data = await readDataAsync(sanitizedPath);
        document.getElementById('status').textContent = 'Operation successful!';
        document.getElementById('dataDisplay').textContent = JSON.stringify(data, null, 2) || 'No data returned.';
        console.log('[Main] Async read result:', data);
    } catch (error) {
        document.getElementById('status').textContent = '';
        document.getElementById('error').textContent = `Async read failed: ${error.message}`;
        console.error('[Main] Async read error:', error);
    }
}

