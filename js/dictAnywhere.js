let gGoogleDicts=[] ;

async function _loadGoogleDicts(){
    gGoogleDicts=[] ;
    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/GoogleDicts.json";
    const res = await fetch(firebaseUrl);
    gGoogleDicts = await res.json();
    console.log(gGoogleDicts) ;
}

async function _renderDictMode(tagWndContent){
    tagWndContent.innerHTML=`
        <h2>Dict.Anywhere</h2>
        <div class="dictMainWnd">
            <input type="text" id="idInputText2Google" onfocus="this.value=''">
            <button id="idBTNGoogle">Google it!</button>
            <div id="idOutputGoogle"></div>
        </div>
    ` ;

    await _loadGoogleDicts() ;
    let tagGoogleOutput = tagWndContent.querySelector('#idOutputGoogle') ;
    for(let i=0;i<gGoogleDicts.length;i++){
        let tagOutput = document.createElement('li') ;
        let cDate = new Date(gGoogleDicts[i].timeStamp) ;
        console.log(cDate.toLocaleString()) ;
        tagOutput.innerHTML=`${gGoogleDicts[i].textTh}/${gGoogleDicts[i].meaningEn}` ;
        tagGoogleOutput.prepend(tagOutput) ;
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


/*
case translate: turn left
url: https://translate.google.com/?hl=zh-CN&tab=TT&sl=en&tl=th&text=turn%20left&op=translate
*/

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

    let tagGoogleOutput = tagMainWnd.querySelector('#idOutputGoogle') ;
    let tagOutput = document.createElement('li') ;
    tagOutput.innerHTML=`${text}/${meaning}` ;
    //tagGoogleOutput.appendChild(tagOutput) ;
    tagGoogleOutput.prepend(tagOutput) ;

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
    return meaning ;
}


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