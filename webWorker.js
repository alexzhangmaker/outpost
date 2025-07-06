importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');


// worker.js
self.onmessage = async (event) => {
  if (event.data.action === 'sendPost') {
    try {

      let jsonMessage = event.data.data ;
      console.log(jsonMessage) ;
      //await localforage.set(`google_${jsonMessage.timeStamp}`, JSON.stringify(jsonMessage));
      localforage.setItem(`google_${jsonMessage.timeStamp}`, JSON.stringify(jsonMessage), function (err) {
          // if err is non-null, we got an error
          console.log(`localforage.setItem error:${err}`) ;
          if(err != null)return ;
          
          localforage.getItem(`google_${jsonMessage.timeStamp}`, function (err, value) {
          // if err is non-null, we got an error. otherwise, value is the value
            if(err != null){
              console.log(`localforage.getItem error:${err}`) ;
            }else{
              console.log(`localforage.getItem ${value}`)  ;
            }
          });
          
      });
      /*
      const response = await fetch(event.data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data.data)
      });
      const result = await response.json();
      */

      let jsonResult={
        status:"success",
        retCode:"200"
      } ;
      self.postMessage(jsonResult);
    } catch (error) {
      self.postMessage({
        status: 'error',
        message: error.toString()
      });
    }
  }
};