
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