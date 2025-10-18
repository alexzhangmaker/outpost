// Firebase配置（实际使用时替换为你的配置）
// 在实际应用中，您可以使用以下代码从Firebase获取数据
// 模拟Firebase配置 - 在实际应用中替换为您的配置
const firebaseConfig = {
    apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",
    authDomain: "outpost-8d74e.firebaseapp.com",
    databaseURL: "https://outpost-otes-86b07.asia-southeast1.firebasedatabase.app/",
    projectId: "outpost-8d74e",
    storageBucket: "outpost-8d74e.firebasestorage.app",
    messagingSenderId: "724993324937",
    appId: "1:724993324937:web:ce6c7e6b06489331c79358",
    measurementId: "G-QPHWRTH6BH"
};

const path025231="025231" ;
// 初始化Firebase
// Correct v8 code
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Correct: auth() is the function
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

function fetchDataFromFirebase(path) {
    return new Promise((resolve, reject) => {
        const ref = database.ref(path);
        ref.on('value', (snapshot) => {
            const data = snapshot.val();
            //resolve(data ? Object.values(data) : []);
            resolve(data);
        }, (error) => {
            reject(error);
        });
    });
}

// The correct way to call the function in V8
function signInWithGoogle(callAuthed,callFailAuth) {
    auth.signInWithPopup(provider).then((result) => {
        // User signed in successfully.
        const user = result.user;
        console.log("User:", user);
        callAuthed() ;
    }).catch((error) => {
        // Handle Errors here.
        console.error("Sign-in error:", error);
        callFailAuth() ;
    });
}

async function loadAnki(pathAnki){
    let snapshot = await database.ref(pathAnki).once('value');
    let jsonAnkiSets = snapshot.val();
    console.log(jsonAnkiSets) ;

    let keys = Object.keys(jsonAnkiSets) ;
    console.log(keys) ;

    gMemoCards=[] ;
    keys.forEach(key=>{
        gMemoCards.push(jsonAnkiSets[key]) ;
    }) ;
}


async function saveReviewStat(classCode){
    let date = new Date() ;
    let pathLog = `/reviewLog/${classCode}/${date.getTime()}` ;
    await database.ref(pathLog).set(gMemoCards) ;
}