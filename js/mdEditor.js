
function _injectMDEditorCSS(){

}

function injectMDEditor(tagMDEditorContainer){

}

// Supabase configuration
const USER_ID = 'alexszhang@gmail.com'; //`4ebe5f02-8473-4051-8ed9-9bdd9ec8dbb8`;//'alexszhang@gmail.com'; // Hardcoded for testing
const SUPABASE_URL = 'https://yfftwweuxxkrzlvqilvc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZnR3d2V1eHhrcnpsdnFpbHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjYxMTEsImV4cCI6MjA2NzkwMjExMX0.7rcV3RBrH5kY3KLqD-NHLMhMyc62wIxxYG9VfW-i1tk';
const SUPABASE_TABLE = 'documents';
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
  memoArray.forEach(jsonMemo=>{
    let tagMemoItem = document.createElement('div') ;
    tagMemoItem.classList.add('memoListItem') ;
    tagMemoList.appendChild(tagMemoItem) ;
    tagMemoItem.innerHTML=`
      <div>
        <span>${jsonMemo.title}</span>
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

async function API_PlusMDMemo_Supabase(title, content) {
    console.log('Saving document:', { title, content, user_id: USER_ID });
    let jsonMemo = {
        title: title,
        content: content,
        user_id: USER_ID
    };
    let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;
    try {
        const response = await fetch(cURL, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify([jsonMemo])
        });
        const result = await response.json();
        if (response.ok) {
            console.log('Document saved successfully!');
        } else {
            console.error('Error saving document:', result);
            console.log('Error saving document: ' + (result.message || result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network error:', error);
        console.log('Network error: ' + error.message);
    }
}

// Delete document by ID from Supabase
async function API_DeleteMDMemo(id) {
  if (!id) {
    alert('Please enter a valid Document ID to delete.');
    return;
  }
  console.log('Deleting document with ID:', id);
  let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&user_id=eq.${USER_ID}`;
  try {
    const response = await fetch(cURL, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      }
    });
    const result = await response.json();
    console.log('Delete response:', response.status, result);
    if (response.ok) {
      alert('Document deleted successfully!');
      // Clear the editor and title input
      document.getElementById('docTitle').value = '';
      editor.setMarkdown('');
    } else {
      console.error('Error deleting document:', result);
      alert('Error deleting document: ' + (result.message || result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error: ' + error.message);
  }
}

// Load latest document from Supabase
async function API_LoadLatestMemo_Supabase() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=id,title,content&user_id=eq.${USER_ID}&order=created_at.desc&limit=10`,
      {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const data = await response.json();
    console.log(data) ;

    if (response.ok && data.length) {
      document.getElementById('docTitle').value = data[0].title;
      editor.setMarkdown(data[0].content);

      let tagEditor = document.querySelector('#editor') ;
      tagEditor.dataset.ActiveMemoID = data[0].id ;

      renderMemoList(data) ;
      console.log('Document loaded successfully!');
    } else if (response.ok) {
      console.log('No documents found.');
    } else {
      console.error('Error loading document:', data);
      console.log('Error loading document: ' + (data.message || data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Network error:', error);
    console.log('Network error: ' + error.message);
  }
}

// Fetch document by ID from Supabase
async function API_FetchMDMemo(id) {
  if (!id) {
    console.log('Please enter a valid Document ID to fetch.');
    return;
  }
  console.log('Fetching document with ID:', id);
  let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&user_id=eq.${USER_ID}&select=title,content`;
  try {
    const response = await fetch(cURL, {
      method: 'GET',
      headers:{
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });
    const data = await response.json();
    console.log('Fetch response:', response.status, data);
    
    if (response.ok && data.length) {
      return data[0] ;
      /*
      document.getElementById('docTitle').value = data[0].title;
      editor.setMarkdown(data[0].content);
      console.log('Document fetched successfully!');
      */
    } else if (response.ok) {
      console.log('No document found with the specified ID.');
      return null ;
    } else {
      console.error('Error fetching document:', data);
      console.log('Error fetching document: ' + (data.message || data.error || 'Unknown error'));
      return null ;
    }
  } catch (error) {
    console.error('Network error:', error);
    console.log('Network error: ' + error.message);
    return null ;
  }
}

// Update document in Supabase
async function API_UpdateMDMemo(id, title, content) {
  if (!id) {
    console.log('Please enter a valid Document ID to update.');
    return;
  }
  console.log('Updating document:', { id, title, content, user_id: USER_ID });
  let jsonMemo = {
    title: title,
    content: content,
    user_id: USER_ID,
    updated_at: new Date().toISOString() // Update timestamp
  };
  let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}`;
  try {
    const response = await fetch(cURL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(jsonMemo)
    });
    const result = await response.json();
    console.log('Update response:', response.status, result);
    if (response.ok) {
      console.log('Document updated successfully!');
    } else {
      console.error('Error updating document:', result);
      console.log('Error updating document: ' + (result.message || result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Network error:', error);
    console.log('Network error: ' + error.message);
  }
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

changeHTMLTitle('new outpost') ;
