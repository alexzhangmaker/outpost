// First, include Firebase SDK in your HTML file before this script
/*
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-database.js"></script>
*/

// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Get a reference to the database
const database = firebase.database();

// Function to fetch JSON data from Firebase
async function getFirebaseData(path = '/') {
    try {
        // Create a reference to the specified path in the database
        const dataRef = database.ref(path);
        
        // Get the data once
        const snapshot = await dataRef.once('value');
        
        // Check if data exists
        if (snapshot.exists()) {
            const data = snapshot.val();
            return data; // Returns the JSON data
        } else {
            console.log('No data available at this path');
            return null;
        }
    } catch (error) {
        console.error('Error fetching Firebase data:', error);
        throw error; // Throw error to be handled by the caller
    }
}

// Example usage:
/*
async function example() {
    try {
        // Fetch data from root
        const rootData = await getFirebaseData();
        console.log('Root data:', rootData);

        // Fetch data from specific path
        const specificData = await getFirebaseData('users/user1');
        console.log('Specific data:', specificData);
    } catch (error) {
        console.error('Failed to get data:', error);
    }
}

// Call the example function
example();
*/