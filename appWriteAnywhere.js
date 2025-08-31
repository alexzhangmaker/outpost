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



const initialMDContent = '# Welcome to the Markdown Editor' ;
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

  // When initializing the editor
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
      [{ name: 'gridTable', tooltip: 'Insert/Edit Table with Grid.js', command: 'openGridJsTable', text: '📊', className: 'grid-table-button' }],
      [
        { 
          name: 'outpostTbl', 
          tooltip: 'outpost tbl', 
          command: 'outpostTblImport', 
          text: '📊', 
          className: 'tui-editor-toolbar-my-custom-button' 
        }
      ] 

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

  editor.addCommand('markdown', 'outpostTblImport', () => {
    //document.querySelector('#tableModal').classList.add('show');
    //initializeGrid(gridData);
    console.log('outpostTblImport') ;
    //alert('outpostTblImport') ;
    openImportModal(editor) ;
  });

  
function openImportModal(editor) {
  console.log('openImportModal') ;
  const modal = document.createElement('div');//tableModal modal-overlay
  modal.innerHTML = `
    <style>
      .modalOverlay{
        position:fixed;
        top:0;left:0 ;
        width:100% ;height:100%;
        background:rgba(0,0,0,0.6) ;
        display:flex ;
        justify-content:center;
        align-items:center;
        z-index:9999;
      }

      .modalContent{
        background:white;
        padding:20px;
        border-radius:5px;
        width:500px;
        max-width:90% ;
      }
    </style>
    <div class="modalOverlay">

      <div class="modalContent">
        <h3>Paste CSV or JSON</h3>
        <textarea id="dataInput" rows="10" placeholder="Paste your data here..."></textarea>
        <br/>
        <button id="importBtn">Import</button>
        <button id="cancelBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('importBtn').onclick = () => {
    const rawData = document.getElementById('dataInput').value;
    const markdownTable = parseDataToMarkdown(rawData);
    if (markdownTable) {
      editor.insertText(markdownTable);
    }
    document.body.removeChild(modal);
  };

  document.getElementById('cancelBtn').onclick = () => {
    document.body.removeChild(modal);
  };
}


function parseDataToMarkdown(data) {
  try {
    let rows = [];

    if (data.trim().startsWith('[')) {
      // JSON array of objects
      const json = JSON.parse(data);
      const headers = Object.keys(json[0]);
      rows.push(headers);
      json.forEach(obj => {
        rows.push(headers.map(h => obj[h]));
      });
    } else {
      // CSV
      rows = data.trim().split('\n').map(row => row.split(','));
    }

    const header = `| ${rows[0].join(' | ')} |`;
    const separator = `| ${rows[0].map(() => '---').join(' | ')} |`;
    const body = rows.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n');

    return `${header}\n${separator}\n${body}`;
  } catch (err) {
    alert('Invalid CSV or JSON format');
    return null;
  }
}



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
      //let jsonMemo = await API_FetchMDMemo(tagMemoItem.dataset.memoID) ;
      let jsonMemo = await _FetchDocumentSupabase(tagMemoItem.dataset.memoID) ;

      
      if(jsonMemo==null)return ;
      
      document.getElementById('docTitle').value = jsonMemo.title;
      editor.setMarkdown(jsonMemo.content);

      let tagPreActiveMemo = tagMemoBrowser.querySelector('.activeMemo') ;
      if(tagPreActiveMemo)tagPreActiveMemo.classList.remove('activeMemo') ;

      tagEditor.dataset.ActiveMemoID = tagMemoItem.dataset.memoID ;
      tagMemoItem.classList.add('activeMemo') ;  
      
     
      document.getElementById('idBTNToggleNavBar').click() ;
    }) ;
    tagMemoItem.querySelector('#idBTNRemoveMemo').addEventListener('click',async (event)=>{
      if(tagMemoItem.dataset.memoID==undefined || tagMemoItem.dataset.memoID =='')return ;
      //await API_DeleteMDMemo(tagMemoItem.dataset.memoID);
      await _DeleteDocumentSupabase(tagMemoItem.dataset.memoID) ;
      await removeNoteFromFolder(tagMemoItem.dataset.memoID) ;
      tagMemoItem.remove();
    }) ;

  }) ;
}


document.getElementById('idBTNLoadNotes').addEventListener('click', async () => {
    //let jsonMemos = await API_LoadLatestMemo_Supabase();
    let jsonMemos = await _FetchDocumentsSupabase();
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
      <i class="bi-hdd outpostBTN" id="idBTNSaveButton"></i>
      <i class="bi-inbox outpostBTN" id="idBTNNoteArchive"></i>

      <i class="bi-sliders outpostBTN" id="idBTNNoteSetting"></i>
      <i class="bi-clipboard-plus outpostBTN" id="idBTNPlusButton"></i>
      <i class="bi-fullscreen outpostBTN" id="idBTNFullScreen"></i>
      <i class="bi-printer outpostBTN" id="idBTNPrintNote"></i>
      <i class="bi-list-check outpostBTN" id="idBTNShowDrawer"></i>
  ` ; 
  tagAppIconTools.classList.add('writeAnywhereTools') ;
  tippy('#idBTNNoteSetting', {content: "笔记参数设置!"});
  tippy('#idBTNSaveButton', {content: "保存到云端!"});
  tippy('#idBTNPlusButton', {content: "创建笔记!"});
  tippy('#idBTNShowDrawer', {content: "笔记总览!"});
  tippy('#idBTNFullScreen', {content: "全屏显示!"});
  tippy('#idBTNPrintNote', {content: "打印笔记!"});
  tippy('#idBTNNoteArchive', {content: "笔记归类 !"});

  

  

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

  tagAppIconTools.querySelector('#idBTNNoteArchive').addEventListener('click', async (event) => {
    let tagEditor = document.querySelector('#editor') ;
    let noteID = tagEditor.dataset.ActiveMemoID;//tagMemoItem.dataset.memoID ;
    if(noteID==""|| noteID==undefined)return ;

    let tagDlgArchiveNote = document.querySelector('#idDlgArchiveNote') ;
    tagDlgArchiveNote.classList.add('outpostDlg');

    let tagDlgBody = tagDlgArchiveNote.querySelector(".outpostDlgBody") ;
    tagDlgBody.innerHTML=`<div class="accordionContainer" id="NoteArchiveAccordion"></div>` ;

    let jsonNoteFolderTree =  await fetchNoteFolderTree("alexszhang@gmail.com") ;
    console.log(jsonNoteFolderTree) ;
    await renderNoteFolderAccordion(jsonNoteFolderTree[0].noteFolderTree, 
      tagDlgBody.querySelector("#NoteArchiveAccordion"),
      _onClickAccordionArchive);

    tagDlgArchiveNote.showModal();
  });

  tagAppIconTools.querySelector('#idBTNSaveButton').addEventListener('click', async () => {
    const title = document.getElementById('docTitle').value || 'Untitled';
    const content = editor.getMarkdown();
    
    let tagEditor = document.querySelector('#editor') ;
    let activeMemoID = tagEditor.dataset.ActiveMemoID ;
    if(activeMemoID=='' || activeMemoID==undefined){
      //await API_PlusMDMemo_Supabase(title, content);
      activeMemoID = await _InsertDocumentSupabase(title, content) ;
      if(activeMemoID!=''){
        tagEditor.dataset.ActiveMemoID = activeMemoID ;
        let idFolderDefault = '680a31ab-cda1-4973-8ecb-788a7398ac4c' ;
        await addNote2Folder(activeMemoID,idFolderDefault) ;

      }
    }else{
      //await API_UpdateMDMemo(activeMemoID,title,content) ;
      await _UpdateDocumentSupabase(activeMemoID,title,content) ;
    }
  });

  tagAppIconTools.querySelector('#idBTNNoteSetting').addEventListener('click', async () => {
    alert('tbd')
  });





tagAppIconTools.querySelector('#idBTNPrintNote').addEventListener('click', _formatPrint);



function _formatPrint() {
  const markdownContent = editor.getMarkdown();
  const htmlContent = editor.getHTML();

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Printable Markdown Content with A4 Preview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          display: flex;
          font-size:14px ;
        }
        .main-container {
          display: flex;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }
        .content {
          flex: 1;
          max-width: 800px;
          padding: 20px;
          overflow-y: auto;
          height: 100vh;
          box-sizing: border-box;
        }
        .preview-container {
          flex: 0 0 300px;
          padding: 20px;
          background: #f5f5f5;
          border-left: 1px solid #ccc;
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          box-sizing: border-box;
        }
        .preview-page {
          width: 148mm;
          height: 210mm;
          background: white;
          margin: 0 auto;
          padding: 14mm;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
          box-sizing: border-box;
          font-size: 8.4pt;
          overflow: hidden;
          display: none;
        }
        .preview-page.active {
          display: block;
        }
        .preview-page h1, .preview-page h2, .preview-page h3, .preview-page h4, .preview-page h5, .preview-page h6 {
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        .preview-page p, .preview-page ul, .preview-page ol, .preview-page blockquote, .preview-page pre {
          page-break-inside: avoid;
        }
        .preview-page img {
          max-width: 100%;
          height: auto;
          page-break-inside: avoid;
        }
        .preview-page table {
          page-break-inside: avoid;
        }
        .preview-page tr, .preview-page td, .preview-page th {
          page-break-inside: avoid;
        }
        .preview-nav {
          text-align: center;
          margin: 10px 0;
        }
        .preview-nav button {
          padding: 5px 10px;
          margin: 0 5px;
          cursor: pointer;
        }
        .preview-nav button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .page-break {
          position: relative;
        }
        .page-break::before {
          content: "Page Break";
          display: block;
          background: #ffeb3b;
          color: #000;
          padding: 5px;
          margin: 10px 0;
          border: 1px dashed #f00;
          text-align: center;
          font-weight: bold;
        }
        .content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre {
          cursor: pointer;
        }
        .content p:hover, .content h1:hover, .content h2:hover, .content h3:hover, .content h4:hover, .content h5:hover, .content h6:hover, .content ul:hover, .content ol:hover, .content blockquote:hover, .content pre:hover {
          background: #f0f0f0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            display: block;
          }
          .main-container {
            display: block;
          }
          .content {
            max-width: 100%;
            padding: 1cm;
            overflow: visible;
          }
          .preview-container {
            display: none;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
          h1, h2, h3, h4, h5, h6 {
            page-break-before: auto;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          p, ul, ol, blockquote, pre {
            page-break-inside: avoid;
          }
          img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
          }
          table {
            page-break-inside: avoid;
          }
          tr, td, th {
            page-break-inside: avoid;
          }
          .page-break {
            page-break-before: always;
          }
          .page-break::before {
            display: none;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="main-container">
        <div class="content">${htmlContent}</div>
        <div class="preview-container">
          <div class="preview-nav">
            <button id="prev-page" disabled>Previous</button>
            <button id="next-page">Next</button>
            <button id="print-page" class="no-print">Print</button>
          </div>
          <div class="preview-pages"></div>
        </div>
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const elements = document.querySelectorAll('.content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre');
          const previewPagesContainer = document.querySelector('.preview-pages');
          const prevButton = document.querySelector('#prev-page');
          const nextButton = document.querySelector('#next-page');
          const printButton = document.querySelector('#print-page');
          let currentPageIndex = 0;
          let pages = [];

          function updatePreview() {
            previewPagesContainer.innerHTML = '';
            pages = [];

            let currentPage = document.createElement('div');
            currentPage.classList.add('preview-page');
            if (currentPageIndex === 0) currentPage.classList.add('active');
            previewPagesContainer.appendChild(currentPage);
            pages.push(currentPage);

            const pageHeight = (210 - 28) * (96 / 25.4); // Approx 682px
            let currentHeight = 0;

            const contentElements = document.querySelectorAll('.content > *');
            contentElements.forEach(element => {
              if (!element.classList.contains('no-print')) {
                const clone = element.cloneNode(true);
                if (clone.classList.contains('page-break')) {
                  clone.classList.remove('page-break');
                }

                if (element.classList.contains('page-break') && currentPage.childElementCount > 0) {
                  currentPage = document.createElement('div');
                  currentPage.classList.add('preview-page');
                  if (currentPageIndex === pages.length) currentPage.classList.add('active');
                  previewPagesContainer.appendChild(currentPage);
                  pages.push(currentPage);
                  currentHeight = 0;
                }

                currentPage.appendChild(clone);
                const elementHeight = clone.offsetHeight;

                if (currentHeight + elementHeight > pageHeight && currentPage.childElementCount > 0 && !element.classList.contains('page-break')) {
                  clone.remove();
                  currentPage = document.createElement('div');
                  currentPage.classList.add('preview-page');
                  if (currentPageIndex === pages.length) currentPage.classList.add('active');
                  previewPagesContainer.appendChild(currentPage);
                  pages.push(currentPage);
                  currentHeight = 0;
                  currentPage.appendChild(clone.cloneNode(true));
                  currentHeight += elementHeight;
                } else {
                  currentHeight += elementHeight;
                }
              }
            });

            prevButton.disabled = currentPageIndex === 0;
            nextButton.disabled = currentPageIndex === pages.length - 1;
          }

          prevButton.addEventListener('click', () => {
            if (currentPageIndex > 0) {
              pages[currentPageIndex].classList.remove('active');
              currentPageIndex--;
              pages[currentPageIndex].classList.add('active');
              prevButton.disabled = currentPageIndex === 0;
              nextButton.disabled = false;
            }
          });

          nextButton.addEventListener('click', () => {
            if (currentPageIndex < pages.length - 1) {
              pages[currentPageIndex].classList.remove('active');
              currentPageIndex++;
              pages[currentPageIndex].classList.add('active');
              nextButton.disabled = currentPageIndex === pages.length - 1;
              prevButton.disabled = false;
            }
          });

          printButton.addEventListener('click', () => {
            window.print();
          });

          updatePreview();

          elements.forEach(element => {
            element.addEventListener('click', () => {
              if (element.classList.contains('page-break')) {
                element.classList.remove('page-break');
              } else {
                element.classList.add('page-break');
              }
              pages[currentPageIndex].classList.remove('active');
              currentPageIndex = 0;
              updatePreview();
            });
          });
        });
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function _formatPrinterr() {
  const markdownContent = editor.getMarkdown();
  const htmlContent = editor.getHTML();

  // Create a new window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printable Markdown Content with A4 Preview</title>
    <style>
      /* General layout for screen */
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        display: flex;
      }
      .main-container {
        display: flex;
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
      }
      .content {
        flex: 1;
        max-width: 800px;
        padding: 20px;
        overflow-y: auto;
        height: 100vh;
        box-sizing: border-box;
      }
      .preview-container {
        flex: 0 0 300px;
        padding: 20px;
        background: #f5f5f5;
        border-left: 1px solid #ccc;
        position: fixed;
        right: 0;
        top: 0;
        height: 100vh;
        box-sizing: border-box;
      }
      .preview-page {
        width: 148mm;
        height: 210mm;
        background: white;
        margin: 0 auto;
        padding: 14mm;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
        font-size: 8.4pt;
        overflow: hidden;
        display: none;
      }
      .preview-page.active {
        display: block;
      }
      .preview-page h1, .preview-page h2, .preview-page h3, .preview-page h4, .preview-page h5, .preview-page h6 {
        page-break-before: auto;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      .preview-page p, .preview-page ul, .preview-page ol, .preview-page blockquote, .preview-page pre {
        page-break-inside: avoid;
      }
      .preview-page img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
      }
      .preview-page table {
        page-break-inside: avoid;
      }
      .preview-page tr, .preview-page td, .preview-page th {
        page-break-inside: avoid;
      }
      .preview-nav {
        text-align: center;
        margin: 10px 0;
      }
      .preview-nav button {
        padding: 5px 10px;
        margin: 0 5px;
        cursor: pointer;
      }
      .preview-nav button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .page-break {
        position: relative;
      }
      .page-break::before {
        content: "Page Break";
        display: block;
        background: #ffeb3b;
        color: #000;
        padding: 5px;
        margin: 10px 0;
        border: 1px dashed #f00;
        text-align: center;
        font-weight: bold;
      }
      .content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre {
        cursor: pointer;
      }
      .content p:hover, .content h1:hover, .content h2:hover, .content h3:hover, .content h4:hover, .content h5:hover, .content h6:hover, .content ul:hover, .content ol:hover, .content blockquote:hover, .content pre:hover {
        background: #f0f0f0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          display: block;
        }
        .main-container {
          display: block;
        }
        .content {
          max-width: 100%;
          padding: 1cm;
          overflow: visible;
        }
        .preview-container {
          display: none;
        }
        @page {
          size: A4;
          margin: 2cm;
        }
        h1, h2, h3, h4, h5, h6 {
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        p, ul, ol, blockquote, pre {
          page-break-inside: avoid;
        }
        img {
          max-width: 100%;
          height: auto;
          page-break-inside: avoid;
        }
        table {
          page-break-inside: avoid;
        }
        tr, td, th {
          page-break-inside: avoid;
        }
        .page-break {
          page-break-before: always;
        }
        .page-break::before {
          display: none;
        }
        .no-print {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="main-container">
      <div class="content">
        ${htmlContent}
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const elements = document.querySelectorAll('.content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre');
        const previewPagesContainer = document.querySelector('.preview-pages');
        const prevButton = document.querySelector('#prev-page');
        const nextButton = document.querySelector('#next-page');
        let currentPageIndex = 0;
        let pages = [];
  
        function updatePreview() {
          previewPagesContainer.innerHTML = '';
          pages = [];
  
          let currentPage = document.createElement('div');
          currentPage.classList.add('preview-page');
          if (currentPageIndex === 0) currentPage.classList.add('active');
          previewPagesContainer.appendChild(currentPage);
          pages.push(currentPage);
  
          const pageHeight = (210 - 28) * (96 / 25.4); // Approx 682px
          let currentHeight = 0;
  
          const contentElements = document.querySelectorAll('.content > *');
          contentElements.forEach(element => {
            if (!element.classList.contains('no-print')) {
              const clone = element.cloneNode(true);
              if (clone.classList.contains('page-break')) {
                clone.classList.remove('page-break');
              }
  
              if (element.classList.contains('page-break') && currentPage.childElementCount > 0) {
                currentPage = document.createElement('div');
                currentPage.classList.add('preview-page');
                if (currentPageIndex === pages.length) currentPage.classList.add('active');
                previewPagesContainer.appendChild(currentPage);
                pages.push(currentPage);
                currentHeight = 0;
              }
  
              currentPage.appendChild(clone);
              const elementHeight = clone.offsetHeight;
  
              if (currentHeight + elementHeight > pageHeight && currentPage.childElementCount > 0 && !element.classList.contains('page-break')) {
                clone.remove(); // Remove from current page
                currentPage = document.createElement('div');
                currentPage.classList.add('preview-page');
                if (currentPageIndex === pages.length) currentPage.classList.add('active');
                previewPagesContainer.appendChild(currentPage);
                pages.push(currentPage);
                currentHeight = 0;
                currentPage.appendChild(clone.cloneNode(true));
                currentHeight += elementHeight;
              } else {
                currentHeight += elementHeight;
              }
            }
          });
  
          prevButton.disabled = currentPageIndex === 0;
          nextButton.disabled = currentPageIndex === pages.length - 1;
        }
  
        prevButton.addEventListener('click', () => {
          if (currentPageIndex > 0) {
            pages[currentPageIndex].classList.remove('active');
            currentPageIndex--;
            pages[currentPageIndex].classList.add('active');
            prevButton.disabled = currentPageIndex === 0;
            nextButton.disabled = false;
          }
        });
  
        nextButton.addEventListener('click', () => {
          if (currentPageIndex < pages.length - 1) {
            pages[currentPageIndex].classList.remove('active');
            currentPageIndex++;
            pages[currentPageIndex].classList.add('active');
            nextButton.disabled = currentPageIndex === pages.length - 1;
            prevButton.disabled = false;
          }
        });
  
        updatePreview();
  
        elements.forEach(element => {
          element.addEventListener('click', () => {
            if (element.classList.contains('page-break')) {
              element.classList.remove('page-break');
            } else {
              element.classList.add('page-break');
            }
            pages[currentPageIndex].classList.remove('active');
            currentPageIndex = 0;
            updatePreview();
          });
        });
      });
    </script>
  </body>
  </html>
  `);
  printWindow.document.close(); // Close the document to ensure rendering
}

  tagAppIconTools.querySelector('#idBTNPrintNote').addEventListener('click', _formatPrint);

  

  tagAppIconTools.querySelector('#idBTNFullScreen').addEventListener('click', async () => {
    //event.target.requestFullscreen() ;
    const appContainer = document.body; // Or whatever element you want to make fullscreen
    // Check if the browser supports the Fullscreen API
    if (appContainer.requestFullscreen) {
      appContainer.requestFullscreen();
    } else if (appContainer.webkitRequestFullscreen) { /* Safari */
        appContainer.webkitRequestFullscreen();
    } else if (appContainer.mozRequestFullScreen) { /* Firefox */
        appContainer.mozRequestFullScreen();
    } else if (appContainer.msRequestFullscreen) { /* IE11 */
        appContainer.msRequestFullscreen();
    }
  });
  
} ;



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
  console.log(JSON.stringify(jsonKnowledgeTree,null,3));
  let ktKeys = Object.keys(jsonKnowledgeTree) ;

  for(let i=0;i<ktKeys.length;i++){
    console.log(jsonKnowledgeTree[ktKeys[i]]) ;
    if(typeof jsonKnowledgeTree[ktKeys[i]] == 'object'){
      if(Object.keys(jsonKnowledgeTree).length != 0)renderKTNode(tagContainer.querySelector('.treeContainer'),tagContainer.querySelector('.treeListContainer'),jsonKnowledgeTree[ktKeys[i]]) ;
    }
  }
}

//renderKnowledgeTree(document.querySelector(".appTreeBrowser"),jsonKnowledgeTree);



