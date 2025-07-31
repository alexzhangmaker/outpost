// auth-guard.js
// Assumes 'auth' is available globally from firebase-config.js

auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in. Allow access to this page.
        console.log("User is authenticated on this page:", user.uid);
        // Make the user object globally available for other scripts on this page
        window.currentUser = user;

        // You can add your Realtime Database check for 'allowedUsers' here or in dashboard.js
        // If the allowedUsers rule is true, you could move that logic here for early check
        // Or keep it in dashboard.js if it's specific to that page's content
    } else {
        // User is NOT signed in. Redirect to the login page.
        console.log("User is not authenticated. Redirecting to login page.");
        // Make sure you're not already on the login page to avoid infinite redirects
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// Common sign-out logic for buttons on protected pages
document.addEventListener('DOMContentLoaded', () => {
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            auth.signOut()
                .then(() => {
                    console.log("User signed out.");
                    // Redirect to login page after sign-out
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error signing out:", error);
                    alert("Error signing out: " + error.message);
                });
        });
    }
});