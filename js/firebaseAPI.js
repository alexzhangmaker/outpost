/*
const firebaseConfig = {
    apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",
    authDomain: "outpost-8d74e.firebaseapp.com",
    databaseURL: "https://outpost-8d74e-default-rtdb.firebaseio.com",
    projectId: "outpost-8d74e",
    storageBucket: "outpost-8d74e.firebasestorage.app",
    messagingSenderId: "724993324937",
    appId: "1:724993324937:web:ce6c7e6b06489331c79358",
    measurementId: "G-QPHWRTH6BH"
};

*/

const localForageConfig={
    name: 'signpostPWA',
    storeName: 'outpost',  // required
    driver: localforage.INDEXEDDB
} ;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function _storeWrite(collection,docID,jsonContent){
    db.collection(collection).doc(docID).set(jsonContent).then(() => {
        //loadItems();
        console.log(jsonContent) ;
    }).catch((error) => {
        console.error("Error writing document: ", error);
    });
}


async function _syncFireStore(collection){
    let cloudData = await _dumpFireStore(collection) ;
    console.log(cloudData) ;
    cloudData.forEach(jsonData=>{
        console.log(jsonData) ;
        _writeJSONLocal(jsonData.id,jsonData) ;
    }) ;
}

function _writeJSONLocal(key,jsonContent){
    localforage.config(localForageConfig);
    localforage.setItem(key, JSON.stringify(jsonContent)).then(function(value) {
        console.log(value);
    });    
}

async function removeKeyLocal(key) {
    try {
        localforage.config(localForageConfig);
        await localforage.removeItem(key);
        console.log(`Key "${key}" removed successfully!`);
    } catch (err) {
        console.error('Error removing key:', err);
    }
}

async function _clearStoreLocal(){
    try {
        localforage.config(localForageConfig);
        await localforage.clear();
        console.log('Store cleared successfully!');
    } catch (err) {
        console.error('Error clearing store:', err);
    }
}

async function _dumpFireStore(collection){
    try {
        const querySnapshot = await db.collection(collection).get();
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error("Error getting documents: ", error);
        return null;
    }
}

async function fetchDataFromCollection(collectionName) {
    try {
        const querySnapshot = await db.collection(collectionName).get();
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        return data;
    } catch (error) {
        console.error("Error getting documents: ", error);
        return null; // Or handle the error as needed
    }
}


async function fetchDocument(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document: ", error);
        return null;
    }
}

async function addDataToCollection(collectionName, data) {
    try {
        const docRef = await db.collection(collectionName).add(data);
        console.log("Document written with ID: ", docRef.id);
        return docRef; // You might want to return the new document reference
    } catch (error) {
        console.error("Error adding document: ", error);
        return null;
    }
}

async function updateDocumentData(collectionName, documentId, updatedData) {
    try {
        const docRef = db.collection(collectionName).doc(documentId);
        await docRef.update(updatedData);
        console.log("Document updated successfully!");
        return true;
    } catch (error) {
        console.error("Error updating document: ", error);
        return false;
    }
}

async function deleteDocument(collectionName, documentId) {
    try {
        const docRef = db.collection(collectionName).doc(documentId);
        await docRef.delete();
        console.log("Document deleted successfully!");
        return true;
    } catch (error) {
        console.error("Error deleting document: ", error);
        return false;
    }
}


// Fetch the document and get keys
async function getDocumentKeys(collection) {
    try {
        const docSnap = await db.collection(collection).get();

        const keys = [];
        docSnap.forEach((doc) => {
            keys.push(doc.id);
        });
        return keys ;
    } catch (error) {
        console.error("Error fetching document:", error);
        return [];
    }
}

// Function to fetch keys in batches
async function fetchKeysPaginated(collectionName, pageSize = 100, lastDoc = null) {
    try {
        // Reference to the collection
        let query = db.collection(collectionName)
                        .orderBy(firebase.firestore.FieldPath.documentId()) // Order by document ID
                        .limit(pageSize);

        // If paginating, start after the last document
        if (lastDoc) {
            query = query.startAfter(lastDoc);
        }

        // Fetch documents
        const querySnapshot = await query.get();
        const keys = [];

        // Extract keys from each document
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            keys.push(...Object.keys(data)); // Collect keys from document data
        });

        // Get the last document for the next page
        const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

        return { keys, lastDoc: newLastDoc, hasMore: querySnapshot.size === pageSize };
    } catch (error) {
        console.error("Error fetching keys:", error);
        return { keys: [], lastDoc: null, hasMore: false };
    }
}
