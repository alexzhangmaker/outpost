// login.js
// Assumes 'auth' is available globally from firebase-config.js

const provider = new firebase.auth.GoogleAuthProvider();
const signInBtn = document.getElementById('signInWithGoogleBtn');
const authStatusElement = document.getElementById('authStatus');

signInBtn.addEventListener('click', () => {
    auth.signInWithPopup(provider)
        .then((result) => {
            // User signed in successfully
            console.log('User signed in:', result.user);
            authStatusElement.textContent = `Signed in as: ${result.user.displayName}`;
            // Redirect to the protected dashboard page
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error("Sign-in failed:", error);
            authStatusElement.textContent = `Sign-in failed: ${error.message}`;
        });
});

// This listener handles the case where the user lands on index.html but is already authenticated
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in, redirect them to dashboard immediately
        authStatusElement.textContent = `Already signed in as: ${user.displayName}. Redirecting...`;
        window.location.href = 'dashboard.html';
    } else {
        authStatusElement.textContent = 'Please sign in.';
    }
});