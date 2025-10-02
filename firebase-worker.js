// firebase-worker.js
importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');

// Firebase 配置 - 请替换为你的实际配置
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

class FirebaseWorker {
    constructor() {
        this.cache = localforage.createInstance({ name: 'firebase-cache' });
        this.connectedPorts = new Set();
        this.firebaseRefs = new Map(); // 存储Firebase引用
        this.isFirebaseInitialized = false;
        
        this.initFirebase();
    }

    async initFirebase() {
        try {
            // 动态加载Firebase SDK
            importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
            importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js');
            
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            this.isFirebaseInitialized = true;
            
            console.log('Firebase initialized in SharedWorker');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    async get(path) {
        // 1. 先检查缓存
        const cached = await this.cache.getItem(path);
        if (cached) {
            console.log('Cache hit for:', path);
            return cached;
        }

        // 2. 如果Firebase未初始化，返回空数据
        if (!this.isFirebaseInitialized) {
            return null;
        }

        // 3. 从Firebase获取数据
        try {
            console.log('Fetching from Firebase:', path);
            const snapshot = await this.db.ref(path).once('value');
            const data = snapshot.val();
            
            // 4. 缓存数据
            if (data) {
                await this.cache.setItem(path, data);
            }
            
            return data;
        } catch (error) {
            console.error('Firebase fetch error:', error);
            return null;
        }
    }

    async set(path, data) {
        // 1. 更新缓存
        await this.cache.setItem(path, data);
        
        // 2. 如果Firebase已初始化，同步到Firebase
        if (this.isFirebaseInitialized) {
            try {
                await this.db.ref(path).set(data);
            } catch (error) {
                console.error('Firebase set error:', error);
            }
        }
        
        // 3. 通知所有连接的页面数据已更新
        this.broadcast({ type: 'DATA_UPDATED', path, data });
    }

    async subscribe(path, callback) {
        if (!this.isFirebaseInitialized) {
            return;
        }

        // 设置Firebase实时监听
        const ref = this.db.ref(path);
        ref.on('value', (snapshot) => {
            const data = snapshot.val();
            
            // 更新缓存
            this.cache.setItem(path, data);
            
            // 执行回调
            callback(data);
            
            // 广播给所有页面
            this.broadcast({ type: 'DATA_UPDATED', path, data });
        });

        this.firebaseRefs.set(path, ref);
    }

    async unsubscribe(path) {
        const ref = this.firebaseRefs.get(path);
        if (ref) {
            ref.off();
            this.firebaseRefs.delete(path);
        }
    }

    async clearCache() {
        await this.cache.clear();
        this.broadcast({ type: 'CACHE_CLEARED' });
    }

    // 广播消息给所有连接的页面
    broadcast(message) {
        this.connectedPorts.forEach(port => {
            try {
                port.postMessage(message);
            } catch (error) {
                console.error('Broadcast error:', error);
            }
        });
    }

    // 处理来自页面的消息
    handleMessage(port, data) {
        const { id, method, params } = data;
        const response = (result, error) => {port.postMessage({ id, result, error });};
        try {
            switch (method) {
                case 'get':
                    this.get(params.path).then(result => response(result));
                    break;
                case 'set':
                    this.set(params.path, params.data).then(result => response(result));
                    break;
                case 'subscribe':
                    this.subscribe(params.path, params.callback).then(result => response(result));
                    break;
                case 'unsubscribe':
                    this.unsubscribe(params.path).then(result => response(result));
                    break;
                case 'clearCache':
                    this.clearCache().then(result => response(result));
                    break;
                default:
                    response(null, `Unknown method: ${method}`);
            }
        } catch (error) {
            response(null, error.message);
        }
    }

    addPort(port) {
        this.connectedPorts.add(port);
        port.onmessage = (event) => {this.handleMessage(port, event.data);};
        port.onmessageerror = (error) => {console.error('Message error:', error);};
        port.start();
    }
}

// 创建全局worker实例
const worker = new FirebaseWorker();

// SharedWorker连接事件
self.addEventListener('connect', (event) => {
    const port = event.ports[0];
    worker.addPort(port);
    console.log('New page connected to SharedWorker');
});