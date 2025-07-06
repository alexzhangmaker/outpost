
function _renderDictMode(tagWndContent){
    tagWndContent.innerHTML=`
        <h2>Dict.Anywhere</h2>
        <input type="text" id="idInputText2Google" onfocus="this.value=''">
        <button id="idBTNGoogle">try Google</button>
        <div id="idOutputGoogle"></div>
    ` ;
    tagWndContent.querySelector('#idBTNGoogle').addEventListener('click',_onClickGoogleTranslate) ;
    let tagText2Google = tagWndContent.querySelector("#idInputText2Google") ;
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
    let encodedText = encodeURI(textPre) ;
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl="+ sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodedText;
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
    const sourceLang = 'th' ;
    const targetLang = 'en' ;
    let meaning = await _larkGoogleTranslate(text,sourceLang,targetLang) ;
    console.log(meaning) ;

    let tagGoogleOutput = tagMainWnd.querySelector('#idOutputGoogle') ;
    let tagOutput = document.createElement('li') ;
    tagOutput.innerHTML=`${text}/${meaning}` ;
    tagGoogleOutput.appendChild(tagOutput) ;

    let cDate = new Date() ;
    let jsonGoogleDict={
        textTh:text,
        meaningEn:meaning,
        timeStamp:cDate.getTime()
    } ;
    let url_gSheetWebApp = `https://script.google.com/macros/s/AKfycbw9aEabZmGlfwVI_CbaMbLf3do3EH4guUAQtsX_lVQNeum6uWRM1F7Eplz7GInbSdn1/exec` ;

    _sendMessage2Worker(jsonGoogleDict,url_gSheetWebApp) ;
    return meaning ;
}