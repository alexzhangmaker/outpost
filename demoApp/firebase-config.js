// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",//AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs
    authDomain: "outpost-8d74e.firebaseapp.com",
    databaseURL: "https://outpost-8d74e-d45f1.asia-southeast1.firebasedatabase.app/",
    projectId: "outpost-8d74e",
    storageBucket: "outpost-8d74e.firebasestorage.app",
    messagingSenderId: "724993324937",
    appId: "1:724993324937:web:ce6c7e6b06489331c79358",
    measurementId: "G-QPHWRTH6BH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make auth and database instances globally available for simplicity in multi-page setup
const auth = firebase.auth();
const database = firebase.database(); // Only include if you use Realtime Database