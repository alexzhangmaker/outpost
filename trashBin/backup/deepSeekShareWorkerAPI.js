// client.js
import { wrap } from 'https://unpkg.com/comlink/dist/esm/comlink.mjs';

class AIServiceClient {
    constructor() {
        this.worker = null;
        this.proxy = null;
        this.clientId = null;
        this.isConnected = false;
        this._listeners = {};
    }

    // 连接到 Shared Worker
    async connect() {
        try {
            if (typeof SharedWorker === 'undefined') {
                throw new Error('SharedWorker is not supported in this browser');
            }

            this.worker = new SharedWorker('/deepSeekShareWorker.js');
            this.proxy = wrap(this.worker.port);
            
            // 获取客户端 ID
            this.clientId = await this.proxy.getClientId();
            this.isConnected = true;

            // 设置消息监听
            this.setupMessageListener();

            console.log('Connected to AI Service Worker, Client ID:', this.clientId);
            return { success: true, clientId: this.clientId };
        } catch (error) {
            console.error('Failed to connect to Shared Worker:', error);
            return { success: false, error: error.message };
        }
    }

    // 设置消息监听
    setupMessageListener() {
        this.worker.port.addEventListener('message', (event) => {
            this.handleWorkerMessage(event.data);
        });

        this.worker.port.start();
    }

    // 处理来自 Worker 的消息
    handleWorkerMessage(message) {
        const { type, ...data } = message;
        
        console.log(`Received message from worker: ${type}`, data);
        
        switch (type) {
            case 'queue_initialized':
                this.emit('queueInitialized', data);
                break;
                
            case 'request_queued':
                this.emit('requestQueued', data);
                break;
                
            case 'request_processing_started':
                this.emit('requestProcessingStarted', data);
                break;
                
            case 'request_retry':
                this.emit('requestRetry', data);
                break;
                
            case 'request_completed':
                this.emit('requestCompleted', data);
                break;
                
            case 'request_failed':
                this.emit('requestFailed', data);
                break;
                
            case 'request_cancelled':
                this.emit('requestCancelled', data);
                break;
                
            case 'storage_updated':
                this.emit('storageUpdated', data);
                break;
                
            case 'api_config_updated':
                this.emit('apiConfigUpdated', data);
                break;
                
            case 'client_joined':
            case 'client_left':
                this.emit('clientsChanged', data);
                break;
        }
    }

    // 确保连接
    async ensureConnected() {
        if (!this.isConnected) {
            await this.connect();
        }
        return true;
    }

    // ========== Storage 操作 ==========
    async setData(key, value) {
        await this.ensureConnected();
        return await this.proxy.setStorageData(key, value);
    }

    async getData(key) {
        await this.ensureConnected();
        return await this.proxy.getStorageData(key);
    }

    async getAllData() {
        await this.ensureConnected();
        return await this.proxy.getAllStorageData();
    }

    async removeData(key) {
        await this.ensureConnected();
        return await this.proxy.removeStorageData(key);
    }

    // ========== AI API 调用（队列版） ==========
    async callDeepSeek(prompt, options = {}) {
        await this.ensureConnected();
        
        const requestData = {
            prompt,
            model: options.model,
            conversationId: options.conversationId || `conv_${Date.now()}`,
            temperature: options.temperature || 0.7,
            priority: options.priority || 'normal'
        };

        return await this.proxy.callDeepSeek(requestData);
    }

    // ========== 队列管理 API ==========
    async getQueueStatus() {
        await this.ensureConnected();
        return await this.proxy.getQueueStatus();
    }

    async getQueueStatistics() {
        await this.ensureConnected();
        return await this.proxy.getQueueStatistics();
    }

    async cancelQueuedRequest(queueId) {
        await this.ensureConnected();
        return await this.proxy.cancelQueuedRequest(queueId);
    }

    async getGlobalQueueInfo() {
        await this.ensureConnected();
        return await this.proxy.getGlobalQueueInfo();
    }

    // ========== 请求结果查询 ==========
    async getAIRequestResult(requestId) {
        await this.ensureConnected();
        return await this.proxy.getRequestResult(requestId);
    }

    async getConversationHistory(conversationId) {
        await this.ensureConnected();
        return await this.proxy.getConversationHistory(conversationId);
    }

    // ========== 配置 API ==========
    async setApiConfig(config) {
        await this.ensureConnected();
        return await this.proxy.setApiConfig(config);
    }

    async getApiConfig() {
        await this.ensureConnected();
        return await this.proxy.getApiConfig();
    }

    // ========== 系统管理 ==========
    async cleanupQueue() {
        await this.ensureConnected();
        return await this.proxy.cleanupQueue();
    }

    // ========== 事件系统 ==========
    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(callback);
    }

    off(event, callback) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // ========== 工具方法 ==========
    getClientId() {
        return this.clientId;
    }

    isConnected() {
        return this.isConnected;
    }

    // 断开连接
    disconnect() {
        if (this.worker) {
            this.worker.port.postMessage('disconnect');
            this.isConnected = false;
            this.worker = null;
            this.proxy = null;
            this.clientId = null;
        }
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.aiServiceClient = new AIServiceClient();
}

// ES6 模块导出
export default AIServiceClient;