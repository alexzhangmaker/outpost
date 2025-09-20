
// Supabase configuration
const USER_ID_SupabaseAPI = 'alexszhang@gmail.com'; //`4ebe5f02-8473-4051-8ed9-9bdd9ec8dbb8`;//'alexszhang@gmail.com'; // Hardcoded for testing
//const SUPABASE_URL = 'https://yfftwweuxxkrzlvqilvc.supabase.co';
//const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZnR3d2V1eHhrcnpsdnFpbHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjYxMTEsImV4cCI6MjA2NzkwMjExMX0.7rcV3RBrH5kY3KLqD-NHLMhMyc62wIxxYG9VfW-i1tk';
//const SUPABASE_TABLE = 'documents';

async function API_PlusMDMemo_Supabase(title, content) {
    console.log('Saving document:', { title, content, user_id: USER_ID_SupabaseAPI });
    let jsonMemo = {
        title: title,
        content: content,
        user_id: USER_ID_SupabaseAPI
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
  let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&user_id=eq.${USER_ID_SupabaseAPI}`;
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
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=id,title,content&user_id=eq.${USER_ID_SupabaseAPI}&order=created_at.desc&limit=10`,
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
  let cURL = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&user_id=eq.${USER_ID_SupabaseAPI}&select=title,content`;
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
  console.log('Updating document:', { id, title, content, user_id: USER_ID_SupabaseAPI });
  let jsonMemo = {
    title: title,
    content: content,
    user_id: USER_ID_SupabaseAPI,
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
