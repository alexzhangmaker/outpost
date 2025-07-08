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
        tagGoogleOutput.appendChild(tagOutput) ;
    }

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
