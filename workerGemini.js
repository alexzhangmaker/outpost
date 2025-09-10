// worker_gemini.js - SharedWorker 脚本 for Gemini API
self.onconnect = function(e) {
  const port = e.ports[0];
  port.onmessage = async function(event) {
    const { type, apiKey, model, contents, generationConfig } = event.data;

    if (type === 'callGemini') {
      try {
        // 使用 fetch 调用 Gemini API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: contents || [{ role: 'user', parts: [{ text: 'Hello!' }] }],
              generationConfig: generationConfig || {
                temperature: 0.7,
                maxOutputTokens: 200
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        // 发送响应回主线程
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

  // 启动端口
  port.start();
};