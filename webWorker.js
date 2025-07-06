// worker.js
self.onmessage = async (event) => {
  if (event.data.action === 'sendPost') {
    try {
      const response = await fetch(event.data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data.data)
      });
      const result = await response.json();
      self.postMessage(result);
    } catch (error) {
      self.postMessage({
        status: 'error',
        message: error.toString()
      });
    }
  }
};