async function _onClick_SyncCloud(event){
    await _clearStoreLocal() ;
    //let cloudData = await _dumpFireStore("outpost") ;
    let tagMemoContainer = document.querySelector('.memoContainer') ;
    tagMemoContainer.innerHTML=`` ;
    await _syncFireStore("outpost") ;

    renderLocalJSON() ;
}


function renderMemoV2(tagContainer,jsonMemo){
    let tagMemo = document.createElement('li') ;
    tagMemo.classList.add('liMemo') ;

    let cDate = new Date(jsonMemo.date.year, jsonMemo.date.month-1, jsonMemo.date.day)
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
    tagMemo.dataset.docID = jsonMemo.key ;
    tagMemo.querySelector('.bi-check2-circle').addEventListener('click',async (event)=>{
        //tagMemo.classList.toggle('memoCheck') ;
        await deleteDocument("outpost",tagMemo.dataset.docID) ;
        await removeKeyLocal(tagMemo.dataset.docID) ;

        tagMemo.remove() ;
    }) ;
}

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

function onClickSubmitMemo(event){
    let tagMemoInput = document.querySelector('#idInputMemo');
    let cDate = new Date() ;
    let jsonMemo={
        ttm:cDate.toLocaleString(),
        memo:tagMemoInput.value
    } ;
    let memoID = `${cDate.getTime()}` ;
    sumbitMemoLocal(memoID,jsonMemo) ;
    _storeWrite("outpost",memoID,jsonMemo) ;
}

function _onKeyInputEnter(event){
    if (event.key === 'Enter') {
        let inputField = event.target ;
        event.preventDefault(); // Prevents form submission if inside a form
        const inputValue = inputField.value;
        console.log('Input value:', inputValue);
        let jsonMemo=_parseStringToJSON(inputValue) ;
        let cDate = new Date() ;
        let memoID = `${cDate.getTime()}` ;
        sumbitMemoLocal(memoID,jsonMemo) ;
        _storeWrite("outpost",memoID,jsonMemo) ;
    }
}

Mousetrap.bind('@', (event)=>{
    //alert('this is Mousetrap for /') ;
    let tagMemoInput = document.querySelector('#idInputMemo');
    tagMemoInput.focus();
});

function _parseStringToJSON(input) {
    // Regular expression to match patterns with optional date and about
    //const regex = /^(?:@(\d{2})(\d{2})(\d{4})\s+)?(?:\+(\w+)\s+)?(.+)$/;
      const regex = /^(?:@(\d{2})(\d{2})(\d{4})\s+)?(?:\+([\w.]+)\s+)?(.+)$/;

    // Match the input string
    const match = input.match(regex);
    
    if (!match) {
        throw new Error("Invalid input format");
    }
    
    // Extract components (month, day, year, about, memo)
    const [, month, day, year, about, memo] = match;
    
    // Get current date if date parts are missing
    const currentDate = new Date();
    
    // Construct JSON object
    let jsonData={
        date: {
            month: month ? parseInt(month) : currentDate.getMonth() + 1,
            day: day ? parseInt(day) : currentDate.getDate(),
            year: year ? parseInt(year) : currentDate.getFullYear()
        },
        about: about ? about.toLowerCase() : "all",
        memo: memo
    };
    let cDate = new Date(jsonData.date.year, jsonData.date.month, jsonData.date.day)
    jsonData.ttm=`${cDate.getTime()}` ;
    return jsonData ;
}