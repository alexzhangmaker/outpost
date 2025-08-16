function appMeta(){
    return {
        name:'writeAnywhere',
        title:'write.Anywhere',
        appTitle:_appTitle,
        renderPanel:_renderPanel,
        renderHeadTools:_renderHeadTools,
        renderWorkStudio:_renderWorkStudio,
        injectStyle:_injectStyle_AppWriteAnywhere
    }
}

const _appTitle = ()=>{
    console.log(`_appTitle`) ;
    return 'write.AnywhereV2' ;
} ;

const _style_AppWriteAnywhere=`
.memoBrowser{
    width:100% ;
    flex-grow: 1;
    overflow-y: hidden;
    overflow-x: hidden;

    padding-top: 40px;
    padding-left: 5px;

}

#idMemoList{
    width: 100%;
    height:100%;

    overflow-x: hidden;
    overflow-y: auto;

    display: flex;
    flex-direction: column;
    gap: 5px;

    overflow-y: auto;
    overflow-x: hidden;
}

.memoListItem{
    font-family: "Montserrat", sans-serif;
    font-optical-sizing: auto;
    font-weight: 400;
    font-style: normal;
    font-size: 16px;

    padding-bottom: 2px;
    margin-bottom: 2px;

    display: flex;
    flex-direction: row;
    gap:5px;
}

.memoListItem:hover{
    cursor: pointer;;
}

input[type="text"] {
    border: none; /* Removes all default borders */
    border-bottom: 1px solid #a39797; /* Applies a 2px solid dark gray bottom border */
    width: 100%;*/
    box-sizing: border-box; /* Includes padding and border in the element's total width and height */
}
.searchInput{
    display: flex;
    flex-direction: row;
    gap: 20px;
    /*padding-left: 5px;*/
    padding-right: 5px;
    justify-content: space-between;
}

.text-container {
    /*width: 100%;*//*200px;*/ /* Fixed width */
    overflow-wrap: break-word; /* Wrap long words */
    border-left: 2px solid black; /* Vertical line on the left */
    padding-left: 10px; /* Space between line and text */
    line-height: 1.5; /* Optional: Adjust line spacing for readability */
    max-width: 250px;
    flex-grow: 1;
}
.memoTools{
    width:40px;
}


.iconTools{
    display: flex;
    gap:10px ;
}

.inputToolbar{
    width:50% ;
}

#docTitle{
    font-size: 18px;
    width:100% ;
}

#docTitle:focus{
    outline: none;
}

input[type="text"] {
    border: none; /* Removes all default borders */
    border-bottom: 1px solid #a39797; /* Applies a 2px solid dark gray bottom border */
    /*padding: 8px;
    width: 100%;*/
    box-sizing: border-box; /* Includes padding and border in the element's total width and height */
}
    
` ;

const _inject_StyleResource= ()=>{
/*
    let linkBootstrap = document.createElement('link');
    linkBootstrap.rel = 'stylesheet';
    linkBootstrap.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css';
    document.head.appendChild(linkBootstrap);

    let linkTippy = document.createElement('link');
    linkTippy.rel = 'stylesheet';
    linkTippy.href = 'https://unpkg.com/tippy.js@6/dist/tippy.css';
    document.head.appendChild(linkTippy);
*/
} ;

const _injectStyle_AppWriteAnywhere = ()=>{
    const styleElement = document.createElement('style');
    styleElement.textContent = _style_AppWriteAnywhere;
    // Append the style to the document head
    document.head.appendChild(styleElement);
};


const _renderPanel=async (tagPanel)=>{
    console.log('appWriteAnywhere _renderPanel') ;
    //alert('will render panel')
    tagPanel.innerHTML=`
    <div class="memoBrowser">
        <div class="searchInput">
            <input  type="text" placeholder="search..." class="roboto-400">
            <i class="bi-search"></i>
        </div>
        <div id="idMemoList">
        </div>
    </div>
    `;

} ;



const initialMDContent = '# Welcome to the Markdown Editor\n\nType `$E=mc^2$` for LaTeX formulas.\n\nClick the table button (📊) to create/edit tables with Grid.js.' ;
// Initialize Toast UI Editor


const { Editor } = toastui;
let editor ;
let grid;

// Initialize Grid.js in modal
const gridData = [
  ['Header 1', 'Header 2', 'Header 3'],
  ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
  ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
] ;

const _renderWorkStudio=async (tagRightPanelMain)=>{
  console.log('appWriteAnywhere _renderWorkStudio') ;
  
  tagRightPanelMain.classList.add('mdEditorContainer') ;
  tagRightPanelMain.innerHTML=
    `<!---html code for Markdown Editor-->
    <div class="workingSpace">
      <div class="workingFocus">
        
      
        <div id="editor"></div>
      </div>
    </div>

    <!-- Modal for Grid.js table editor -->
    <div id="tableModal">
      <div id="gridContainer">
        <div id="grid"></div>
        <div class="mt-4 flex justify-end space-x-2">
          <button id="idBTNSaveTable" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Save Table</button>
          <button id="idBTNCloseModal" class="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
        </div>
      </div>
    </div>
    <!----end of markdown editor-->
  ` ;



  editor = new Editor({
    el: document.querySelector('#editor'),
    height: '90%',
    initialEditType: 'markdown',
    previewStyle: 'vertical',
    initialValue: initialMDContent,
    addons: ['math'],
    toolbarItems: [
      ['heading', 'bold', 'italic', 'strike'],
      ['hr', 'quote'],
      ['ul', 'ol', 'task', 'indent', 'outdent'],
      ['table', 'image', 'link'],
      ['code', 'codeblock'],
      [{
        name: 'gridTable',
        tooltip: 'Insert/Edit Table with Grid.js',
        command: 'openGridJsTable',
        text: '📊',
        className: 'grid-table-button'
      }]
    ],
    hooks: {
      afterPreviewRender: () => {
        console.log('Rendering MathJax in preview');
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, document.querySelector('.toastui-editor-contents')]);
      }
    }
  });


  // Open Grid.js table editor
  editor.addCommand('markdown', 'openGridJsTable', () => {
    document.querySelector('#tableModal').classList.add('show');
    initializeGrid(gridData);
  });
    

  // Event listeners
  



  tagRightPanelMain.querySelector('#idBTNSaveTable').addEventListener('click', async () => {
    const gridData = [
      grid.config.columns.map(col => col.name),
      ...grid.config.data
    ];
    const markdownTable = gridToMarkdownTable(gridData);
    editor.insertText(markdownTable);
    document.getElementById('tableModal').classList.remove('show');
    grid.destroy();
  }) ;

  // Save table to editor
  // Close modal
  tagRightPanelMain.querySelector('#idBTNCloseModal').addEventListener('click', () => {
    document.getElementById('tableModal').classList.remove('show');
    grid.destroy();
  });
} ;


function initializeGrid(data) {
  grid = new gridjs.Grid({
    columns: data[0].map((header, index) => ({
      name: header,
      attributes: { contenteditable: true }
    })),
    data: data.slice(1),
    style: {
      table: { width: '100%' },
      th: { padding: '8px', textAlign: 'left' },
      td: { padding: '8px' }
    }
  }).render(document.getElementById('grid'));
}

// Convert Grid.js data to Markdown table
function gridToMarkdownTable(gridData) {
  const headers = gridData[0];
  const rows = gridData.slice(1);
  let markdown = `| ${headers.join(' | ')} |\n`;
  markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
  rows.forEach(row => {
    markdown += `| ${row.join(' | ')} |\n`;
  });
  return markdown;
}


function renderMemoList(tagMemoBrowser,memoArray){
  //idMemoList
  let tagMemoList = tagMemoBrowser.querySelector('#idMemoList');

  memoArray.forEach(jsonMemo=>{
    let tagMemoItem = document.createElement('div') ;
    tagMemoItem.classList.add('memoListItem') ;
    tagMemoList.appendChild(tagMemoItem) ;
    tagMemoItem.innerHTML=`
        <div class="text-container">${jsonMemo.title}</div>
        <div class="memoTools">
          <i class="bi-trash outpostBTN" id="idBTNRemoveMemo"></i>
        </div>
    ` ;
    tagMemoItem.dataset.memoID = jsonMemo.id ;
    tagMemoItem.addEventListener('click',async (event)=>{
      let tagEditor = document.querySelector('#editor') ;
      if(tagMemoItem.dataset.memoID == tagEditor.dataset.ActiveMemoID)return ;

      console.log(`click on ${tagMemoItem.dataset.memoID}`) ;
      let jsonMemo = await API_FetchMDMemo(tagMemoItem.dataset.memoID) ;
      if(jsonMemo==null)return ;
      
      document.getElementById('docTitle').value = jsonMemo.title;
      editor.setMarkdown(jsonMemo.content);
      tagEditor.dataset.ActiveMemoID = tagMemoItem.dataset.memoID ;

      document.getElementById('idBTNToggleNavBar').click() ;
    }) ;
    tagMemoItem.querySelector('#idBTNRemoveMemo').addEventListener('click',async (event)=>{
      if(tagMemoItem.dataset.memoID==undefined || tagMemoItem.dataset.memoID =='')return ;
      await API_DeleteMDMemo(tagMemoItem.dataset.memoID);
      tagMemoItem.remove();
    }) ;

  }) ;
}


document.getElementById('idBTNLoadNotes').addEventListener('click', async () => {
    let jsonMemos = await API_LoadLatestMemo_Supabase();
    console.log(jsonMemos) ;

    let tagNaviPanel = document.querySelector('.navigationPanel') ;
    if(tagNaviPanel.dataset.rendered!='true')tagNaviPanel.dataset.rendered = 'true' ;

    let tagMemoBrowser = document.querySelector('.memoBrowser') ;
    tagMemoBrowser.querySelector('#idMemoList').innerHTML=`` ;
    renderMemoList(tagMemoBrowser,jsonMemos) ;
});




const _renderHeadTools=async (tagAppIconTools)=>{
  tagAppIconTools.innerHTML=`
      <input id="docTitle" type="text" placeholder="Document Title" class="roboto-400">
      <i class="bi-sliders outpostBTN" id="idBTNNoteSetting"></i>
      <i class="bi-hdd outpostBTN" id="idBTNSaveButton"></i>
      <i class="bi-clipboard-plus outpostBTN" id="idBTNPlusButton"></i>
      <i class="bi-list-check outpostBTN" id="idBTNShowDrawer"></i>
  ` ; 
  tagAppIconTools.classList.add('writeAnywhereTools') ;
  tippy('#idBTNNoteSetting', {content: "笔记参数设置!"});
  tippy('#idBTNSaveButton', {content: "保存到云端!"});
  tippy('#idBTNPlusButton', {content: "创建笔记!"});
  tippy('#idBTNShowDrawer', {content: "笔记总览!"});


  tagAppIconTools.querySelector('#idBTNShowDrawer').addEventListener('click',(event)=>{
      const drawer = document.querySelector('.drawer-scrolling');
      const closeButton = drawer.querySelector('sl-button[variant="primary"]');
  
      drawer.show();
      closeButton.addEventListener('click', () => drawer.hide());
  }) ;

  tagAppIconTools.querySelector('#idBTNPlusButton').addEventListener('click', async () => {
    document.getElementById('docTitle').value = 'new doc';
    editor.setMarkdown(initialMDContent);
    let tagEditor = document.querySelector('#editor') ;

    tagEditor.dataset.ActiveMemoID = '';//tagMemoItem.dataset.memoID ;
  });

  tagAppIconTools.querySelector('#idBTNSaveButton').addEventListener('click', async () => {
    const title = document.getElementById('docTitle').value || 'Untitled';
    const content = editor.getMarkdown();
    
    let tagEditor = document.querySelector('#editor') ;
    let activeMemoID = tagEditor.dataset.ActiveMemoID ;
    if(activeMemoID=='' || activeMemoID==undefined){
      await API_PlusMDMemo_Supabase(title, content);
    }else{
      await API_UpdateMDMemo(activeMemoID,title,content) ;
    }
  });

  tagAppIconTools.querySelector('#idBTNNoteSetting').addEventListener('click', async () => {
    let tagDlgSaveNote = document.querySelector('#idDlgSaveNote') ;
    tagDlgSaveNote.classList.add('outpostDlg');
    tagDlgSaveNote.showModal();
  });
  
} ;

//default:notes:[]
/*
let jsonKnowledgeTree={
  lifeStyle:{},
  investment:{},
  hobby:{},
  programming:{},
  lifeLearning:{
    Thai:{},
    Chinese:{},
    English:{}
  },
  improvision:{}
} ;
*/

let jsonKnowledgeTree={
  lifeStyle:{
    code:"0001",
    title:"lifeStyle"
  },
  
  lifeLearning:{
    code:"0003",
    title:"lifeLearning",
    Thai:{
      code:"00031",
      title:"Thai"
    },
    Chinese:{
      code:"00032",
      title:"Chinese"
    },
    English:{
      code:"00033",
      title:"English",
      writing:{
        code:"000331",
        title:"English Writing"
      }
    },
    notes:['21213','dfsfds11-2']
  }
  ,
  investment:{
    code:"0002",
    title:"investment"
  },
  improvise:{
    code:"0002",
    title:"闪念笔记"
  }


} ;



function renderKTNode(tagContainer,tagListContainer,jsonKTNode){
  let tagTreeNode = document.createElement('details');
  tagContainer.appendChild(tagTreeNode) ;
  tagTreeNode.dataset.code = jsonKTNode.code ;
  if(jsonKTNode.hasOwnProperty('notes')){
    tagTreeNode.dataset.notes = JSON.stringify(jsonKTNode.notes) ;
  }else{
    tagTreeNode.dataset.notes = JSON.stringify([]) ;
  }

  
  tagTreeNode.innerHTML = `
    <summary class="treeNodeSummary">
      <div>
        <i class="bi-folder2 outpostBTN"></i>
        <i class="bi-folder2-open outpostBTN"></i>
        <span>${jsonKTNode.title}</span>
      </div>
    </summary>
    <ul class="treeNodeChildren"></ul>
  ` ;
  tagTreeNode.classList.add('treeNodeDetails') ;

  let nodeKeys = Object.keys(jsonKTNode) ;
  tagTreeNode.dataset.hasChildren = 'false' ;
  for(let i=0;i<nodeKeys.length;i++){
    let nodeKey = nodeKeys[i] ;
    if(nodeKey =='code' || nodeKey =='title' ||nodeKey =='notes' )continue ;

    tagTreeNode.dataset.hasChildren = 'true ;'
    let jsonNextNode = jsonKTNode[nodeKey] ;
    renderKTNode(tagTreeNode.querySelector('ul'),tagListContainer,jsonNextNode) ;
  }

  tagTreeNode.addEventListener('click',(event)=>{
    //alert(`${tagTreeNode.innerText}`) ;
    //event.stopPropagation() ;
    //if(tagTreeNode.dataset.hasChildren=="false")
    {
      //alert(`${tagTreeNode.innerText}`) ;
      renderNodeContent(tagListContainer,JSON.parse(tagTreeNode.dataset.notes)) ;
      event.stopPropagation() ;
    }
  }) ;
}

function renderNodeContent(tagContainer,notes){
  tagContainer.querySelector('.treeNodeContent').innerHTML=`` ;
  for(let i=0;i<notes.length;i++){
    let tagNote = document.createElement('div') ;
    tagContainer.querySelector('.treeNodeContent').appendChild(tagNote) ;
    tagNote.innerHTML=`${notes[i]}` ;
    tagNote.addEventListener('click',async (event)=>{
      const drawer = document.querySelector('.drawer-scrolling');
  
      drawer.hide();
    }) ;
  }
}

function renderKnowledgeTree(tagContainer,jsonKnowledgeTree){
  let ktKeys = Object.keys(jsonKnowledgeTree) ;

  for(let i=0;i<ktKeys.length;i++){
    console.log(jsonKnowledgeTree[ktKeys[i]]) ;
    if(typeof jsonKnowledgeTree[ktKeys[i]] == 'object'){
      if(Object.keys(jsonKnowledgeTree).length != 0)renderKTNode(tagContainer.querySelector('.treeContainer'),tagContainer.querySelector('.treeListContainer'),jsonKnowledgeTree[ktKeys[i]]) ;
    }
  }
}

renderKnowledgeTree(document.querySelector(".appTreeBrowser"),jsonKnowledgeTree);
