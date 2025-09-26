// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",
  authDomain: "outpost-8d74e.firebaseapp.com",
  databaseURL: "https://outpost-medium-20250810.asia-southeast1.firebasedatabase.app/",
  projectId: "outpost-8d74e",
  storageBucket: "outpost-8d74e.firebasestorage.app",
  messagingSenderId: "724993324937",
  appId: "1:724993324937:web:ce6c7e6b06489331c79358",
  measurementId: "G-QPHWRTH6BH"
};

// 初始化Firebase v8 code
const globalApp = firebase.initializeApp(firebaseConfig);
const globalAuth = firebase.auth(); // Correct: auth() is the function
const globalDatabase = firebase.database();
const globalAuthProvider = new firebase.auth.GoogleAuthProvider();

let globalFolders=[] ;
let globalNotes=[] ;
let globalTagClouds=[] ;

async function loadFolders(){
    try {
        const snapshot = await globalDatabase.ref('noteFolders').once('value');
        let jsonFolders = snapshot.val();
        console.log('loadFolders data:', jsonFolders);

        
        let keys = Object.keys(jsonFolders) ;
        for(let i=0;i<keys.length;i++){
            let jsonFolder = jsonFolders[keys[i]] ;
            jsonFolder.id = keys[i] ;
            //delete jsonFolder.notes ;
            jsonFolder.notesV2 = [] ;
            let noteKeys = Object.keys(jsonFolder.notes) ;
            for(let j=0;j<noteKeys.length;j++){
                let jsonNote = jsonFolder.notes[noteKeys[j]] ;
                jsonNote.id = noteKeys[j] ;
                jsonFolder.notesV2.push(jsonNote) ;
            }
            console.log(jsonFolder) ;
            delete jsonFolder.notes ;
            jsonFolder.notes = jsonFolder.notesV2 ;
            delete jsonFolder.notesV2 ;
            console.log(jsonFolder) ;
            globalFolders.push(jsonFolder) ;
        }
        
        //globalFolders = jsonFolders ;
        return globalFolders ;
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}

async function loadTagClouds(){
    try {
        const snapshot = await globalDatabase.ref('tagClouds').once('value');
        globalTagClouds = snapshot.val();
        console.log('loadTagClouds data:', globalTagClouds);
        return globalTagClouds ;
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}

async function loadNotes(){
    try {
        const snapshot = await globalDatabase.ref('notesTbl').once('value');
        globalNotes = snapshot.val();
        console.log('loadNotes data:', globalNotes);
        return globalNotes ;
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}



async function plusNote(jsonNote,noteContent,folderID){
    for(let i=0;i<globalFolders.length;i++){
        if(globalFolders[i].id == folderID){
            globalFolders[i].notes.push(jsonNote) ;
            let note={
                id:jsonNote.id,
                title:jsonNote.title,
                date:jsonNote.date,
                lastSaved:jsonNote.lastSaved,
                tags:jsonNote.tags,
                content:noteContent
            }
            globalNotes.push(note) ;
        }
    }
}

async function plusNotesInCloud(jsonNote,noteContent,folderID){
    try {
        for(let i=0;i<globalFolders.length;i++){
            if(globalFolders[i].id == folderID){
                //add to local cache
                globalFolders[i].notes.push(jsonNote) ;

                //add to Cloud database
                //const folderRef = globalDatabase.ref(`noteFolders/${globalFolders[i].id}`);
                const folderNoteRef = globalDatabase.ref(`noteFolders/${globalFolders[i].id}/notes/${jsonNote.id}`);
                await folderNoteRef.set(jsonNote) ;

                //const noteRef = await folderNotesRef.push(jsonNote) ;
                //console.log("noteRef Unique Key (Push ID):", noteRef.key);

                let note={
                    id:jsonNote.id,
                    title:jsonNote.title,
                    date:jsonNote.date,
                    lastSaved:jsonNote.lastSaved,
                    tags:jsonNote.tags,
                    content:noteContent
                } ;

                //add to local cache
                //globalNotes.push(note) ;

                //add to Cloud database
                const noteInTblRef = globalDatabase.ref(`notesTbl/${jsonNote.id}`);
                //const noteinTblRef = await notesTblRef.push(note) ;
                //console.log("noteinTblRef Unique Key (Push ID):", noteinTblRef.key);
                await noteInTblRef.set(note) ;

            }
        }
        
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}



async function fetchNoteUsingID(noteID){
    try {
        //add to Cloud database
        const noteInTblRef = globalDatabase.ref(`notesTbl/${noteID}`);
        const snapshot = await noteInTblRef.once('value');
        let jsonNote = snapshot.val();
        console.log('fetchNoteUsingID data:', jsonNote);
        return jsonNote ;
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}


async function saveNoteContent2Cloud(noteID,content){
    try {
        const noteInTblRef = globalDatabase.ref(`notesTbl/${noteID}/content`);
        const snapshot = await noteInTblRef.set(content);
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}

async function updateNoteTitleInCloud(noteID,folderID,title){
    try {
        const noteInTblRef = globalDatabase.ref(`notesTbl/${noteID}/title`);
        const snapshot = await noteInTblRef.set(title);

        const folderNoteRef = globalDatabase.ref(`noteFolders/${folderID}/notes/${noteID}/title`);
        await folderNoteRef.set(title) ;

    } catch (error) {
        console.error('Failed to read data:', error);
    }
}

async function saveNote2Cloud(jsonNote){
    console.log(jsonNote) ;
    try {
        const noteInTblRef = globalDatabase.ref(`notesTbl/${jsonNote.id}`);
        const snapshot = await noteInTblRef.set(jsonNote);
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}


async function removeNoteInCloud(noteID,folderID){
    console.log(noteID) ;
    try {
        const folderNoteRef = globalDatabase.ref(`noteFolders/${folderID}/notes/${noteID}`);
        await folderNoteRef.set(null) ;

        const noteInTblRef = globalDatabase.ref(`notesTbl/${noteID}`);
        const snapshot = await noteInTblRef.set(null);
    } catch (error) {
        console.error('Failed to read data:', error);
    }
}

async function _loadEveryNotes(){
    await loadFolders() ;
    await loadTagClouds() ;
    //await loadNotes() ;
}


//_toolSmith() ;


const mockData_folders=[
    {
        id: 1,
        name: "机器学习",
        notes: [
            {
                id: 1,
                title: "机器学习基础概念",
                content: "# 机器学习基础概念\n\n## 什么是机器学习\n\n机器学习是人工智能的一个分支，它使计算机能够在没有明确编程的情况下学习。\n\n### 主要类型\n\n- **监督学习**：使用标记数据训练模型\n- **无监督学习**：发现数据中的模式\n- **强化学习**：通过试错学习最佳策略\n\n## 关键算法\n\n### 线性回归\n\n线性回归是一种用于预测连续值的监督学习算法。\n\n```python\nimport numpy as np\nfrom sklearn.linear_model import LinearRegression\n\n# 示例代码\nX = np.array([[1], [2], [3]])\ny = np.array([2, 4, 6])\n\nmodel = LinearRegression()\nmodel.fit(X, y)\n```\n\n> 注意：线性回归假设变量之间存在线性关系。\n\n## 应用领域\n\n机器学习在各个领域都有广泛应用。",
                date: "2023-10-15",
                lastSaved: Date.now()
            }
        ]
    },
    {
        id: 2,
        name: "自然语言处理",
        notes: [
            {
                id: 2,
                title: "自然语言处理入门",
                content: "# 自然语言处理入门\n\n## 文本预处理技术\n\n### 分词\n\n将文本分割成有意义的单元。\n\n### 词干提取\n\n将词语还原为其基本形式。\n\n## 关键技术\n\n### 词嵌入\n\n将词语映射到向量空间。\n\n### 注意力机制\n\n让模型关注输入的重要部分。",
                date: "2023-10-05",
                lastSaved: Date.now()
            }
        ]
    }
];