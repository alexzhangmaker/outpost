let gGoogleDicts=[] ;

function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
  
function isMobile() {
    // Check for iOS or other mobile indicators
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
  
// Usage
if (isIOS()) {
    console.log("This is an iOS device (iPhone, iPad, or iPod).");
}else if (isMobile()) {
    console.log("This is a mobile device (non-iOS).");
} else {
    console.log("This is likely a desktop browser.");
}

async function _loadGoogleDicts(){
    gGoogleDicts=[] ;
    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/GoogleDicts.json";
    const res = await fetch(firebaseUrl);
    gGoogleDicts = await res.json();
    console.log(gGoogleDicts) ;
}


async function renderDictOutput(tagOutputContainer,jsonDict,dictIndex,GoogleTTSAvailable){
    let tagOutput = document.createElement('li') ;
    tagOutput.classList.add('dictAnywhereItem') ;
    let cDate = new Date(jsonDict.timeStamp) ;
    console.log(cDate.toLocaleString()) ;

    let showHidePlay='showPlay';//GoogleTTSAvailable?'showPlay':'noShow' ;
    tagOutput.innerHTML=`
        <div class="dictAnywhereItemContent">
            <span>${jsonDict.textTh}/${jsonDict.meaningEn}</span>
            <div class="dictAnywhereItemTools noShow">
                <i class="bi-play-circle flashBTN ${showHidePlay}" id="idBTNPlayAudio"></i>
                <i class="bi-recycle flashBTN" id="idBTNDelete"></i>
                <i class="bi-file flashBTN" id="idBTN2Check"></i>
                <i class="bi-file-check flashBTN noShow" id="idBTNChecked"></i>
            </div>
        </div>
    ` ;
    tagOutputContainer.prepend(tagOutput) ;
    tagOutput.dataset.dictIndex = dictIndex ;
    if(isMobile()!=true){
        tagOutput.querySelector('.dictAnywhereItemTools').classList.remove('noShow') ;
    }

    tagOutput.querySelector('#idBTN2Check').addEventListener('click',(event)=>{
        event.target.classList.add('noShow') ;
        tagOutput.querySelector('#idBTNChecked').classList.remove('noShow');            
    }) ;

    tagOutput.querySelector('#idBTNChecked').addEventListener('click',(event)=>{
        event.target.classList.add('noShow') ;
        tagOutput.querySelector('#idBTN2Check').classList.remove('noShow');
    }) ;

    tagOutput.querySelector('#idBTNDelete').addEventListener('click',(event)=>{
        tagOutput.remove();
        let dictIndex = parseInt(tagOutput.dataset.dictIndex) ;
        gGoogleDicts.splice(dictIndex,1) ;
        sync2Firebase(gGoogleDicts) ;
    }) ;
    //idBTNPlayAudio
    tagOutput.querySelector('#idBTNPlayAudio').addEventListener('click',(event)=>{
        const text = jsonDict.textTh;//tagOutput.querySelector("text").value;
        //const urlGoogleTTSProxy = `http://192.168.1.188:3010/tts?q=${text}` ;
        const urlGoogleTTSProxy = `https://googleapi-w56agazoha-uc.a.run.app/?text=${text}` ;
        const audio = new Audio(urlGoogleTTSProxy);
        audio.play();    
    });

}


async function renderGoogleOutput(tagOutputContainer,jsonDict){
    let tagOutput = document.createElement('li') ;
    tagOutput.classList.add('dictAnywhereItem') ;
    let cDate = new Date(jsonDict.timeStamp) ;
    console.log(cDate.toLocaleString()) ;

    tagOutput.innerHTML=`
        <div class="dictAnywhereItemContent">
            <span>${jsonDict.textTh}/${jsonDict.meaningEn}</span>
            <div class="dictAnywhereItemTools">
                <i class="bi-play-circle flashBTN" id="idBTNPlayAudio"></i>
                <i class="bi-recycle flashBTN noShow" id="idBTNDelete"></i>
                <i class="bi-file flashBTN" id="idBTN2Check"></i>
                <i class="bi-file-check flashBTN noShow" id="idBTNChecked"></i>
            </div>
        </div>
    ` ;
    tagOutputContainer.prepend(tagOutput) ;
    //tagOutput.dataset.dictIndex = dictIndex ;
    /*
    if(isMobile()!=true){
        tagOutput.querySelector('.dictAnywhereItemTools').classList.remove('noShow') ;
    }
    */

    tagOutput.querySelector('#idBTN2Check').addEventListener('click',(event)=>{
        event.target.classList.add('noShow') ;
        tagOutput.querySelector('#idBTNChecked').classList.remove('noShow');            
    }) ;

    tagOutput.querySelector('#idBTNChecked').addEventListener('click',(event)=>{
        event.target.classList.add('noShow') ;
        tagOutput.querySelector('#idBTN2Check').classList.remove('noShow');
    }) ;

    /*
    tagOutput.querySelector('#idBTNDelete').addEventListener('click',(event)=>{
        tagOutput.remove();
        
        let dictIndex = parseInt(tagOutput.dataset.dictIndex) ;
        gGoogleDicts.splice(dictIndex,1) ;
        sync2Firebase(gGoogleDicts) ;
        
    }) ;
    */
    //idBTNPlayAudio
    tagOutput.querySelector('#idBTNPlayAudio').addEventListener('click',(event)=>{
        const text = jsonDict.textTh;//tagOutput.querySelector("text").value;
        //const urlGoogleTTSProxy = `http://192.168.1.188:3010/tts?q=${text}` ;
        const urlGoogleTTSProxy = `https://googleapi-w56agazoha-uc.a.run.app/?text=${text}` ;
        const audio = new Audio(urlGoogleTTSProxy);
        audio.play();
    });

}

// Load voices (required on some platforms)
speechSynthesis.onvoiceschanged = () => {};

//https://drive.google.com/file/d/1IvvsTxog36wqo6kfgxO15rBpy58bClxz/view?usp=sharing
//https://drive.google.com/file/d/1IvvsTxog36wqo6kfgxO15rBpy58bClxz/view?usp=sharing
//https://docs.google.com/uc?export=download&id=1IvvsTxog36wqo6kfgxO15rBpy58bClxz

///Users/alexszhanggmail.com/github/signpost.Dictionary/public/mp3
async function _renderDictMode(tagWndContent){
    tagWndContent.innerHTML=`
   
        <h2>Dict.Anywhere</h2>
        <div class="dictMainWnd">
            <input type="text" id="idInputText2Google" onfocus="this.value=''">
            <button id="idBTNGoogle">Google it!</button>
            <hr>
            <div id="idOutputGoogle"></div>
        </div>
    ` ;

    let flagGoogleTTS = true ;//await isURLReachable(urlGoogleTTSProxyAvail) ;
    await _loadGoogleDicts() ;
    let tagGoogleOutput = tagWndContent.querySelector('#idOutputGoogle') ;
    for(let i=0;i<gGoogleDicts.length;i++){
        await renderDictOutput(tagGoogleOutput,gGoogleDicts[i],i,flagGoogleTTS) ;

    }

    tagWndContent.querySelector('#idBTNGoogle').addEventListener('click',_onClickGoogleTranslate) ;
    let tagText2Google = tagWndContent.querySelector("#idInputText2Google") ;
    tagText2Google.focus();
    //handlePlainTextPaste(tagText2Google) ;
    tagText2Google.addEventListener('keyup',(event)=>{
        if (event.key === "Enter") {
            event.preventDefault() ;
            _onClickGoogleTranslate(event) ;
        }
    }) ;
}



async function _larkGoogleTranslate(text,sourceLang,targetLang){
    console.log("_larkGoogleTranslate==============>>>>>>>>>>>>>>");
    console.log(text);
    let textPre = text.replace(/( )/ig, "%20") ;
    //let encodedText = encodeURI(textPre) ;
    //var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="+ sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodedText;
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="+ sourceLang + "&tl=" + targetLang + "&dt=t&q=" + textPre;
    
    console.log(url);
    console.log("<<<<<<<<<<<================");


    let jsonResp = await fetch(url) ;//larkHTTPFetchJSON(url) ;
    let jsonData = await jsonResp.text() ;
    let jsonDict = JSON.parse(jsonData) ;
    console.log(jsonDict) ;
    let meaning = jsonDict[0][0] ;
    return meaning[0] ;
}

async function _onClickGoogleTranslate(event){
    //idInputText2Google
    let tagMainWnd = event.target.closest('#idWndContent') ;
    let tagText2Google = tagMainWnd.querySelector("#idInputText2Google") ;
    const text = tagText2Google.value;//'ประมาท' ;
    if(text.length<=1)return ;

    //commonicate with sharedWorker
    let localQuery = `/thaiDictionary/${text}` ;
    userOperation("read",localQuery) ;

}

async function _doGoogleIt(text){
    let sourceLang = 'th' ;
    let targetLang = 'en' ;
    if(isChineseOnly(text)){
        sourceLang = 'zh' ;
        targetLang = 'th' ;
    }else if(isThaiLettersPunctuationNumbers(text)){
        sourceLang = 'th' ;
        targetLang = 'en' ;
    }else{
        sourceLang = 'en' ;
        targetLang = 'th' ;
    }
    
    let meaning = await _larkGoogleTranslate(text,sourceLang,targetLang) ;
    console.log(meaning) ;

    return meaning ;
}

let gCallbackResponse=async (path2Query,data)=>{
    console.log(path2Query) ;
    console.log(JSON.stringify(data)) ;
    let meaning = "" ;
    let text =path2Query.replace("/thaiDictionary/","");//"เขา" ;//path2Query /thaiDictionary/เขา
    if(data == undefined){
        console.log("no such data find in local Copy");
        meaning = await _doGoogleIt(text) ;
    }else{
        meaning = data.definitions[0].english ;
    }
    let tagMainWnd = document.querySelector('#idWndContent') ;
    let tagGoogleOutput = tagMainWnd.querySelector('#idOutputGoogle') ;
    let cmDate = new Date();
    let jsonDict={
        textTh:text,
        meaningEn:meaning,
        timeStamp:cmDate.getTime()
    } ;
    renderGoogleOutput(tagGoogleOutput,jsonDict) ;

    /*
    let cDate = new Date() ;
    let jsonGoogleDict={
        textTh:text,
        meaningEn:meaning,
        timeStamp:cDate.getTime()
    } ;
    let url_gSheetWebApp = `https://script.google.com/macros/s/AKfycbw9aEabZmGlfwVI_CbaMbLf3do3EH4guUAQtsX_lVQNeum6uWRM1F7Eplz7GInbSdn1/exec` ;

    _sendMessage2Worker('GoogleDict',jsonGoogleDict) ;
    gGoogleDicts.push(jsonGoogleDict) ;
    sync2Firebase(gGoogleDicts) ;
    */
    return meaning ;

} ;

async function sync2Firebase(GoogleDicts) {
    let url=`https://outpost-8d74e.asia-southeast1.firebasedatabase.app/GoogleDicts.json` ;
    try {
       // Write back the updated array using PUT

       const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(GoogleDicts)
        });

        if (!putResponse.ok) {
            throw new Error(`Failed to sync todos: ${putResponse.statusText}`);
        }

        console.log("synced successfully!");
        //localCache.length = 0; // Clear local cache after sync
    } catch (error) {
        console.error("Error syncing todos:", error.message);
    }
}


function isThaiLettersPunctuationNumbers(str) {
    // Regular expression for Thai letters and punctuation (U+0E00 to U+0E7F)
    // and numbers (Thai digits U+0E50 to U+0E59 or Arabic digits 0-9)
    const thaiRegex = /^[\u0E00-\u0E7F0-9]*$/;
    
    // Check if the string is non-empty and matches the regex
    return typeof str === 'string' && str.length > 0 && thaiRegex.test(str);
}

// Example usage:
// console.log(isThaiLettersPunctuationNumbers("สวัสดี123")); // true
// console.log(isThaiLettersPunctuationNumbers("สวัสดี๑๒๓")); // true
// console.log(isThaiLettersPunctuationNumbers("สวัสดี!๑๒๓")); // true
// console.log(isThaiLettersPunctuationNumbers("สวัสดี abc")); // false
// console.log(isThaiLettersPunctuationNumbers("")); // false
// console.log(isThaiLettersPunctuationNumbers("hello")); // false



function isChineseOnly(str) {
    // Regular expression for Chinese characters (CJK Unified Ideographs U+4E00 to U+9FFF)
    const chineseRegex = /^[\u4E00-\u9FFF]*$/;
    
    // Check if the string is non-empty and matches the regex
    return typeof str === 'string' && str.length > 0 && chineseRegex.test(str);
}

// Example usage:
// console.log(isChineseOnly("你好世界")); // true
// console.log(isChineseOnly("你好123")); // false
// console.log(isChineseOnly("你好 world")); // false
// console.log(isChineseOnly("")); // false
// console.log(isChineseOnly("hello")); // false



//sort json object array in Thai Dictionary Order
function sortThaiJson(array, key = 'thWord') {
    return array.sort((a, b) => a[key].localeCompare(b[key], 'th-TH'));
}