const jsonTask={
    about:'something',
    date:{
        day:8,
        month:7,
        year:2025
    },
    key:0,
    memo:"something to do",
    ttm:"1749488400000"
};

let jsonOutpostTasks = [];

async function renderTasks(tagWndContent){

    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostTASK.json";
    const res = await fetch(firebaseUrl);
    jsonOutpostTasks = await res.json();
    console.log(jsonOutpostTasks) ;
    
    for(let i=0;i<jsonOutpostTasks.length;i++){
        renderMemoV2(tagWndContent,jsonOutpostTasks[i]) ;
    }
    /*
    let tagWndContent = document.querySelector('#idWndContent') ;

    //renderSchedule(tagWndContent,jsonCMUSchedule);
    switchScheduleMode(tagWndContent,"CMU 2025") ;
    for(let i=0;i<jsonCMUCalendar.length;i++){
        renderCMUCalendarEvent(document.querySelector(".event-list"), jsonCMUCalendar[i]) ;
    }
    //renderEvent(document.querySelector(".event-list"), jsonEvent1) ;
    //renderEvent(document.querySelector(".event-list"), jsonEvent2) ;
    */
}


function renderMemoV2(tagContainer,jsonMemo){
    let tagMemo = document.createElement('li') ;
    tagMemo.classList.add('liMemo') ;

    let cDate = new Date(jsonMemo.date);//new Date(jsonMemo.date.year, jsonMemo.date.month-1, jsonMemo.date.day)
    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedDate = formatter.format(cDate);
    console.log(formattedDate);
    tagMemo.innerHTML=`       
        <div class="DIVMemo">
            <div class="memoHeader">
                <span>
                    <span class="memoTTM">${formattedDate}</span>
                    <span class="memoAbout">${jsonMemo.about}</span>
                </span>
                <i class="bi-check2-circle outpostBTN"></i>
            </div>
            <div class="memoBody">
                <span class="memoContent">${jsonMemo.memo}</span>
                <br>
            </div>
        </div>

    ` ;
    tagContainer.prepend(tagMemo) ;
    /*
    tagMemo.dataset.docID = jsonMemo.key ;
    tagMemo.querySelector('.bi-check2-circle').addEventListener('click',async (event)=>{
        //tagMemo.classList.toggle('memoCheck') ;
        await deleteDocument("outpost",tagMemo.dataset.docID) ;
        await removeKeyLocal(tagMemo.dataset.docID) ;

        tagMemo.remove() ;
    }) ;
    */
}

/*
function renderLocalJSON(){
    localforage.config(localForageConfig);
    localforage.iterate((value, key) => {
        // Push each key-value pair as an object to the array
        let tagMemoContainer = document.querySelector('.memoContainer') ;
        let jsonMemo = JSON.parse(value);
        jsonMemo.key = key ;
        renderMemoV2(tagMemoContainer,jsonMemo) ;
    }).then(() => {
        console.log('All key-value pairs:');
    }).catch((err) => {
        console.error('Error iterating:', err);
    });
}

function sumbitMemoLocal(key,jsonMemo){
    let tagMemoContainer = document.querySelector('.memoContainer') ;
    //let jsonMemo = JSON.parse(value);
    jsonMemo.key = key ;
    renderMemoV2(tagMemoContainer,jsonMemo) ;
    _writeJSONLocal(key,jsonMemo) ;
    let tagMemoInput = document.querySelector('#idInputMemo');
    tagMemoInput.value='' ;
}
*/
function onClickSubmitMemo(event){
    let tagMemoInput = document.querySelector('#idInputMemo');
    let jsonMemo=_parseTodoString(inputValue) ;
    if(jsonMemo==null)return ;

    let tagContainer = event.target.closest('#idWndContent').querySelector('.memoContainer');
    renderMemoV2(tagContainer,jsonMemo) ;
    jsonOutpostTasks.push(jsonMemo) ;
    console.log(jsonOutpostTasks) ;
    syncTodos2Firebase() ;
}

function _onKeyInputEnter(event){
    if (event.key === 'Enter') {
        let inputField = event.target ;
        event.preventDefault(); // Prevents form submission if inside a form
        const inputValue = inputField.value;
        console.log('Input value:', inputValue);
        let jsonMemo=_parseTodoString(inputValue) ;
        if(jsonMemo==null)return ;

        let tagContainer = event.target.closest('#idWndContent').querySelector('.memoContainer');
        renderMemoV2(tagContainer,jsonMemo) ;
        jsonOutpostTasks.push(jsonMemo) ;
        console.log(jsonOutpostTasks) ;
        syncTodos2Firebase() ;

    }
}

Mousetrap.bind('@', (event)=>{
    //alert('this is Mousetrap for /') ;
    let tagMemoInput = document.querySelector('#idInputMemo');
    tagMemoInput.focus();
});


function _parseTodoString(input) {
    // Regex: @ for date (mmddyyyy), + for topic (single word), followed by details
    const regex = /^(?:@(\d{2})(\d{2})(\d{4})\s+)?(?:\+(\w+)\s+)?(.+)$/;
    
    const match = input.match(regex);
    if (!match) {return null; }
    // Return null if the string doesn't match the expected format
    
    let today = new Date() ;
    let [, month, day, year, topic, details] = match;
    month = month ? parseInt(month, 10) : today.getMonth() + 1 ;
    day = day ? parseInt(day, 10) : today.getDate() ;
    year = year ? parseInt(year, 10) : today.getFullYear() ;

    let cDate = new Date(year,month-1,day,0, 0, 0, 0) ;//year, month, day, hours, minutes, seconds, milliseconds
    return {
        date: cDate.toLocaleString(),
        about: topic || "all",
        memo: details.trim() ,
        ttm:today.getTime()
    };
}

/*
// Example usage:
const testString = "@12052025 +meeting Prepare agenda for team sync";
const result = parseTodoString(testString);
console.log(result);
*/


async function syncTodos2Firebase() {
    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostTASK.json";

    if (jsonOutpostTasks.length === 0) {
        console.log("No todos to sync.");
        return;
    }

    try {
        /*
        for (let i=0; i<jsonOutpostTasks.length;i++) {
            const jsonTask = jsonOutpostTasks[i];

            const response = await fetch(firebaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonTask)
            });

            if (!response.ok) {
                throw new Error(`Failed to upload todo: ${response.statusText}`);
            }

            const result = await response.json();
            console.log(`Todo uploaded with key: ${result.name}`);
        }
        */
       // Write back the updated array using PUT
       const putResponse = await fetch(firebaseUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonOutpostTasks)
        });

        if (!putResponse.ok) {
            throw new Error(`Failed to sync todos: ${putResponse.statusText}`);
        }

        console.log("All todos synced successfully!");
        //localCache.length = 0; // Clear local cache after sync
    } catch (error) {
        console.error("Error syncing todos:", error.message);
    }
}
