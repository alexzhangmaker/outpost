function appMeta(){
    return {
        name:'writeAnywhere',
        title:'write.Anywhere',
        appTitle:_appTitle,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio,
        injectStyle:_injectStyle_AppBoxAnywhere
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

const _injectStyle_AppBoxAnywhere = ()=>{
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

const _renderWorkStudio=async (tagRightPanelMain)=>{
    console.log('appWriteAnywhere _renderWorkStudio') ;

} ;



const initialMDContent = '# Welcome to the Markdown Editor\n\nType `$E=mc^2$` for LaTeX formulas.\n\nClick the table button (📊) to create/edit tables with Grid.js.' ;
// Initialize Toast UI Editor


const { Editor } = toastui;
const editor = new Editor({
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

// Initialize Grid.js in modal
let grid;
const gridData = [
  ['Header 1', 'Header 2', 'Header 3'],
  ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
  ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
] ;
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

// Open Grid.js table editor
editor.addCommand('markdown', 'openGridJsTable', () => {
  document.getElementById('tableModal').classList.add('show');
  initializeGrid(gridData);
});

// Save table to editor
document.getElementById('saveTable').addEventListener('click', () => {
  const gridData = [
    grid.config.columns.map(col => col.name),
    ...grid.config.data
  ];
  const markdownTable = gridToMarkdownTable(gridData);
  editor.insertText(markdownTable);
  document.getElementById('tableModal').classList.remove('show');
  grid.destroy();
});

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('tableModal').classList.remove('show');
  grid.destroy();
});
// Save document to Supabase






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
    }) ;
    tagMemoItem.querySelector('#idBTNRemoveMemo').addEventListener('click',async (event)=>{
      if(tagMemoItem.dataset.memoID==undefined || tagMemoItem.dataset.memoID =='')return ;
      await API_DeleteMDMemo(tagMemoItem.dataset.memoID);
      tagMemoItem.remove();
    }) ;

  }) ;
}


// Event listeners
document.querySelector('#idBTNSaveButton').addEventListener('click', async () => {
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

document.getElementById('loadButton').addEventListener('click', async () => {
    let jsonMemos = await API_LoadLatestMemo_Supabase();
    console.log(jsonMemos) ;

    let tagNaviPanel = document.querySelector('.navigationPanel') ;
    if(tagNaviPanel.dataset.rendered!='true')tagNaviPanel.dataset.rendered = 'true' ;

    let tagMemoBrowser = document.querySelector('.memoBrowser') ;
    tagMemoBrowser.querySelector('#idMemoList').innerHTML=`` ;
    renderMemoList(tagMemoBrowser,jsonMemos) ;
});

document.querySelector('#idBTNPlusButton').addEventListener('click', async () => {
    /*
    const title = document.getElementById('docTitle').value || 'Untitled';
    const content = editor.getMarkdown();    
    await API_PlusMDMemo_Supabase(title, content);
    */

  document.getElementById('docTitle').value = 'new doc';
  editor.setMarkdown(initialMDContent);
  let tagEditor = document.querySelector('#editor') ;

  tagEditor.dataset.ActiveMemoID = '';//tagMemoItem.dataset.memoID ;
});

/*
document.getElementById('RemoveButton').addEventListener('click', async () => {
    let tagEditor = document.querySelector('#editor') ;
    let activeMemoID = tagEditor.dataset.ActiveMemoID ;
    if(activeMemoID==undefined || activeMemoID =='')return ;
    await API_DeleteMDMemo(activeMemoID);
});
*/
