
function _injectMDEditorCSS(){

}

function injectMDEditor(tagMDEditorContainer){

}





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






function renderMemoList(memoArray){
  //idMemoList
  let tagMemoList = document.querySelector('#idMemoList');

  tagMemosContainer = tagMemoList.querySelector(".memoList");
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
  }) ;
}


// Event listeners
document.getElementById('saveButton').addEventListener('click', async () => {
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
    await API_LoadLatestMemo_Supabase();
});

document.getElementById('PlusButton').addEventListener('click', async () => {
    const title = document.getElementById('docTitle').value || 'Untitled';
    const content = editor.getMarkdown();    
    await API_PlusMDMemo_Supabase(title, content);
});

document.getElementById('RemoveButton').addEventListener('click', async () => {
    let tagEditor = document.querySelector('#editor') ;
    let activeMemoID = tagEditor.dataset.ActiveMemoID ;
    if(activeMemoID==undefined || activeMemoID =='')return ;
    await API_DeleteMDMemo(activeMemoID);
});


function changeHTMLTitle(csTitle){
    document.title = csTitle;
}

changeHTMLTitle('write.Anywhere') ;
