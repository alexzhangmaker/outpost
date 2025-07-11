
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

        let currentIndex=-1 ;
        _renderNextChallenge(tagWndContent,jsonDictTble,currentIndex) ;
    } catch (err) {
        // This code runs if there were any errors.
        console.log(err);
    }
}

function _renderNextChallenge(tagWndContent,dictTbl,currentIndex){
    let nextIndex = currentIndex+1 ;
    nextIndex = nextIndex>dictTbl.length?0:nextIndex ;
    let jsonChallenge = dictTbl[nextIndex] ;
    tagWndContent.innerHTML=`
        <div class="dictationMain">
            <div class="challengWnd">
                <h2 class="challengWord">${jsonChallenge.Word}</h2>
                <h4 class="challengMeaning">${jsonChallenge.English}</h4>
                <div class="challengExample">${jsonChallenge["Example Sentence"]}</div>
            </div>
            <div class="dictationTools">
                <i class="bi-arrow-left-square" id="idBTNPrevious"></i>
                <i class="bi-arrow-right-square" id="idBTNNext"></i>
            </div>
        </div>
    ` ;
    tagWndContent.querySelector('#idBTNNext').addEventListener('click',(event)=>{
        _renderNextChallenge(tagWndContent,dictTbl,nextIndex) ;
    }) ;
}

/*
const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/ThaiFrequency.json";
    let jsonDictTble = [];
    const res = await fetch(firebaseUrl);
    jsonDictTble = await res.json();
    console.log(jsonDictTble) ;
*/