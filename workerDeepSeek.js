const DEEPSEEK_API_KEY = 'sk-c12eb88de64343dab7b42852cfc5163d'; // 替换为你的DeepSeek API密钥
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // 假设的API端点



// worker.js - SharedWorker 脚本
self.onconnect = function(e) {
  const port = e.ports[0];
  port.onmessage = async function(event) {
    const { type, apiKey, model, messages } = event.data;  // 从主线程接收参数

    if (type === 'callDeepSeek') {
      try {
        // 使用 fetch 调用 DeepSeek API
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`  // 使用传递的 API 密钥
          },
          body: JSON.stringify({
            model: model || 'deepseek-chat',  // 默认模型，可指定 'deepseek-reasoner'
            messages: messages || [{ role: 'user', content: 'Hello!' }],  // 消息数组
            stream: false  // 非流式响应；设为 true 可实现流式
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;  // 提取 AI 响应

        // 发送响应回主线程（通过 port）
        port.postMessage({
          type: 'response',
          success: true,
          data: aiResponse
        });
      } catch (error) {
        // 处理错误（如网络问题、API 限额）
        port.postMessage({
          type: 'response',
          success: false,
          error: error.message
        });
      }
    }
  };

  // 启动 port 以启用双向通信
  port.start();
};