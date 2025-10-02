// shared-worker.js
importScripts('https://unpkg.com/comlink/dist/umd/comlink.js');
importScripts('https://unpkg.com/localforage/dist/localforage.min.js');

class AIServiceWorker {
    constructor() {
        this.clients = new Map();
        this.requestQueue = [];
        this.isProcessing = false;
        this.maxConcurrentRequests = 1;
        this.activeRequests = new Map();
        this.initializeStorage();
        this.apiConfig = {
            baseURL: 'https://api.deepseek.com/v1',
            defaultModel: 'deepseek-chat'
        };
        
        // 初始化时加载持久化的队列数据
        this.initializeQueueFromStorage().then(() => {
            console.log('队列初始化完成，待处理请求:', this.requestQueue.length);
            this.processQueue();
        });
    }

    // 初始化存储
    initializeStorage() {
        this.storage = localforage.createInstance({
            name: 'AIExtensionDB',
            version: 1.0,
            storeName: 'ai_data',
            description: 'AI Extension Storage'
        });
    }

    // 从存储中初始化队列
    async initializeQueueFromStorage() {
        try {
            console.log('正在从存储加载队列数据...');
            const allKeys = await this.storage.keys();
            const queueKeys = allKeys.filter(key => key.startsWith('queue_'));
            console.log(`找到 ${queueKeys.length} 个队列项目`);
            
            for (const key of queueKeys) {
                try {
                    const queueItem = await this.storage.getItem(key);
                    if (queueItem && this.isValidQueueItem(queueItem)) {
                        if (queueItem.status === 'processing') {
                            console.log(`恢复中断的请求: ${queueItem.id}`);
                            queueItem.status = 'pending';
                            queueItem.retryCount = (queueItem.retryCount || 0) + 1;
                            queueItem.lastRetryAt = new Date().toISOString();
                        }
                        
                        if (queueItem.status === 'pending' || queueItem.status === 'processing') {
                            this.requestQueue.push(queueItem);
                        }
                    }
                } catch (error) {
                    console.error(`加载队列项目 ${key} 失败:`, error);
                }
            }
            
            this.sortQueue();
            console.log(`队列恢复完成，共 ${this.requestQueue.length} 个待处理请求`);
            
        } catch (error) {
            console.error('初始化队列失败:', error);
        }
    }

    // 验证队列项目有效性
    isValidQueueItem(item) {
        return item && item.id && item.clientId && item.requestData && item.createdAt;
    }

    // 按优先级和创建时间排序队列
    sortQueue() {
        this.requestQueue.sort((a, b) => {
            const priorityOrder = { high: 0, normal: 1, low: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }

    // 注册客户端
    registerClient(clientId, port) {
        this.clients.set(clientId, {
            port,
            info: { 
                registeredAt: new Date().toISOString(),
                lastActivity: new Date().toISOString()
            }
        });
        
        console.log(`客户端 ${clientId} 已注册，当前客户端数: ${this.clients.size}`);
        
        this.notifyClient(clientId, {
            type: 'queue_initialized',
            queueLength: this.requestQueue.length,
            activeRequests: this.activeRequests.size,
            timestamp: Date.now()
        });
        
        return { success: true, clientId };
    }

    // 添加到队列
    async addToQueue(requestData, clientId) {
        const queueItem = {
            id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clientId,
            requestData,
            status: 'pending',
            priority: requestData.priority || 'normal',
            createdAt: new Date().toISOString(),
            addedToQueueAt: new Date().toISOString(),
            retryCount: 0
        };

        await this.saveQueueItem(queueItem);
        this.insertToQueueByPriority(queueItem);

        this.notifyClient(clientId, {
            type: 'request_queued',
            queueId: queueItem.id,
            position: this.getQueuePosition(queueItem.id),
            estimatedWaitTime: this.calculateWaitTime(),
            totalInQueue: this.requestQueue.length
        });

        this.processQueue();

        return {
            success: true,
            queueId: queueItem.id,
            position: this.getQueuePosition(queueItem.id),
            estimatedWaitTime: this.calculateWaitTime(),
            totalInQueue: this.requestQueue.length
        };
    }

    // 按优先级插入队列
    insertToQueueByPriority(queueItem) {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const newItemPriority = priorityOrder[queueItem.priority];
        
        let insertIndex = this.requestQueue.length;
        for (let i = 0; i < this.requestQueue.length; i++) {
            const currentPriority = priorityOrder[this.requestQueue[i].priority];
            if (newItemPriority < currentPriority) {
                insertIndex = i;
                break;
            }
        }
        
        this.requestQueue.splice(insertIndex, 0, queueItem);
    }

    // 获取队列位置
    getQueuePosition(queueId) {
        return this.requestQueue.findIndex(item => item.id === queueId) + 1;
    }

    // 计算预计等待时间
    calculateWaitTime() {
        const avgProcessingTime = 5000;
        const pendingCount = this.requestQueue.filter(item => item.status === 'pending').length;
        return pendingCount * avgProcessingTime;
    }

    // 保存队列项到存储
    async saveQueueItem(queueItem) {
        try {
            await this.storage.setItem(`queue_${queueItem.id}`, queueItem);
        } catch (error) {
            console.error('保存队列项失败:', error);
            throw error;
        }
    }

    // 队列处理器
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        if (this.activeRequests.size >= this.maxConcurrentRequests) {
            setTimeout(() => this.processQueue(), 1000);
            return;
        }

        this.isProcessing = true;

        try {
            const nextRequest = this.requestQueue.find(item => item.status === 'pending');
            if (!nextRequest) {
                this.isProcessing = false;
                setTimeout(() => this.processQueue(), 5000);
                return;
            }

            nextRequest.status = 'processing';
            nextRequest.startedProcessingAt = new Date().toISOString();
            nextRequest.lastAttemptAt = new Date().toISOString();
            
            this.activeRequests.set(nextRequest.id, nextRequest);
            await this.saveQueueItem(nextRequest);

            this.notifyClient(nextRequest.clientId, {
                type: 'request_processing_started',
                queueId: nextRequest.id,
                startedAt: nextRequest.startedProcessingAt,
                retryCount: nextRequest.retryCount || 0
            });

            console.log(`开始处理队列请求: ${nextRequest.id}, 重试次数: ${nextRequest.retryCount || 0}`);

            this.processSingleRequest(nextRequest).finally(() => {
                this.activeRequests.delete(nextRequest.id);
                this.isProcessing = false;
                setTimeout(() => this.processQueue(), 100);
            });

        } catch (error) {
            console.error('队列处理错误:', error);
            this.isProcessing = false;
            setTimeout(() => this.processQueue(), 1000);
        }
    }

    // 处理单个请求
    async processSingleRequest(queueItem) {
        const maxRetries = 3;
        
        try {
            const { requestData, clientId, id: queueId } = queueItem;
            const apiResult = await this.callDeepSeekAPI(requestData, clientId);

            queueItem.status = 'completed';
            queueItem.completedAt = new Date().toISOString();
            queueItem.result = apiResult;

            this.activeRequests.delete(queueId);
            this.requestQueue = this.requestQueue.filter(item => item.id !== queueId);
            await this.saveQueueItem(queueItem);

            // 5分钟后清理
            setTimeout(async () => {
                try {
                    await this.storage.removeItem(`queue_${queueId}`);
                } catch (error) {
                    console.error(`清理队列项目 ${queueId} 失败:`, error);
                }
            }, 300000);

            this.notifyClient(clientId, {
                type: 'request_completed',
                queueId,
                result: apiResult,
                completedAt: queueItem.completedAt,
                retryCount: queueItem.retryCount || 0
            });

            console.log(`队列请求 ${queueId} 处理完成`);

        } catch (error) {
            const currentRetryCount = queueItem.retryCount || 0;
            
            if (currentRetryCount < maxRetries) {
                queueItem.status = 'pending';
                queueItem.retryCount = currentRetryCount + 1;
                queueItem.lastError = error.message;
                queueItem.lastRetryAt = new Date().toISOString();
                
                console.log(`队列请求 ${queueId} 失败，准备重试 (${queueItem.retryCount}/${maxRetries}):`, error.message);
                
                await this.saveQueueItem(queueItem);
                
                this.notifyClient(queueItem.clientId, {
                    type: 'request_retry',
                    queueId: queueItem.id,
                    retryCount: queueItem.retryCount,
                    maxRetries: maxRetries,
                    error: error.message
                });
                
            } else {
                queueItem.status = 'failed';
                queueItem.failedAt = new Date().toISOString();
                queueItem.error = error.message;
                queueItem.finalError = `经过 ${maxRetries} 次重试后失败: ${error.message}`;

                this.activeRequests.delete(queueItem.id);
                await this.saveQueueItem(queueItem);

                this.notifyClient(queueItem.clientId, {
                    type: 'request_failed',
                    queueId: queueItem.id,
                    error: queueItem.finalError,
                    failedAt: queueItem.failedAt,
                    retryCount: queueItem.retryCount
                });

                console.error(`队列请求 ${queueItem.id} 最终失败:`, error);
            }
        }
    }

    // ========== 队列状态查询方法 ==========
    
    // 获取客户端队列状态 - 修复方法名
    async getQueueStatus(clientId) {
        const clientQueue = this.requestQueue.filter(item => item.clientId === clientId);
        const pendingCount = clientQueue.filter(item => item.status === 'pending').length;
        const processingCount = clientQueue.filter(item => item.status === 'processing').length;

        return {
            success: true,
            queueStatus: {
                total: clientQueue.length,
                pending: pendingCount,
                processing: processingCount,
                position: pendingCount > 0 ? this.getQueuePosition(clientQueue[0].id) : 0,
                estimatedWaitTime: this.calculateWaitTime()
            },
            items: clientQueue
        };
    }

    // 获取队列统计信息
    async getQueueStatistics() {
        const now = new Date();
        const pendingRequests = this.requestQueue.filter(item => item.status === 'pending');
        const processingRequests = this.requestQueue.filter(item => item.status === 'processing');
        
        let totalWaitTime = 0;
        let completedCount = 0;
        
        try {
            const allKeys = await this.storage.keys();
            const completedKeys = allKeys.filter(key => key.startsWith('queue_'));
            
            for (const key of completedKeys.slice(0, 10)) {
                const item = await this.storage.getItem(key);
                if (item && item.status === 'completed' && item.startedProcessingAt && item.addedToQueueAt) {
                    const waitTime = new Date(item.startedProcessingAt) - new Date(item.addedToQueueAt);
                    totalWaitTime += waitTime;
                    completedCount++;
                }
            }
        } catch (error) {
            console.error('计算统计信息失败:', error);
        }
        
        const avgWaitTime = completedCount > 0 ? totalWaitTime / completedCount : 0;
        
        return {
            total: this.requestQueue.length,
            pending: pendingRequests.length,
            processing: processingRequests.length,
            active: this.activeRequests.size,
            clients: this.clients.size,
            avgWaitTime: Math.round(avgWaitTime / 1000),
            estimatedWaitTime: this.calculateWaitTime()
        };
    }

    // 取消队列中的请求
    async cancelQueuedRequest(queueId, clientId) {
        const queueItem = this.requestQueue.find(item => 
            item.id === queueId && item.clientId === clientId
        );

        if (!queueItem) {
            return { success: false, error: 'Request not found in queue' };
        }

        if (queueItem.status !== 'pending') {
            return { success: false, error: 'Cannot cancel request that is already processing' };
        }

        this.requestQueue = this.requestQueue.filter(item => item.id !== queueId);
        queueItem.status = 'cancelled';
        queueItem.cancelledAt = new Date().toISOString();
        await this.saveQueueItem(queueItem);

        this.notifyClient(clientId, {
            type: 'request_cancelled',
            queueId,
            cancelledAt: queueItem.cancelledAt
        });

        return { success: true, queueId };
    }

    // 获取全局队列信息
    async getGlobalQueueInfo() {
        return {
            success: true,
            globalQueue: {
                total: this.requestQueue.length,
                pending: this.requestQueue.filter(item => item.status === 'pending').length,
                processing: this.requestQueue.filter(item => item.status === 'processing').length,
                activeRequests: this.activeRequests.size,
                maxConcurrent: this.maxConcurrentRequests
            },
            clients: {
                total: this.clients.size,
                active: Array.from(this.clients.keys())
            }
        };
    }

    // 清理过期的队列项目
    async cleanupExpiredQueueItems() {
        try {
            const allKeys = await this.storage.keys();
            const queueKeys = allKeys.filter(key => key.startsWith('queue_'));
            const now = new Date();
            let cleanedCount = 0;
            
            for (const key of queueKeys) {
                const item = await this.storage.getItem(key);
                if (item && this.isItemExpired(item, now)) {
                    await this.storage.removeItem(key);
                    cleanedCount++;
                    this.requestQueue = this.requestQueue.filter(qItem => qItem.id !== item.id);
                }
            }
            
            console.log(`清理了 ${cleanedCount} 个过期的队列项目`);
            return cleanedCount;
            
        } catch (error) {
            console.error('清理队列项目失败:', error);
            return 0;
        }
    }

    // 判断项目是否过期
    isItemExpired(item, now = new Date()) {
        const itemTime = new Date(item.createdAt);
        const hoursDiff = (now - itemTime) / (1000 * 60 * 60);
        
        if (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled') {
            return hoursDiff > 24;
        }
        
        return hoursDiff > 48;
    }

    // DeepSeek API 调用
    async callDeepSeekAPI(requestData, clientId) {
        const { prompt, model, conversationId, temperature = 0.7 } = requestData;
        
        if (!prompt) {
            throw new Error('Prompt is required');
        }

        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 准备请求数据
        const apiRequest = {
            model: model || this.apiConfig.defaultModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: temperature,
            max_tokens: 2048,
            stream: false
        };

        // 保存请求记录
        const requestRecord = {
            requestId,
            clientId,
            prompt,
            model: apiRequest.model,
            status: 'processing',
            createdAt: new Date().toISOString(),
            requestData: apiRequest
        };

        await this.storage.setItem(`request_${requestId}`, requestRecord);

        // 调用 DeepSeek API
        const response = await this.makeDeepSeekRequest(apiRequest);
        
        // 更新请求记录
        const completedRecord = {
            ...requestRecord,
            status: 'completed',
            completedAt: new Date().toISOString(),
            response: response
        };

        await this.storage.setItem(`request_${requestId}`, completedRecord);

        return {
            success: true,
            requestId,
            response,
            timestamp: Date.now()
        };
    }

    // 实际的 API 调用
    async makeDeepSeekRequest(requestData) {
        const API_KEY = await this.getApiKey();
        
        if (!API_KEY) {
            throw new Error('DeepSeek API Key not configured');
        }

        const response = await fetch(`${this.apiConfig.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        return await response.json();
    }

    // 获取 API Key
    async getApiKey() {
        try {
            const config = await this.storage.getItem('DeepSeek_API_Config');
            //return "sk-687556a7509a4799a20aa9566dd94ec3" ;
            return config?.value?.apiKey || "sk-687556a7509a4799a20aa9566dd94ec3";
        } catch (error) {
            return "sk-687556a7509a4799a20aa9566dd94ec3";
        }
    }

    // 设置 API 配置
    async setApiConfig(config, clientId) {
        try {
            await this.storage.setItem('DeepSeek_API_Config', {
                value: config,
                metadata: {
                    configuredBy: clientId,
                    configuredAt: new Date().toISOString()
                }
            });

            this.notifyClient(clientId, {
                type: 'api_config_updated',
                clientId,
                timestamp: Date.now()
            });

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Storage 操作方法
    async setStorageData(key, value, clientId) {
        try {
            await this.storage.setItem(key, {
                value,
                metadata: {
                    createdBy: clientId,
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                }
            });
            
            this.notifyClient(clientId, {
                type: 'storage_updated',
                action: 'set',
                key,
                value,
                clientId,
                timestamp: Date.now()
            });
            
            return { success: true, key, value };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getStorageData(key, clientId) {
        try {
            const result = await this.storage.getItem(key);
            return { 
                success: true, 
                key, 
                value: result?.value,
                metadata: result?.metadata 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAllStorageData(clientId) {
        try {
            const keys = await this.storage.keys();
            const data = {};
            
            for (const key of keys) {
                const item = await this.storage.getItem(key);
                data[key] = item;
            }
            
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async removeStorageData(key, clientId) {
        try {
            await this.storage.removeItem(key);
            
            this.notifyClient(clientId, {
                type: 'storage_updated',
                action: 'remove',
                key,
                clientId,
                timestamp: Date.now()
            });
            
            return { success: true, key };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // 通知客户端
    notifyClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.port) {
            try {
                client.port.postMessage({
                    ...message,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error(`通知客户端 ${clientId} 失败:`, error);
            }
        }
    }
}

// 处理 Shared Worker 连接
self.addEventListener('connect', function(e) {
    const port = e.ports[0];
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 使用单例模式
    if (!self.aiServiceInstance) {
        self.aiServiceInstance = new AIServiceWorker();
        
        // 定期清理过期项目（每小时一次）
        setInterval(() => {
            self.aiServiceInstance.cleanupExpiredQueueItems();
        }, 60 * 60 * 1000);
    }

    const aiService = self.aiServiceInstance;

    // 注册客户端
    aiService.registerClient(clientId, port);

    // 使用 Comlink 暴露 API - 确保方法名称一致
    const exposedAPI = {
        // Storage 操作
        setStorageData: (key, value) => aiService.setStorageData(key, value, clientId),
        getStorageData: (key) => aiService.getStorageData(key, clientId),
        getAllStorageData: () => aiService.getAllStorageData(clientId),
        removeStorageData: (key) => aiService.removeStorageData(key, clientId),
        
        // AI API（支持队列）
        callDeepSeek: (requestData) => aiService.callDeepSeekWithQueue ? 
            aiService.callDeepSeekWithQueue(requestData.prompt, { ...requestData, clientId }) :
            aiService.addToQueue(requestData, clientId),
        
        // 队列管理 API - 确保方法名称与 client.js 调用一致
        getQueueStatus: () => aiService.getQueueStatus(clientId),
        getQueueStatistics: () => aiService.getQueueStatistics(),
        cancelQueuedRequest: (queueId) => aiService.cancelQueuedRequest(queueId, clientId),
        getGlobalQueueInfo: () => aiService.getGlobalQueueInfo(),
        
        // 系统管理 API
        cleanupQueue: () => aiService.cleanupExpiredQueueItems(),
        
        // 其他方法
        getRequestResult: (requestId) => aiService.getRequestResult ? 
            aiService.getRequestResult(requestId, clientId) : 
            { success: false, error: 'Method not implemented' },
            
        setApiConfig: (config) => aiService.setApiConfig(config, clientId),
        getApiConfig: () => aiService.getApiKey ? aiService.getApiKey() : null,
        getClientId: () => clientId
    };

    Comlink.expose(exposedAPI, port);
    port.start();
});