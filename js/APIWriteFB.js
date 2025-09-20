
// Supabase configuration
const USER_ID = 'alexszhang@gmail.com'; //`4ebe5f02-8473-4051-8ed9-9bdd9ec8dbb8`;//'alexszhang@gmail.com'; // Hardcoded for testing
const SUPABASE_URL = 'https://yfftwweuxxkrzlvqilvc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZnR3d2V1eHhrcnpsdnFpbHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjYxMTEsImV4cCI6MjA2NzkwMjExMX0.7rcV3RBrH5kY3KLqD-NHLMhMyc62wIxxYG9VfW-i1tk';
const SUPABASE_TABLE = 'documents';

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
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=id,title,content&user_id=eq.${USER_ID}&order=created_at.desc&limit=100`,
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

      return data ;
      /*
      renderMemoList(data) ;
      */
      console.log('Document loaded successfully!');
    } else if (response.ok) {
      console.log('No documents found.');
      return [] ;
    } else {
      console.error('Error loading document:', data);
      console.log('Error loading document: ' + (data.message || data.error || 'Unknown error'));
      return [] ;
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


let supabase = null;

function _InitSupabase(){
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}


// Login function
async function _LoginSupabase() {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }
  const email = 'alexszhang@gmail.com';//document.getElementById('email').value;
  const password = 'ChinaNO001.';//document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.log('Login failed: ' + error.message);
  } else {
    console.log('Login successful! User: ' + data.user.email);
  }
}

// Logout function
async function _LogoutSupabase() {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log('Logout failed: ' + error.message);
  } else {
    console.log('Logged out successfully');
  }
}

// Fetch documents from the document table
async function _FetchDocumentsSupabase() {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }

  const { data, error } = await supabase.from('documents').select('id,title').order('updated_at', { ascending: false });

  if (error) {
    console.log('Error fetching documents: ' + error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
    return data ;
  }
}
/*
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .order('updated_at', { ascending: false }); // Newest first
*/
async function _FetchDocumentSupabase(uuid) {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }

  const { data, error } = await supabase.from('documents').select('*').eq('id', uuid);

  if (error) {
    console.log('Error fetching documents: ' + error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
    return data[0] ;
  }
}


// Insert document
async function _InsertDocumentSupabase(title, content) {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No active session. Please log in.');
    return;
  }

  const { data, error } = await supabase
    .from('documents')
    .insert([{ title:title, content: content }])
    .select();

  if (error) {
    console.log('Error inserting document: ' + error.message);
    return '' ;
  } else {
    console.log('Document inserted successfully');
    console.log(data) ;
    return data[0].id ;
  }
}

// Update document
async function _UpdateDocumentSupabase(id, title, content) {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No active session. Please log in.');
    return;
  }

  const { data, error } = await supabase
    .from('documents')
    .update({ title,title,content: content })
    .eq('id', id)
    .select();

  if (error) {
    console.log('Error updating document: ' + error.message);
  } else if (data.length === 0) {
    console.log('No document found with ID ' + id);
  } else {
    console.log('Document updated successfully');
  }
}

// Delete document
async function _DeleteDocumentSupabase(uuid) {
  if (!supabase) {
    console.log('Supabase client not initialized');
    return;
  }


  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No active session. Please log in.');
    return;
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', uuid);

  if (error) {
    console.log('Error deleting document: ' + error.message);
  } else {
    console.log('Document deleted successfully');
  }
}


/*
const supabaseUrl = "https://yfftwweuxxkrzlvqilvc.supabase.co" ;
//using service_role secret key
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZnR3d2V1eHhrcnpsdnFpbHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjYxMTEsImV4cCI6MjA2NzkwMjExMX0.7rcV3RBrH5kY3KLqD-NHLMhMyc62wIxxYG9VfW-i1tk";


const supabaseSDK = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase Instance: ', supabaseSDK) ;
*/

const noteFoldersTbl = 'noteFoldersTbl' ;

let globalNoteFolderTree={} ;
async function fetchNoteFolderTree(email){
    try {
        let { data: noteFolderTreeTbl, error } = await supabase.from('noteFolderTreeTbl').select("*")
            .eq('user_email', email) ;
        if (error) {
            throw new Error(`Failed to fetchNoteFolderTree: ${error.message} (code: ${error.code})`);
        }
        return noteFolderTreeTbl;
    } catch (error) {
        throw new Error(`fetchNoteFolderTree error: ${error.message}`);
    }
}

async function notesInFolder(folderID){
    let { data, error } = await supabase.from('document_FolderTbl').select("documentID").eq('folderID', folderID) ;
    if(error) {
        throw new Error(`Failed to fetchNoteFolderTree: ${error.message} (code: ${error.code})`);
        return { error };
    }
    return data;
}


async function notesInWhichFolder(noteID){
  let { data, error } = await supabase.from('document_FolderTbl').select("folderID").eq('documentID', noteID) ;
  if(error) {
      throw new Error(`Failed to fetchNoteFolderTree: ${error.message} (code: ${error.code})`);
      return [];
  }
  console.log(data) ;
  if(data.length>0)return data[0].folderID ;
  return '';
}

async function addNote2Folder(documentID, folderID) {
    // Ensure UUIDs are valid
    if (!documentID || !folderID || documentID ==undefined) {
      console.error('documentID and folderID are required');
      return { error: 'Missing required fields' };
    }
  
    const { data, error } = await supabaseSDK
      .from('document_FolderTbl')
      .upsert(
        [
          {
            documentID: documentID, // UUID for the document
            folderID: folderID, // UUID for the folder
          },
        ],
        {
          onConflict: 'documentID', // Specify the column to check for conflicts (primary key)
        }
      )
      .select(); // Return the inserted/updated row
  
    if (error) {
      console.error('Error during upsert:', error);
      return { error };
    }
  
    console.log('Upsert successful:', data);
    return { data };
}

async function removeNoteFromFolder(documentID){
  if (!documentID || documentID ==undefined) {
      console.error('documentID are required');
      return { error: 'Missing required fields' };
    }
  const { error } = await supabase.from('document_FolderTbl')
    .delete().eq('documentID',documentID) ;

  if (error) {
    console.error('Error during upsert:', error);
    return { error };
  }
   
  console.log('removeNoteFromFolder successful:');
}

async function fetchNoteMeta(documentID){
  if (!documentID || documentID ==undefined) {
    console.error('documentID are required');
    return { error: 'Missing required fields' };
  }

  //let titles = API_FetchMDMemoMeta(documentID) ;
  
  let { data: titles, error } = await supabase.from('documents')
    .select("title").eq('id', documentID) ;
  if (error) {
    console.error('Error during upsert:', error);
    return { error };
  }
  

  if(titles.length==0)return "" ;

  return titles[0].title ;
}


// Fetch document by ID from Supabase
async function API_FetchMDMemoMeta(id) {
  if (!id) {
    console.log('Please enter a valid Document ID to fetch.');
    return;
  }
  console.log('Fetching document with ID:', id);
  let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&user_id=eq.${USER_ID_SupabaseAPI}&select=title`;
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
