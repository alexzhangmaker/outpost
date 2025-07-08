//importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');
//importScripts('https://unpkg.com/localforage/dist/localforage.min.js');
importScripts('./jsResource/localforage.min.js');

console.log('webWorker running') ;
// worker.js

self.onmessage = async (event) => {

  switch(event.data.action){
    case 'sendPost':
      _doSendPost(event.data.data) ;
      break;
    case "GoogleDict":
      _doGoogleDict(event.data.data) ;
      break ;
  }
};


async function _doGoogleDict(jsonGoogleDict){
  console.log(jsonGoogleDict) ;

  let keyLocalForage = `_GoogleDict_${jsonGoogleDict.timeStamp}` ;
  //localStorage.setItem(keyLocalForage, JSON.stringify(jsonGoogleDict));
  let url=`https://outpost-8d74e.asia-southeast1.firebasedatabase.app/GoogleDicts.json` ;
  
}


async function _doSendPost(jsonContent){
    console.log(jsonContent) ;
    
}