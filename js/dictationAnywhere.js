
/*
// Track cumulative swipe distance
let deltaX = 0;
let deltaY = 0;

///
const swipeArea = document.getElementById('.challengWnd');
//const square = document.querySelector('.square');

// Initialize Hammer.js with swipe recognizer
const manager = new Hammer.Manager(swipeArea);
const swipe = new Hammer.Swipe({ direction: Hammer.DIRECTION_ALL }); // Enable all swipe directions
manager.add(swipe);
// Handle swipe events
manager.on('swipe', function (e) {
    // Update cumulative position
    deltaX += e.deltaX;
    deltaY += e.deltaY;

    // Determine swipe direction
    let directionText = '';
    if (e.direction === Hammer.DIRECTION_LEFT) {
        directionText = 'Swiped Left!';
    } else if (e.direction === Hammer.DIRECTION_RIGHT) {
        directionText = 'Swiped Right!';
    } else if (e.direction === Hammer.DIRECTION_UP) {
        directionText = 'Swiped Up!';
    } else if (e.direction === Hammer.DIRECTION_DOWN) {
        directionText = 'Swiped Down!';
    }

    // Update UI
    swipeArea.textContent = directionText;
    square.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    // Reset text after 1 second
    setTimeout(() => {
        swipeArea.textContent = 'Swipe here!';
    }, 1000);
});
//
*/


/*
let jsonDictationRecord={
    key:'dictation_07112025',
    lastRecordsKey:["dictation_06232025"],//key of last n records,n is system parameter 
    indexBegin:1,
    indexEnd:20,
    failedIDs:[]
} ;
*/

//demo https://drive.google.com/file/d/1IvvsTxog36wqo6kfgxO15rBpy58bClxz/view?usp=sharing

const nDictPerDay = 40 ;
let gDictation={
    key:'TBD',
    lastRecordsKey:[],//key of last n records,n is system parameter 
    indexBegin:-1,
    indexEnd:-1,
    dictIDs:[],
    failedIDs:[]
} ;

let gDictMan={
    nextIndexBegin:-1,
    mostRecentRecord:'',
    lastRecordsKey:[],
    nDictPerDay:nDictPerDay
} ;

async function _initDictationEnv(dictTble){
    const urlDictMan = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/dictMan.json";
    let res = await fetch(urlDictMan);
    let jsonDictMan = await res.json();
    if(jsonDictMan!=null){
        if(jsonDictMan.nextIndexBegin!=0){
            gDictMan.nextIndexBegin = jsonDictMan.nextIndexBegin ;
            gDictMan.mostRecentRecord=jsonDictMan.mostRecentRecord ;
            gDictMan.lastRecordsKey=jsonDictMan.lastRecordsKey ;
            gDictMan.nDictPerDay = nDictPerDay;//jsonDictMan.nDictPerDay ;
        }
    }



    let cDate = new Date() ;
    let cMonth = (cDate.getMonth()+1)<10?`0${cDate.getMonth()+1}`:`${cDate.getMonth()+1}` ;
    let strDate = cDate.getDate()<10?`0${cDate.getDate()}`:`${cDate.getDate()}` ;
    let key4Today = `${cMonth}${strDate}${cDate.getFullYear()}` ;
    //https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/07122025.json
    const urlDict = `https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/${key4Today}.json`;
    res = await fetch(urlDict);
    let jsonDict = await res.json();
    if(jsonDict!=null){
        console.log(jsonDict) ;
        gDictation.key = key4Today ;
        gDictation.indexBegin = -1;//gDictMan.nextIndexBegin+1 ;
        gDictation.indexEnd = -1 ;//gDictMan.nextIndexBegin + gDictMan.nDictPerDay ;
        gDictation.lastRecordsKey=[];//gDictMan.lastRecordsKey ;
        gDictation.dictIDs = jsonDict.failedIDs;
        return ;
    }


    gDictation.key = key4Today ;
    gDictation.indexBegin = gDictMan.nextIndexBegin+1 ;
    gDictation.indexEnd = gDictMan.nextIndexBegin + gDictMan.nDictPerDay ;
    gDictation.lastRecordsKey=gDictMan.lastRecordsKey ;

    //collect failedIDs from last n Records

    //add new dict items
    for(let i=gDictation.indexBegin;i<gDictation.indexEnd;i++){
        if(i>=dictTble.length)break ;
        gDictation.dictIDs.push(i) ;
    }
    if(gDictation.key !=gDictMan.mostRecentRecord){
        if(gDictMan.mostRecentRecord=='') return ;

        //https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/07112025
        let urlLastDict = `https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/${gDictMan.mostRecentRecord}.json`;
        res = await fetch(urlLastDict);
        let jsonDictLastDict = await res.json();
        if(jsonDictLastDict==null)return ;

        for(i=0;i<jsonDictLastDict.failedIDs.length;i++){
            gDictation.dictIDs.push(jsonDictLastDict.failedIDs[i]) ;
        }
    }
    //end initializing gDictation
    console.log(gDictation) ;
}


async function _finishDict4Today(){
    console.log(gDictation) ;
    const urlDict = `https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/${gDictation.key}.json`;
    let putResponse = await fetch(urlDict, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gDictation)
    });
    if (!putResponse.ok) {
        console.log(`Failed to _finishDict4Today : ${putResponse.statusText}`);
    }
    console.log("_finishDict4Today successfully!");

    const urlDictMan = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostDictation/dictMan.json";
    gDictMan.nextIndexBegin = gDictation.indexEnd ;
    gDictMan.nDictPerDay = nDictPerDay ;
    gDictMan.mostRecentRecord = gDictation.key ;
    gDictMan.lastRecordsKey.push(gDictation.key) ;
    putResponse = await fetch(urlDictMan, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gDictMan)
    });
    if (!putResponse.ok) {
        console.log(`Failed to _finishDict4Today2 : ${putResponse.statusText}`);
    }
    console.log("_finishDict4Today2 successfully!");
}


async function _renderDictationMode(tagWndContent){


    let storageKey = `outpostDictation` ;
    try {
        let jsonDictTble = await localforage.getItem(storageKey);
        // This code runs once the value has been loaded
        // from the offline store.
        console.log(jsonDictTble);
        if(jsonDictTble==null){
            const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/ThaiFrequency.json";
            jsonDictTble = [];
            const res = await fetch(firebaseUrl);
            jsonDictTble = await res.json();
            console.log(jsonDictTble) ;
            await localforage.setItem(storageKey,jsonDictTble);
        }

        let flagGoogleTTS = await isURLReachable('http://localhost:3010/ttsAvailable') ;

        await _initDictationEnv(jsonDictTble) ;
        let currentIndex=-1 ;
        _renderNextChallenge(tagWndContent,jsonDictTble,currentIndex,flagGoogleTTS) ;
    } catch (err) {
        // This code runs if there were any errors.
        console.log(err);
    }
}

async function _renderNextChallenge(tagWndContent,dictTbl,currentIndex,GoogleTTSAvailable){
    let nextIndex = currentIndex+1 ;

    //code line below may cause repeat
    if(nextIndex>=gDictation.dictIDs.length){
        alert('done for today') ;
        if(gDictation.indexBegin==-1 && gDictation.indexEnd==-1)return ;

        await _finishDict4Today() ;
        return ;
    }
    nextIndex = nextIndex>gDictation.dictIDs.length?0:nextIndex ;
    //end comment

    let showHidePlay=GoogleTTSAvailable?'showPlay':'noShow' ;


    let jsonChallenge = dictTbl[gDictation.dictIDs[nextIndex]] ;
    tagWndContent.innerHTML=`
        <div class="dictationMain">
            <div class="challengWnd">
                <h2 class="challengWord">${jsonChallenge.Word}</h2>
                <h4 class="challengMeaning">${jsonChallenge.English}</h4>
                <div class="challengExample">${jsonChallenge["Example Sentence"]}</div>
            </div>
            <div class="dictationTools">
                <i class="bi-arrow-left-square noShow" id="idBTNPrevious" style="font-size:24px;"></i>
                <i class="bi-check-square" id="idBTNCheckRight" style="font-size:24px;"></i>
                <i class="bi-play-circle flashBTN ${showHidePlay}" id="idBTNPlayAudio"></i>

                <i class="bi-x-square" id="idBTNCheckWrong" style="font-size:24px;"></i>
                <i class="bi-arrow-right-square noShow" id="idBTNNext" style="font-size:24px;"></i>
            </div>
        </div>
    ` ;
    tagWndContent.querySelector('.dictationMain').dataset.dictIndex = nextIndex ;
    tagWndContent.querySelector('.dictationMain').dataset.dictID = gDictation.dictIDs[nextIndex] ;
    tagWndContent.querySelector('.dictationMain').dataset.challengWord = jsonChallenge.Word ;

    tagWndContent.querySelector('#idBTNNext').addEventListener('click',(event)=>{
        _renderNextChallenge(tagWndContent,dictTbl,nextIndex) ;
    }) ;
    tagWndContent.querySelector('#idBTNCheckRight').addEventListener('click',(event)=>{
        _renderNextChallenge(tagWndContent,dictTbl,nextIndex) ;
    }) ;
    tagWndContent.querySelector('#idBTNCheckWrong').addEventListener('click',(event)=>{
        let failedID = parseInt(tagWndContent.querySelector('.dictationMain').dataset.dictID) ;
        gDictation.failedIDs.push(failedID) ;
        _renderNextChallenge(tagWndContent,dictTbl,nextIndex) ;

    }) ;

    tagWndContent.querySelector('#idBTNPlayAudio').addEventListener('click',(event)=>{

        const text = tagWndContent.querySelector('.dictationMain').dataset.challengWord;//tagOutput.querySelector("text").value;
       
        const urlGoogleTTSProxy = `http://localhost:3010/tts?q=${text}` ;
        const audio = new Audio(urlGoogleTTSProxy);
        audio.play();
    });

}

/*
const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/ThaiFrequency.json";
    let jsonDictTble = [];
    const res = await fetch(firebaseUrl);
    jsonDictTble = await res.json();
    console.log(jsonDictTble) ;
*/