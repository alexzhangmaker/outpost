
function appMeta(){
    return {
        name:'boxAnywhere',
        title:'box.Anywhere',
        appTitle:_appTitle,
        onHome:_funcOnHome,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio,
        injectStyle:_injectStyle_AppBoxAnywhere
    }
}


const _appTitle = ()=>{
    return 'box.Anywhere' ;
} ;

const _funcOnHome=async (event)=>{
    console.log('app OnHome') ;
} ;

const _style_AppBoxAnywhere=`
.BoxPlusFormContainer{
    width:100% ;
    height:100% ;
    /*background-color:#ccc;*/
    padding: 5px;
}

.boxPlusForm {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    flex-wrap:nowrap;
}

.boxMetaGroup{
    display: flex;
    flex-direction: row;
    align-items: center;
    gap:5px;
    width:100% ;
    height:60px;
}

.boxContentEditor{
    flex-grow: 1;
    width:100% ;

}
.input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
label {
    font-size: 14px;
}
input, select, button {
    padding: 8px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
button {
    background-color: #2196F3;
    color: white;
    cursor: pointer;
    border: none;
}
button:hover {
    background-color: #1976D2;
}
.error {
    color: red;
    font-size: 14px;
    margin-top: 10px;
}
.parsed-output, .submit-message {
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background-color: #f9f9f9;
}
.autocomplete-container {
    position: relative;
}
.autocomplete-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 10;
    list-style: none;
    padding: 0;
    margin: 0;
}
.autocomplete-list li {
    padding: 8px;
    cursor: pointer;
}
.autocomplete-list li:hover {
    background-color: #f0f0f0;
}
/* Toggle Switch Styles */
.toggle-switch {
    position: relative;
    width: 100px;
    height: 34px;
}
.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}
.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    font-size: 14px;
    color: white;
}
.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 46px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50px;
}
input:checked + .slider {
    background-color: #2196F3;
}
input:checked + .slider:before {
    transform: translateX(46px);
}
.slider .buy-label {
    margin-left: 10px;
}
.slider .sell-label {
    margin-right: 10px;
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
    styleElement.textContent = _style_AppBoxAnywhere;
    // Append the style to the document head
    document.head.appendChild(styleElement);

};

async function renderBoxV0(tagPanel,jsonBox){

    let password = tagPanel.querySelector('#password').value ;

    let tagContainer = tagPanel.querySelector(".boxContainer");

    const decrypted = await decryptData(jsonBox.boxContent.encrypted, password, 
                            jsonBox.boxContent.salt, 
                            jsonBox.boxContent.iv);
    let tagBox = document.createElement('details') ;
    tagBox.innerHTML=`
        <summary>${jsonBox.title}</summary>
        <div>
            <button id="idBTNDecodeBox">decode</button>
            <button id="idBTNDeleteBox">delete</button>

            <div id="idBoxContent">${decrypted}</div>
        </div>
    ` ;
    tagBox.dataset.boxID = jsonBox.boxID ;

    tagContainer.appendChild(tagBox) ;
    tagBox.querySelector('#idBTNDecodeBox').addEventListener('click',async (event)=>{

    }) ;
    
    tagBox.querySelector('#idBTNDeleteBox').addEventListener('click',async (event)=>{
        let urlBoxNode = `https://outpost-8d74e-458b9.asia-southeast1.firebasedatabase.app/gatekeeper/${tagBox.dataset.boxID}.json` ;
        const response = await fetch(urlBoxNode, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // A successful DELETE request typically returns an empty body or null
            // You can check response.status for 200 (OK) or 204 (No Content)
            console.log(`Node '${tagBox.dataset.boxID}' deleted successfully!`, 'success');
            tagBox.remove() ;
        } else {
            const errorData = await response.json().catch(() => null); // Try to parse JSON error, but don't fail if it's not JSON
            let errorMessage = `Failed to delete node. Status: ${response.status} ${response.statusText}.`;
            if (errorData && errorData.error) {
                errorMessage += ` Error: ${errorData.error}`;
            }
            console.log(errorMessage, 'error');
        }
    }) ;
}


async function renderBox(tagPanel,jsonBox){

    let password = tagPanel.querySelector('#password').value ;

    let tagContainer = tagPanel.querySelector(".boxContainer");

    const decrypted = await decryptData(jsonBox.boxContent.encrypted, password, 
                            jsonBox.boxContent.salt, 
                            jsonBox.boxContent.iv);
    
    /*
    let tagBox = document.createElement('details') ;
    tagBox.innerHTML=`
        <summary>${jsonBox.title}</summary>
        <div>
            <button id="idBTNDecodeBox">decode</button>
            <button id="idBTNDeleteBox">delete</button>

            <div id="idBoxContent">${decrypted}</div>
        </div>
    ` ;
    tagBox.dataset.boxID = jsonBox.boxID ;

    tagContainer.appendChild(tagBox) ;
    tagBox.querySelector('#idBTNDecodeBox').addEventListener('click',async (event)=>{

    }) ;
    
    tagBox.querySelector('#idBTNDeleteBox').addEventListener('click',async (event)=>{
        let urlBoxNode = `https://outpost-8d74e-458b9.asia-southeast1.firebasedatabase.app/gatekeeper/${tagBox.dataset.boxID}.json` ;
        const response = await fetch(urlBoxNode, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // A successful DELETE request typically returns an empty body or null
            // You can check response.status for 200 (OK) or 204 (No Content)
            console.log(`Node '${tagBox.dataset.boxID}' deleted successfully!`, 'success');
            tagBox.remove() ;
        } else {
            const errorData = await response.json().catch(() => null); // Try to parse JSON error, but don't fail if it's not JSON
            let errorMessage = `Failed to delete node. Status: ${response.status} ${response.statusText}.`;
            if (errorData && errorData.error) {
                errorMessage += ` Error: ${errorData.error}`;
            }
            console.log(errorMessage, 'error');
        }
    }) ;
    */
    // 1. 创建元素
    let tagBox = document.createElement('sl-details');

    // 2. 设置属性（可选）
    tagBox.summary = jsonBox.title; // 等效于 summary 属性
    tagBox.open = false; // 默认Close

    // 3. 添加子内容
    const content = document.createElement('div');
    content.innerHTML=`
        <button id="idBTNDecodeBox">decode</button>
        <button id="idBTNDeleteBox">delete</button>

    <div id="idBoxContent">${decrypted}</div>`
    tagBox.appendChild(content);

    // 4. 插入到 DOM
    tagContainer.appendChild(tagBox);
}

const _renderPanel=async (tagPanel)=>{
    console.log('appBox _renderPanel') ;
    //alert('will render panel')

    if(tagPanel.dataset.rendered =='true')return ;

    tagPanel.innerHTML=`
        <style>
            .boxPassKey{
                display:flex;
                flex-direction:row;
                align-items:center ;
                width:100% ;
                justify-content:space-between;
            }
            .boxContainer{
                overflow-y:auto;
                height:85vh;
            }
        </style>
        <label for="password">PassKey to list:</label>
        <div class="boxPassKey">
            <input type="password" id="password" name="password" placeholder="passKey" required>
            <i class="bi-cloud-arrow-down" id="idBTNListBoxes"></i>
        </div>
        <div class="boxContainer"></div>
    ` ;

    tagPanel.querySelector('#idBTNListBoxes').addEventListener('click',async (event)=>{
        let password = tagPanel.querySelector('#password').value ;
        
        if(password==""){
            alert('Please provide passKey to proceeds') ;
            return ;
        }
        
        let urlSafeBox_FB = `https://outpost-8d74e-458b9.asia-southeast1.firebasedatabase.app/gatekeeper.json` ;
        let result = await fetch(urlSafeBox_FB) ;
        let jsonBoxes = await result.json() ;
        console.log(jsonBoxes) ;
        boxKeys = Object.keys(jsonBoxes) ;
        console.log(boxKeys) ;
        tagPanel.querySelector('.boxContainer').innerHTML='' ;
        for(let i=0;i<boxKeys.length;i++){
            await renderBox(tagPanel,jsonBoxes[boxKeys[i]]) ;
        }
    }) ;

    tagPanel.dataset.rendered='true' ;    
} ;

const _renderWorkStudio=async (tagRightPanelMain)=>{
    tagRightPanelMain.innerHTML=`
        <div class="BoxPlusFormContainer">
            <div id="idFormPlusBox" class="boxPlusForm">
                <div class="boxMetaGroup"> 
                    <div class="input-group">
                        <label for="boxID">boxID</label>
                        <input type="text" id="boxID" name="boxID" placeholder="boxID..." disabled>
                    </div>
                    <div class="input-group">
                        <label for="boxTitle">title</label>
                        <input type="text" id="boxTitle" name="boxTitle" placeholder="title...">
                    </div>
                    <div class="input-group autocomplete-container">
                        <label for="boxOwner">owner</label>
                        <select id="boxOwner" name="boxOwner">
                            <option value="alexszhang@gmail.com">alexszhang@gmail.com</option>
                            <option value="alexFamily">alex's Family</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="boxPassKey">passKey:</label>
                        <input type="password" id="boxPassKey" name="boxPassKey" placeholder="passkey...">
                    </div>

                    <div class="input-group">
                        <label for="boxTimeStamp">timeStamp</label>
                        <input type="text" id="boxTimeStamp" name="boxTimeStamp" placeholder="20250806" disabled>
                    </div>
                    
                    <div class="input-group">
                        <label for="boxPlusSubmit">submit</label>
                        <button type="submit" id="boxPlusSubmit">
                            <i class="bi bi-unlock-fill"></i>
                        </button>
                    </div>
                </div>
                <div class="boxContentEditor">
                    <div class="input-group">
                        <label for="boxContent">box Content:</label>
                        <textarea type="text" id="boxContent" name="memo" placeholder="what's in the box?"></textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
    let tagBoxID = tagRightPanelMain.querySelector('#boxID') ;
    tagBoxID.value = genBoxID() ;
    let now = dayjs();
    tagRightPanelMain.querySelector('#boxTimeStamp').value = now.format('YYYY-MM-DD') ;
    //

    tagRightPanelMain.querySelector('#boxPlusSubmit').addEventListener('click',async(event)=>{
        await _onPlusBoxSubmit(event) ;
    }) ;
} ;


function genBoxID(){
    let now = dayjs() ;
    let cDate = now.format("YYYYMMDD") ;

    const array = new Uint16Array(1);
    window.crypto.getRandomValues(array);

    // To get a number between 1000 and 9999 (inclusive)
    const random4Digit = 1000 + (array[0] % 9000);
    console.log(random4Digit);

    return `${cDate}${random4Digit}` ;
}


async function _onPlusBoxSubmit(event) {
    const boxID = document.getElementById("boxID").value;
    const boxTitle = document.getElementById("boxTitle").value;
    const boxOwner = document.getElementById("boxOwner").value;
    const boxPassKey = document.getElementById("boxPassKey").value;
    const boxTimeStamp = document.getElementById("boxTimeStamp").value;
    const boxContent = document.getElementById("boxContent").value;
    
    if (!boxPassKey) {
      alert("Please enter a password");
      return;
    }
    if(boxTitle == '')boxTitle='title not provided';
    if(!boxContent){
        alert("Please enter content");
      return;
    }
    
    console.log(boxPassKey) ;

    let jsonEncrypted = await encryptData(boxContent,boxPassKey) ;
    console.log(jsonEncrypted) ;
    let jsonBox = {
        "boxID": boxID,
        "title": boxTitle,
        "owner": boxOwner,
        "timeStamp": boxTimeStamp,
        "memo": "memo",
        "boxContent": jsonEncrypted,
    } ;

    //https://outpost-8d74e-458b9.asia-southeast1.firebasedatabase.app/gatekeeper
    const urlDict = `https://outpost-8d74e-458b9.asia-southeast1.firebasedatabase.app/gatekeeper/${jsonBox.boxID}.json`;
    let putResponse = await fetch(urlDict, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonBox)
    });
    if (!putResponse.ok) {
        console.log(`Failed to logDeal : ${putResponse.statusText}`);
    }
    console.log("logDeal successfully!");

    document.getElementById("boxID").value = genBoxID() ;
    document.getElementById("boxTitle").value = "new box" ;
    document.getElementById("boxPassKey").value="";
    document.getElementById("boxContent").value = 'todo' ;
};

async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000, // Higher iterations increase security (adjust based on performance)
            hash: "SHA-256"
        },
        passwordKey,
        { name: "AES-GCM", length: 256 }, // 256-bit key for AES-GCM
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(plainText, password) {
    const enc = new TextEncoder();
    const encoded = enc.encode(plainText);
    const salt = crypto.getRandomValues(new Uint8Array(16)); // Random salt
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Random IV for AES-GCM
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    return {
        iv: Array.from(iv),
        salt: Array.from(salt),
        encrypted: Array.from(new Uint8Array(encrypted))
    };
}

async function decryptData(encryptedData, password, salt, iv) {
    // Convert plain arrays back to Uint8Array
    console.log(salt) ;
    console.log(iv) ;
    const saltArray = new Uint8Array(salt);
    console.log(saltArray) ;
    const ivArray = new Uint8Array(iv);
    const encryptedArray = new Uint8Array(encryptedData);
    
    const key = await deriveKey(password, saltArray);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivArray },
      key,
      encryptedArray
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}

