function appTitle(){
    return 'box.Anywhere' ;
}


const _funcOnHome=async (event)=>{
    console.log('app OnHome') ;
} ;

/*
{
  "boxContent": {
    "encrypted": [120, 185, 144, 105, 181, 110, 221, 1, 170, 17, 25, 158, 160, 5, 185, 60, 70, 49, 37, 72, 141],
    "iv": [42, 67, 138, 209, 25, 4, 197, 152, 188, 163, 58, 70],
    "salt": [230, 38, 242, 127, 235, 158, 0, 54, 32, 66, 220, 16, 188, 210, 129, 152]
  },
  "boxID": "202508058443",
  "memo": "memo",
  "owner": "alexszhang@gmail.com",
  "timeStamp": "2025-08-05",
  "title": "demo"
}
*/
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
            <div id="idBoxContent">${decrypted}</div>
        </div>
    ` ;

    tagContainer.appendChild(tagBox) ;
    tagBox.querySelector('#idBTNDecodeBox').addEventListener('click',async (event)=>{
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

