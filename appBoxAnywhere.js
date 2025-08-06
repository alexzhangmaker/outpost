function appTitle(){
    return 'box.Anywhere' ;
}


const _funcOnHome=async (event)=>{
    console.log('app OnHome') ;
} ;


async function renderBox(tagPanel,jsonBox){

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

function appMeta(){
    return {
        name:'boxAnywhere',
        title:'box.Anywhere',
        onHome:_funcOnHome,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio
    }
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

