const jsonTask={
    about:'something',
    date:{
        day:8,
        month:7,
        year:2025
    },
    key:0,
    memo:"something to do",
    ttm:"1749488400000"
};


let jsonOutpostTasks = [];

/*
{
    "about": "all",
    "date": "2025/7/8 00:00:00",
    "memo": "重写anki的导航部分，按照course catalog整理",
    "ttm": 1751985812568
  }
{
    "assignee": "alexszhang@gmail.com",
    "completed": false,
    "createdAt": "2025-10-06T12:51:47.747Z",
    "endDate": "2025-10-06",
    "id": "20251006-5baa-e47f-4505-8b7a-6de0",
    "priority": "high",
    "startDate": "2025-10-06",
    "status": "archived",
    "tags": [
        "supabase",
        "application",
        "java script"
    ],
    "title": "处理supoabase数据库连接问题",
    "updatedAt": "2025-10-09T22:44:37.827Z"
}
*/
async function renderTasksV0(tagWndContent){

    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/outpostTASK.json";
    const res = await fetch(firebaseUrl);
    jsonOutpostTasks = await res.json();
    console.log(jsonOutpostTasks) ;
    
    for(let i=0;i<jsonOutpostTasks.length;i++){
        renderMemoV2(tagWndContent,jsonOutpostTasks[i]) ;
    }
}


async function renderTasks(tagWndContent){
    function sortByCreatedAt(arr) {
        return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }


    let todosFirebase = null ;
    todosFirebase = await FirebaseService.getTodos() ;
    console.log(todosFirebase) ;
    let keys = Object.keys(todosFirebase) ;
    let todoArr = [] ;
    keys.forEach(key=>{
        let todo = todosFirebase[key] ;
       
        todoArr.push(todo) ;
    })

    let orderTodos = sortByCreatedAt(todoArr) ;
    orderTodos.forEach(todo=>{ renderMemoV2(tagWndContent,todo) ;}) ;
}

/*
{
    "assignee": "alexszhang@gmail.com",
    "completed": false,
    "createdAt": "2025-10-06T12:51:47.747Z",
    "endDate": "2025-10-06",
    "id": "20251006-5baa-e47f-4505-8b7a-6de0",
    "priority": "high",
    "startDate": "2025-10-06",
    "status": "archived",
    "tags": [
        "supabase",
        "application",
        "java script"
    ],
    "title": "处理supoabase数据库连接问题",
    "updatedAt": "2025-10-09T22:44:37.827Z"
}
*/
function renderMemoV2(tagContainer,jsonMemo){
    let tagMemo = document.createElement('li') ;
    tagMemo.classList.add('liMemo') ;

    let cDate = new Date(jsonMemo.endDate);//new Date(jsonMemo.date.year, jsonMemo.date.month-1, jsonMemo.date.day)
    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedDate = formatter.format(cDate);
    console.log(formattedDate);

    tagMemo.innerHTML=`
        <div class="todoItem">
            <div class="todoCheck">
                <div class="noShow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#000000" d="m10.6 16.2l7.05-7.05l-1.4-1.4l-5.65 5.65l-2.85-2.85l-1.4 1.4l4.25 4.25ZM5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5Zm0-2h14V5H5v14ZM5 5v14V5Z"/></svg></div>
                <div class="outpostBTN"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#000000" d="M5 21q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.588 1.413T19 21H5Zm0-2h14V5H5v14Z"/></svg></div>
            </div>
            <div class="todoContents">
                <div class="todoContent">${jsonMemo.title}</div>
                <div class="todoMetaParts">
                    <div class="todoDueDate">Due:$${formattedDate}</div>
                    <div class="todoTags">
                        <span class="todoTag">demo</span>
                        <span class="todoTag">AI Tech</span>
                    </div>
                </div>
                <div class="todoMetaParts">
                    <div class="todoAssignee">${jsonMemo.assignee}</div>
                    <div class="todoPriority">
                        <div class="outpostBTN"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20"><path fill="#000000" d="M10 3a2 2 0 0 0-2 2c0 2.065.746 4.915 1.184 6.403a.842.842 0 0 0 .817.597a.84.84 0 0 0 .816-.595C11.255 9.925 12 7.09 12 5a2 2 0 0 0-2-2ZM7 5a3 3 0 0 1 6 0c0 2.25-.788 5.214-1.224 6.69A1.84 1.84 0 0 1 10 13c-.811 0-1.542-.52-1.776-1.315C7.789 10.204 7 7.227 7 5Zm3 10a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm-2 1a2 2 0 1 1 4 0a2 2 0 0 1-4 0Z"/></svg></div>
                    </div>
                </div>
                
            </div>
            <div class="todoTools">
                <div class="outpostBTN noShow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="#000000" d="M5.615 21q-.69 0-1.152-.462Q4 20.075 4 19.385V6.615q0-.69.463-1.152Q4.925 5 5.615 5h1.77V3.308q0-.233.153-.386q.152-.153.385-.153t.386.153q.153.153.153.386V5h7.153V3.27q0-.214.144-.357t.356-.144q.214 0 .357.143t.143.357V5h1.77q.69 0 1.152.463q.463.462.463 1.152v4.602q0 .214-.143.357q-.144.143-.357.143t-.357-.143Q19 11.431 19 11.217v-.602H5v8.77q0 .23.192.423q.193.192.423.192h5.731q.214 0 .357.143q.143.144.143.357t-.143.357q-.143.143-.357.143h-5.73ZM5 9.615h14v-3q0-.23-.192-.423Q18.615 6 18.385 6H5.615q-.23 0-.423.192Q5 6.385 5 6.615v3Zm0 0V6v3.615Zm9.23 10.577V19.12q0-.161.057-.3q.055-.14.186-.27l5.09-5.066q.149-.148.308-.2q.16-.052.32-.052q.165 0 .334.064t.298.193l.925.945q.123.148.188.307q.064.16.064.32t-.062.322q-.061.162-.19.31l-5.065 5.066q-.131.13-.27.186q-.14.056-.301.056h-1.074q-.348 0-.577-.23q-.23-.23-.23-.578Zm6.885-5.132l-.925-.945l.925.945Zm-6 5.055h.95l3.468-3.473l-.47-.475l-.455-.488l-3.493 3.486v.95Zm3.948-3.948l-.455-.488l.925.963l-.47-.475Z"/></svg></div>
                <div class="outpostBTN btnDeleteTodo"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 15 15"><path fill="#000000" fill-rule="evenodd" d="M5.5 1a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4ZM3 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1H11v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4h-.5a.5.5 0 0 1-.5-.5ZM5 4h5v8H5V4Z" clip-rule="evenodd"/></svg></div>
            </div>
        </div>
    ` ;

    tagContainer.prepend(tagMemo) ;
    
    tagMemo.dataset.memoID = jsonMemo.id ;
    tagMemo.querySelector('.btnDeleteTodo').addEventListener('click',async (event)=>{
        for(let i=0;i<jsonOutpostTasks.length;i++){
            if(jsonOutpostTasks[i].ttm == parseInt(tagMemo.dataset.memoID)){
                jsonOutpostTasks.splice(i,1) ;
                break ;
            }
        }
        tagMemo.remove() ;
        await FirebaseService.deleteTodo(tagMemo.dataset.memoID) ;
    }) ;
}
function renderMemoV2Pre(tagContainer,jsonMemo){
    let tagMemo = document.createElement('li') ;
    tagMemo.classList.add('liMemo') ;

    let cDate = new Date(jsonMemo.endDate);//new Date(jsonMemo.date.year, jsonMemo.date.month-1, jsonMemo.date.day)
    const formatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedDate = formatter.format(cDate);
    console.log(formattedDate);
    tagMemo.innerHTML=`       
        <div class="DIVMemo">
            <div class="memoHeader">
                <span>
                    <span class="memoTTM">${formattedDate}</span>
                    <span class="memoAbout">${jsonMemo.assignee}</span>
                </span>
                <i class="bi-check2-circle outpostBTN"></i>
            </div>
            <div class="memoBody">
                <span class="memoContent">${jsonMemo.title}</span>
                <br>
            </div>
        </div>

    ` ;
    tagContainer.prepend(tagMemo) ;
    
    tagMemo.dataset.memoID = jsonMemo.id ;
    tagMemo.querySelector('.bi-check2-circle').addEventListener('click',async (event)=>{
        //tagMemo.classList.toggle('memoCheck') ;
        for(let i=0;i<jsonOutpostTasks.length;i++){
            if(jsonOutpostTasks[i].ttm == parseInt(tagMemo.dataset.memoID)){
                jsonOutpostTasks.splice(i,1) ;
                break ;
            }
        }
        tagMemo.remove() ;
        await FirebaseService.deleteTodo(tagMemo.dataset.memoID) ;
    }) ;
    
}


function onClickSubmitMemo(event){
    let tagMemoInput = document.querySelector('#idInputMemo');
    let jsonMemo=_parseTodoString(tagMemoInput.value) ;
    if(jsonMemo==null)return ;
    console.log(jsonMemo) ;

    let jsonTask = {
        "assignee": "alexszhang@gmail.com",
        "completed": false,
        "createdAt": jsonMemo.date,//"2025-10-06T12:51:47.747Z",
        "endDate": jsonMemo.date,//"2025-10-06",
        "id": generateTodoId(),//"20251006-5baa-e47f-4505-8b7a-6de0",
        "priority": "high",
        "startDate": jsonMemo.date,//"2025-10-06",
        "status": "active",
        "tags": [jsonMemo.about],
        "title": jsonMemo.memo,
        "updatedAt": jsonMemo.date//"2025-10-09T22:44:37.827Z"
    } ;

    let tagContainer = event.target.closest('#idWndContent').querySelector('.memoContainer');
    renderMemoV2(tagContainer,jsonTask) ;
    FirebaseService.saveTodo(jsonTask.id, jsonTask) ;
}

function _onKeyInputEnter(event){
    if (event.key === 'Enter') {
        let inputField = event.target ;
        event.preventDefault(); // Prevents form submission if inside a form
        onClickSubmitMemo(event) ;
    }
}

Mousetrap.bind('@', (event)=>{
    //alert('this is Mousetrap for /') ;
    let tagMemoInput = document.querySelector('#idInputMemo');
    tagMemoInput.focus();
});


function _parseTodoString(input) {
    // Regex: @ for date (mmddyyyy), + for topic (single word), followed by details
    const regex = /^(?:@(\d{2})(\d{2})(\d{4})\s+)?(?:\+(\w+)\s+)?(.+)$/;
    
    const match = input.match(regex);
    if (!match) {return null; }
    // Return null if the string doesn't match the expected format
    
    let today = new Date() ;
    let [, month, day, year, topic, details] = match;
    month = month ? parseInt(month, 10) : today.getMonth() + 1 ;
    day = day ? parseInt(day, 10) : today.getDate() ;
    year = year ? parseInt(year, 10) : today.getFullYear() ;

    let cDate = new Date(year,month-1,day,0, 0, 0, 0) ;//year, month, day, hours, minutes, seconds, milliseconds
    return {
        date: cDate.toLocaleString(),
        about: topic || "随手记",
        memo: details.trim() ,
        ttm:today.getTime()
    };
}

// 生成唯一ID (YYYYMMDD-UUID格式)
function generateTodoId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10).replace(/-/g, '');
    const uuid = 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    return `${dateStr}-${uuid}`;
}


// Firebase配置 - 请替换为你的实际配置
const firebaseConfig = {
    apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",
    authDomain: "outpost-8d74e.firebaseapp.com",
    databaseURL: "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/",
    projectId: "outpost-8d74e",
    storageBucket: "outpost-8d74e.firebasestorage.app",
    messagingSenderId: "724993324937",
    appId: "1:724993324937:web:ce6c7e6b06489331c79358",
    measurementId: "G-QPHWRTH6BH"
};

// 初始化Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase初始化成功');
} catch (error) {
    console.error('Firebase初始化失败:', error);
}

const database = firebase.database();

// Firebase工具函数
const FirebaseService = {
    // 获取指定路径的todos
    async getTodos(path = '/todos') {
        try {
            const snapshot = await database.ref(path).once('value');
            const data = snapshot.val() || {};
            console.log(`从路径 ${path} 获取到 ${Object.keys(data).length} 个todos`);
            console.log(data) ;
            return data;
        } catch (error) {
            console.error(`获取todos失败 (路径: ${path}):`, error);
            return {};
        }
    },

    // 添加或更新todo
    async saveTodo(todoId, todoData, path = '/todos') {
        try {
            await database.ref(`${path}/${todoId}`).set(todoData);
            console.log(`Todo保存成功: ${todoId} (路径: ${path})`);
            return true;
        } catch (error) {
            console.error(`保存todo失败 (路径: ${path}):`, error);
            return false;
        }
    },

    // 删除todo
    async deleteTodo(todoId, path = '/todos') {
        try {
            await database.ref(`${path}/${todoId}`).remove();
            console.log(`Todo删除成功: ${todoId} (路径: ${path})`);
            return true;
        } catch (error) {
            console.error(`删除todo失败 (路径: ${path}):`, error);
            return false;
        }
    },

    // 监听todos变化
    onTodosChange(callback, path = '/todos') {
        database.ref(path).on('value', (snapshot) => {
            const data = snapshot.val() || {};
            callback(data);
        });
        console.log(`开始监听todos变化 (路径: ${path})`);
    },

    // 停止监听todos变化
    offTodosChange(path = '/todos') {
        database.ref(path).off('value');
        console.log(`停止监听todos变化 (路径: ${path})`);
    },

    // 获取应用配置数据
    async getAppSettings(path = '/appSetting/todoSetting') {
        try {
            const snapshot = await database.ref(path).once('value');
            const settings = snapshot.val();
            
            if (!settings) {
                console.warn('未找到应用配置，使用默认配置');
                return this.getDefaultSettings();
            }
            
            console.log('成功获取应用配置:', settings);
            return settings;
        } catch (error) {
            console.error('获取应用配置失败:', error);
            console.warn('使用默认配置继续运行');
            return this.getDefaultSettings();
        }
    },

    // 监听应用配置变化
    onAppSettingsChange(callback, path = '/appSetting/todoSetting') {
        database.ref(path).on('value', (snapshot) => {
            const settings = snapshot.val();
            const finalSettings = settings || this.getDefaultSettings();
            callback(finalSettings);
        });
        console.log(`开始监听应用配置变化 (路径: ${path})`);
    },

    // 停止监听应用配置变化
    offAppSettingsChange(path = '/appSetting/todoSetting') {
        database.ref(path).off('value');
        console.log(`停止监听应用配置变化 (路径: ${path})`);
    },

    // 保存应用配置
    async saveAppSettings(settings, path = '/appSetting/todoSetting') {
        try {
            await database.ref(path).set(settings);
            console.log('应用配置保存成功:', settings);
            return true;
        } catch (error) {
            console.error('保存应用配置失败:', error);
            return false;
        }
    },

    // 默认配置
    getDefaultSettings() {
        return {
            appRootPath: '/todos',
            features: {
                search: true,
                filtering: true,
                archiving: true,
                dueDateWarning: true
            },
            ui: {
                theme: 'light',
                cardsPerRow: 3,
                showAssignee: true,
                showTags: true
            },
            notifications: {
                enabled: true,
                remindBeforeDays: 1
            }
        };
    },

    // 测试数据库连接
    async testConnection() {
        try {
            await database.ref('.info/connected').once('value');
            console.log('Firebase数据库连接正常');
            return true;
        } catch (error) {
            console.error('Firebase数据库连接失败:', error);
            return false;
        }
    }
};


//FirebaseService.getTodos() ;