// page-api.js
class FirebaseLikeAPI {
    constructor() {
        this.worker = null;
        this.proxy = null;
        this.subscriptions = new Map();
        this.requestId = 0;
        this.pendingRequests = new Map();
        
        this.initWorker();
    }

    async initWorker() {
        try {
            // 检查SharedWorker支持
            if (!window.SharedWorker) {
                throw new Error('SharedWorker not supported');
            }

            // 创建或连接到SharedWorker
            this.worker = new SharedWorker('/firebase-worker.js');
            
            // 设置消息监听
            this.worker.port.onmessage = (event) => {
                this.handleWorkerMessage(event.data);
            };

            this.worker.port.start();
            
            console.log('SharedWorker connection established');
        } catch (error) {
            console.error('Failed to initialize SharedWorker:', error);
            this.fallbackToLocalStorage();
        }
    }

    fallbackToLocalStorage() {
        console.warn('Falling back to localStorage');
        // 这里可以实现降级方案
    }

    handleWorkerMessage(data) {
        // 处理响应消息
        if (data.id !== undefined && this.pendingRequests.has(data.id)) {
            const { resolve, reject } = this.pendingRequests.get(data.id);
            this.pendingRequests.delete(data.id);
            
            if (data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data.result);
            }
        }
        
        // 处理广播消息
        if (data.type === 'DATA_UPDATED') {
            this.handleDataUpdate(data.path, data.data);
        }
    }

    handleDataUpdate(path, data) {
        // 通知所有订阅者
        if (this.subscriptions.has(path)) {
            this.subscriptions.get(path).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Subscription callback error:', error);
                }
            });
        }
    }

    async callWorker(method, params) {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker not initialized'));
                return;
            }

            const id = this.requestId++;
            this.pendingRequests.set(id, { resolve, reject });
            
            this.worker.port.postMessage({ id, method, params });
            
            // 超时处理
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }

    // Firebase-like API 接口
    async ref(path) {
        return {
            once: async (eventType = 'value') => {
                if (eventType !== 'value') {
                    throw new Error('Only "value" event is supported');
                }
                const data = await this.callWorker('get', { path });
                return { val: () => data };
            },
            
            set: async (data) => {
                await this.callWorker('set', { path, data });
                return this;
            },
            
            on: (eventType, callback) => {
                if (eventType !== 'value') {
                    throw new Error('Only "value" event is supported');
                }
                
                if (!this.subscriptions.has(path)) {
                    this.subscriptions.set(path, new Set());
                    // 首次订阅，告诉worker开始监听
                    this.callWorker('subscribe', { 
                        path, 
                        callback: (data) => this.handleDataUpdate(path, data) 
                    });
                }
                
                this.subscriptions.get(path).add(callback);
                
                // 返回取消订阅函数
                return () => {
                    const callbacks = this.subscriptions.get(path);
                    if (callbacks) {
                        callbacks.delete(callback);
                        if (callbacks.size === 0) {
                            this.subscriptions.delete(path);
                            this.callWorker('unsubscribe', { path });
                        }
                    }
                };
            },
            
            off: () => {
                this.subscriptions.delete(path);
                this.callWorker('unsubscribe', { path });
            }
        };
    }

    // 便捷方法
    async getValue(path) {
        const data = await this.callWorker('get', { path });
        return data;
    }

    async setValue(path, value) {
        await this.callWorker('set', { path, data: value });
    }

    // 缓存管理
    async clearCache() {
        await this.callWorker('clearCache');
    }
}

// 创建全局实例
window.firebaseAPI = new FirebaseLikeAPI();