
function appMeta(){
    return {
        name:'boxAnywhere',
        title:'box.Anywhere',
        appTitle:_appTitle,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio,
        renderHeadTools:_renderHeadTools,
        injectStyle:_injectStyle_AppBoxAnywhere
    }
}


const _appTitle = ()=>{
    return 'medium.Anywhere' ;
} ;


const _style_AppMediumAnywhere=`
.mediumAnywhereTools{
    flex-grow: 1;
  }


  *:focus {
                outline: none;
            }


/* Style the editable container */
.editable {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 18px; /* Base font size for body text */
    line-height: 1.6; /* Comfortable line spacing */
    color: #333; /* Dark, readable text color */
    background-color: /*#fff*/ #f5f5f5; /* Clean white background */
    padding: 20px; /* Add padding for breathing room */
    margin: 20px auto; /* Center the container with margin */
    max-width: 800px; /* Limit width for readability */
    border: 1px solid #e0e0e0; /* Subtle border */
    border-radius: 2px; /* Rounded corners for a modern look */
    /*box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);*/ /* Subtle shadow for depth */
    min-height: 300px; /* Ensure enough space for writing */

    overflow-y: auto;
    height:85vh;
}


.editable::-webkit-scrollbar {
  width: 2px; /* Adjust scrollbar width */
  height: 6px; /* Adjust scrollbar height (for horizontal scrollbars) */
}

.editable::-webkit-scrollbar-thumb {
  background: #888; /* Scrollbar thumb color */
  border-radius: 6px; /* Rounded corners */
}

.editable::-webkit-scrollbar-track {
  background: #f1f1f1; /* Scrollbar track color */
}

/* Style headers */
.editable h1 {
  font-size: 28px;
  font-weight: bold;
  margin: 1em 0 0.5em;
  color: #222;
}

.editable h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 1em 0 0.5em;
  color: #222;
}

.editable h3 {
  font-size: 20px;
  font-weight: 500;
  margin: 1em 0 0.5em;
  color: #222;
}

/* Style paragraphs */
.editable p {
  margin: 0 0 1em; /* Space between paragraphs */
}

/* Style links */
.editable a {
  color: #1a73e8; /* Vibrant link color */
  text-decoration: underline;
}

/* Placeholder text styling */
.editable:empty:before {
  content: 'Start writing your diary...';
  color: #999; /* Light gray placeholder */
  font-style: italic;
}

/* Focus state for better UX */
.editable:focus {
  outline: none; /* Remove default outline */
  border-color: #dbdee1; /* Highlight border on focus */
  /*box-shadow: 0 0 8px rgba(200, 210, 222, 0.2);*/ /* Subtle glow */
}

/* Responsive typography */
@media (max-width: 600px) {
  .editable {
    font-size: 16px; /* Slightly smaller on mobile */
    padding: 15px;
    max-width: 100%;
  }

  .editable h1 {
    font-size: 24px;
  }

  .editable h2 {
    font-size: 20px;
  }

  .editable h3 {
    font-size: 18px;
  }
}

.medium-editor-toolbar {
  background-color: #fff; /* White background */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.medium-editor-toolbar li button {
  color: #333; /* Dark button icons */
  border: none;
  padding: 8px;
  transition: background-color 0.2s;
}

.medium-editor-toolbar li button:hover {
  background-color: #f0f0f0; /* Subtle hover effect */
}

.medium-editor-toolbar-active {
  visibility: visible; /* Ensure toolbar is visible when active */
}

.dark-mode .editable {
  background-color: #1a1a1a;
  color: #e0e0e0;
  border-color: #333;
}

.dark-mode .editable:empty:before {
  color: #666;
}
` ;
const _injectStyle_AppBoxAnywhere = ()=>{
    /*
    let linkBootstrap = document.createElement('link');
    linkBootstrap.rel = 'stylesheet';
    linkBootstrap.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css';
    document.head.appendChild(linkBootstrap);

    let linkTippy = document.createElement('link');
    linkTippy.rel = 'stylesheet';
    linkTippy.href = 'https://unpkg.com/tippy.js@6/dist/tippy.css';
    document.head.appendChild(linkTippy);

    //<script src="//cdn.jsdelivr.net/npm/medium-editor@latest/dist/js/medium-editor.min.js"></script>
    //<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/medium-editor@latest/dist/css/medium-editor.min.css" type="text/css" media="screen" charset="utf-8">
    */

    const styleElement = document.createElement('style');
    styleElement.textContent = _style_AppMediumAnywhere;
    // Append the style to the document head
    document.head.appendChild(styleElement);

};

let gMemos=[] ;

const _renderHeadTools=async (tagAppIconTools)=>{
    tagAppIconTools.innerHTML=`
        <input type="text" id="idMemoTitle" placeholder="title..." onfocus="this.value=''" style="width:20rem">
        <i class="bi-hdd outpostBTN" id="idBTNSaveButton"></i>
        <i class="bi-clipboard-plus outpostBTN" id="idBTNPlusButton"></i>
        <i class="bi-list-check outpostBTN" id="idBTNListMemo"></i>
    ` ; 
    tagAppIconTools.classList.add('mediumAnywhereTools') ;
    tagAppIconTools.querySelector('#idBTNSaveButton').addEventListener('click',async (event)=>{
        let title = tagAppIconTools.querySelector('#idMemoTitle').value ;
        let content = document.querySelector('.editable').innerHTML ;
        await _SaveMemo2FB(title,content) ;
    }) ;
    tagAppIconTools.querySelector('#idBTNPlusButton').addEventListener('click',(event)=>{
        //alert('idBTNPlusButton') ;
        document.querySelector('.editable').innerHTML='new...' ;
        tagAppIconTools.querySelector('#idMemoTitle').value = '...' ;
    }) ;
    tagAppIconTools.querySelector('#idBTNListMemo').addEventListener('click',async (event)=>{
        const drawer = document.querySelector('.drawer-overview');
        const closeButton = drawer.querySelector('sl-button[variant="primary"]');
    

        function renderMemoItem(memoList,jsonMemo){
            let tagMemoItem = document.createElement('div') ;
            memoList.appendChild(tagMemoItem) ;
            tagMemoItem.innerHTML=`
                <span>${jsonMemo.title}</span>
            ` ;
            tagMemoItem.dataset.memoID = jsonMemo.memoID ;

            tagMemoItem.addEventListener('click',(event)=>{
                for(let i=0;i<gMemos.length;i++){
                    if(gMemos[i].memoID == tagMemoItem.dataset.memoID){
                        document.querySelector('.editable').innerHTML=gMemos[i].memo ;
                        tagAppIconTools.querySelector('#idMemoTitle').value = gMemos[i].title ;
                        document.querySelector('.editable').dataset.memoID = tagMemoItem.dataset.memoID ;
                        break ;
                    }
                }
            }) ;
        }

        if(event.target.dataset.memoRendered!='true'){
            gMemos =await _ListMemo4FB() ;
            console.log(gMemos) ;
            if(gMemos.length<=0)return ;
            document.querySelector('.editable').innerHTML=gMemos[0].memo ;
            tagAppIconTools.querySelector('#idMemoTitle').value = gMemos[0].title ;
            document.querySelector('.editable').dataset.memoID = gMemos[0].memoID ;
            event.target.dataset.memoRendered = 'true' ;

            closeButton.addEventListener('click', () => drawer.hide());

            appDrawerContent = drawer.querySelector('.appDrawerContent');
            for(let i=0;i<gMemos.length;i++){
                renderMemoItem(appDrawerContent,gMemos[i]) ;
            }

        }

        drawer.show();
    }) ;
} ;


function genMemoID(){
    let now = dayjs() ;
    let cDate = now.format("YYYYMMDD") ;
    const array = new Uint16Array(1);
    window.crypto.getRandomValues(array);
    // To get a number between 1000 and 9999 (inclusive)
    const random4Digit = 1000 + (array[0] % 9000);
    console.log(random4Digit);
    return `${cDate}${random4Digit}` ;
}

async function _SaveMemo2FB(memoTitle,memoContent){

    let cDate = new Date() ;
    let jsonMemo = {
        "memoID": genMemoID(),
        "title": memoTitle,
        "memo":memoContent,
        "timeStamp":cDate.getTime()
    } ;

    //https://outpost-medium-20250810.asia-southeast1.firebasedatabase.app/memos
    const urlDict = `https://outpost-medium-20250810.asia-southeast1.firebasedatabase.app/memos/${jsonMemo.memoID}.json`;
    let putResponse = await fetch(urlDict, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonMemo)
    });
    if (!putResponse.ok) {
        console.log(`Failed to logDeal : ${putResponse.statusText}`);
    }
    console.log("logDeal successfully!");
}

async function _ListMemo4FB(){
    let url=`https://outpost-medium-20250810.asia-southeast1.firebasedatabase.app/memos.json` ;
    let result = await fetch(url) ;
    let jsonMemos=await result.json() ;
    console.log(jsonMemos);

    let memoKeys = Object.keys(jsonMemos) ;
    let memos = [] ;
    for(let i=0;i<memoKeys.length;i++){
        memos.push(jsonMemos[memoKeys[i]]) ;
    }
    function sortMemosByTimestamp(memosArray) {
        return memosArray.sort((a, b) => b.timeStamp - a.timeStamp);
    }

    let sortedMemos = sortMemosByTimestamp(memos) ;
    return sortedMemos ;
}

const _renderPanel=async (tagPanel)=>{
    console.log('appBox _renderPanel') ;
    //alert('will render panel')

    if(tagPanel.dataset.rendered =='true')return ;

    tagPanel.innerHTML=`
        
    ` ;

    

    tagPanel.dataset.rendered='true' ;    
} ;

const _renderWorkStudio=async (tagRightPanelMain)=>{
    tagRightPanelMain.innerHTML=`
    <div class="editable"></div>
    `;
    //var editor = new MediumEditor('.mediumEditor');
    var elements = tagRightPanelMain.querySelectorAll('.editable'),
    editor = new MediumEditor(elements,{
      toolbar: {
          /* These are the default options for the toolbar,
            if nothing is passed this is what is used */
          allowMultiParagraphSelection: true,
          buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote'],
          diffLeft: 0,
          diffTop: -10,
          firstButtonClass: 'medium-editor-button-first',
          lastButtonClass: 'medium-editor-button-last',
          relativeContainer: null,
          standardizeSelectionStart: false,
          static: false,
          /* options which only apply when static is true */
          align: 'center',
          sticky: false,
          updateOnEmptySelection: false
      }
    });

    // Save content on input
    tagRightPanelMain.querySelector('.editable').addEventListener('input', function() {
        localStorage.setItem('diaryContent', this.innerHTML);
        
    });
} ;


function genBoxID(){
    let now = dayjs() ;
    let cDate = now.format("YYYYMMDD") ;

    const array = new Uint16Array(1);
    window.crypto.getRandomValues(array);

    // To get a number between 1000 and 9999 (inclusive)
    const random4Digit = 1000 + (array[0] % 9000);
    console.log(random4Digit);

    return `${cDate}${random4Digit}` ;
}





// Load saved content on page load
window.onload = function() {
    const savedContent = localStorage.getItem('diaryContent');
    if (savedContent) {
        document.querySelector('.editable').innerHTML = savedContent;
    }
};
