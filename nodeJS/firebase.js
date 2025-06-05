// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('/Users/alexszhanggmail.com/github/GoogleSecrets/outpost-8d74e-firebase-adminsdk-fbsvc-bbe7b7f44b.json'); // update path if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aesop-portfolio.asia-southeast1.firebasedatabase.app/'  // replace with your actual URL
});

const db = admin.database();

module.exports = db;