
function appMeta(){
    return {
        name:'memoAnywhere',
        title:'memo.Anywhere',
        appTitle:_appTitle/*,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio,
        injectStyle:_injectStyle_AppBoxAnywhere
        */
    }
}


const _appTitle = ()=>{
    document.title = 'memo.Anywhere' ;
} ;

const _style_AppMemoAnywhere=`
@import url('https://fonts.googleapis.com/css2?family=Mulish:ital,wght@0,200..1000;1,200..1000&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
.roboto-memoAnywhere {
    font-family: "Roboto", sans-serif;
    font-optical-sizing: auto;
    font-weight: 400;
    font-style: normal;
    font-variation-settings:"wdth" 100;
}

.mulish-memoAnywhere {
    font-family: "Mulish", sans-serif;
    font-optical-sizing: auto;
    font-weight: 400;
    font-style: normal;
}

.memoAnywhereHeader{
    height:10vh;
    font-size: 24px;
}

.memoAnywhereEditor{
    height:50vh;
    min-height: 400px;
}


input[type="text"] { 
    width: 100%; 
    padding: 0.5em; 
    font-size: 1em; 
    margin-bottom: 1em; 
}
button{ 
    margin: 0.5em 0.5em 1em 0; 
}

#notesList ul { 
    padding-left: 1em; 
}
#notesList li { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
}
.note-title { 
    cursor: pointer; 
    color: blue; 
}
.note-title:hover { 
    text-decoration: underline; 
}
.delete-btn { 
    color: red; 
    cursor: pointer; 
    font-size: 14px; 
    padding-left: 0.5em; 
}
.delete-btn:hover { 
    text-decoration: underline; 
}

button{
    font-family: "Mulish", sans-serif;

}

.memoAnywhereList{
    flex-grow: 1;
    flex-shrink: 1;
}

/* Style the trix-editor element */
trix-editor {
    max-height: 25vh; /* Set maximum height */
    overflow-y: auto; /* Enable vertical scrollbar when content exceeds max-height */
    border: 1px solid #ccc; /* Optional: Add a border for visibility */
    padding: 10px; /* Optional: Add padding for better appearance */
    box-sizing: border-box; /* Ensure padding doesn't affect max-height */
}

trix-editor { 
    min-height: 200px; 
    margin-bottom: 1em; 
}

/* Optional: Ensure the toolbar doesn't interfere with the layout */
trix-toolbar {
    margin-bottom: 10px;
}

/* Optional: Style the container for better control */
.trix-container {
    width: 100%;
    max-width: 600px; /* Adjust as needed */
    margin: 20px auto;
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
    */

    const styleElement = document.createElement('style');
    styleElement.textContent = _style_AppMemoAnywhere;
    // Append the style to the document head
    document.head.appendChild(styleElement);

};


const SUPABASE_URL = 'https://yfftwweuxxkrzlvqilvc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZnR3d2V1eHhrcnpsdnFpbHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMjYxMTEsImV4cCI6MjA2NzkwMjExMX0.7rcV3RBrH5kY3KLqD-NHLMhMyc62wIxxYG9VfW-i1tk';
const SUPABASE_TABLE = 'notes';

let currentNoteId = null;
let hasUnsavedChanges = false;
let allNotes = [];

function generateNoteId() {
    const now = new Date();
    const mmddyyyy = String(now.getMonth()+1).padStart(2, '0') +
                    String(now.getDate()).padStart(2, '0') +
                    now.getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return mmddyyyy + rand;
}

function htmlToJson(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const blocks = [];
    doc.body.childNodes.forEach(node => {
        if (node.nodeType === 1) {
            const block = { type: node.tagName.toLowerCase(), content: [] };
            node.childNodes.forEach(child => {
                if (child.nodeType === 3) {
                    block.content.push({ text: child.textContent });
                }else if(child.nodeType === 1) {
                    const format = child.tagName.toLowerCase();
                    const item = { text: child.textContent, type: format };
                    if (format === 'a') item.href = child.getAttribute('href');
                    block.content.push(item);
                }
            });
            blocks.push(block);
        }
    });
    return blocks;
}

function jsonToHtml(blocks) {
    return blocks.map(block => {
        const inner = block.content.map(item => {
            if (item.type === "strong") return `<strong>${item.text}</strong>`;
            if (item.type === "em") return `<em>${item.text}</em>`;
            if (item.type === "a") return `<a href="${item.href}">${item.text}</a>`;
            return item.text;
        }).join('');
        return `<${block.type}>${inner}</${block.type}>`;
    }).join('');
}

async function saveNote() {
    const html = document.querySelector("#editorInput").value;
    const json = htmlToJson(html);
    const title = document.getElementById("noteTitle").value.trim();
    if (!title) return alert("⚠️ Please enter a title.");
    //const id = currentNoteId || generateNoteId();
    if (currentNoteId) {
        // update existing note
        updateNote(currentNoteId, title, json);
    } else {
        // insert new note
        insertNewNote(generateNoteId(), title, json);
    }
}

async function insertNewNote(noteID,title, jsonContent){
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({ /*id,*/ title, content: jsonContent })
    });

    const result = await response.json();
    if (response.ok) {
        currentNoteId = result.id;
        hasUnsavedChanges = false;
        listNotes();
    }else{
        alert("❌ Save failed.");
        console.error(result);
    }
}

async function updateNote(noteId, newTitle, newContentJson) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/notes?id=eq.${noteId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            title: newTitle,
            content: newContentJson
        })
    });

    let result;
    try {
        const text = await response.text(); // always safe
        result = text ? JSON.parse(text) : null;
    } catch (err) {
        console.error("❌ Failed to parse JSON:", err);
        result = null;
    }

    if (response.ok) {
        console.log("✅ Note updated:", result);
        alert("✅ Note updated!");
    } else {
        console.error("❌ Update failed:", result);
        alert("❌ Update failed.");
    }
}

async function listNotes() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?select=id,title`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
        }
    });

    allNotes = await response.json();
    renderNoteList(allNotes);
}

function renderNoteList(notes) {
    const list = document.getElementById("noteItems");
    list.innerHTML = '';
    notes.forEach(note => {
        const li = document.createElement('li');
        li.dataset.noteID = note.id ;
        const span = document.createElement('span');
        span.textContent = `${note.title}`;
        span.className = "note-title";
        span.onclick = () => tryLoadNote(note.id);

        const del = document.createElement('span');
        del.textContent = "🗑️";
        del.className = "delete-btn";
        del.onclick = (e) => {
            e.stopPropagation();
            deleteNote(note.id);
        };

        li.appendChild(span);
        li.appendChild(del);
        list.appendChild(li);
    });
}

function filterNotes() {
    const keyword = document.getElementById("searchBox").value.trim().toLowerCase();
    const filtered = allNotes.filter(note =>{
            note.title.toLowerCase().includes(keyword) ||
            note.id.toLowerCase().includes(keyword)
    });
    renderNoteList(filtered);
}

async function deleteNote(noteId) {

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${noteId}`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (response.ok){

        if (noteId === currentNoteId) resetEditor();
        listNotes();
    }else {
        alert("❌ Delete failed.");
        console.error(await response.text());
    }
}

async function tryLoadNote(noteId) {
    if (hasUnsavedChanges) {
        const proceed = confirm("⚠️ You have unsaved changes. Continue and discard them?");
        if (!proceed) return;
    }
    loadNote(noteId);
}

async function loadNote(noteId) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${noteId}`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
        }
    });

    const result = await response.json();
    if (response.ok && result[0]){
        const { title, content } = result[0];

        const html = jsonToHtml(JSON.parse(content));
        document.getElementById("noteTitle").value = title;
        document.getElementById("editorInput").value = html;
        document.querySelector("trix-editor").editor.loadHTML(html);
        currentNoteId = noteId;
        hasUnsavedChanges = false;
    }else{
        alert("❌ Load failed.");
        console.error(result);
    }
}



function resetEditor() {
    currentNoteId = null;
    hasUnsavedChanges = false;
    document.getElementById("noteTitle").value = '';
    document.getElementById("editorInput").value = '';
    document.querySelector("trix-editor").editor.loadHTML('');
}

window.addEventListener("beforeunload", e => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
    }
});

document.querySelector("trix-editor").addEventListener("trix-change", () => {
    hasUnsavedChanges = true;
});

document.getElementById("noteTitle").addEventListener("input", () => {
    hasUnsavedChanges = true;
});


document.querySelector("#idBTNSaveMemo").addEventListener("click", async (event) => {
    await saveNote() ;
});

document.querySelector("#idBTNListMemo").addEventListener("click", async (event) => {
    await listNotes();
});
document.querySelector("#idBTNPlusMemo").addEventListener("click", async (event) => {
    resetEditor() ;
});


listNotes();