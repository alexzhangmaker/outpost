// dashboard.js
// Assumes 'auth' and 'database' are available globally from firebase-config.js
// Assumes 'window.currentUser' is set by auth-guard.js if authenticated

document.addEventListener('DOMContentLoaded', () => {
    const userInfoElement = document.getElementById('currentUserInfo');
    const messageInput = document.getElementById('messageInput');
    const addMessageBtn = document.getElementById('addMessageBtn');
    const messagesList = document.getElementById('messagesList');
    const accessDeniedSection = document.getElementById('accessDeniedSection');

    // Reference to your secret messages in the Realtime Database
    const messagesRef = database.ref('secretMessages');

    // Function to listen for messages (from your previous code)
    const listenForMessages = () => {
        messagesRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            const messageElement = document.createElement('div');
            messageElement.textContent = `${message.ownerUid}: ${message.text}`; // Display UID for now
            messagesList.appendChild(messageElement);
        });
    };

    // Logic after auth-guard.js has checked the user
    if (window.currentUser) {
        userInfoElement.textContent = `Logged in as: ${window.currentUser.displayName} (${window.currentUser.email})`;

        // Check if the current user is in the 'allowedUsers' list
        // This is the same logic you had before
        database.ref('allowedUsers/' + window.currentUser.uid).once('value')
            .then(snapshot => {
                if (snapshot.val() === true) {
                    // User is allowed
                    accessDeniedSection.style.display = 'none'; // Hide access denied message
                    messageInput.style.display = 'inline-block';
                    addMessageBtn.style.display = 'inline-block';
                    listenForMessages(); // Start listening for messages
                } else {
                    // User is authenticated but not specifically allowed
                    accessDeniedSection.textContent = 'Access to secret messages denied. You are signed in but not authorized for this content.';
                    accessDeniedSection.style.display = 'block';
                    messageInput.style.display = 'none';
                    addMessageBtn.style.display = 'none';
                    messagesList.innerHTML = ''; // Clear any messages
                    console.warn("User is authenticated but not in the allowedUsers list.");
                }
            })
            .catch(error => {
                console.error("Error checking allowed user status:", error);
                accessDeniedSection.textContent = 'Error checking user authorization: ' + error.message;
                accessDeniedSection.style.display = 'block';
                messageInput.style.display = 'none';
                addMessageBtn.style.display = 'none';
            });

        // Add message button handler
        addMessageBtn.addEventListener('click', () => {
            const messageText = messageInput.value.trim();
            if (messageText && window.currentUser) {
                const newMessageRef = messagesRef.push();
                newMessageRef.set({
                    text: messageText,
                    ownerUid: window.currentUser.uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                })
                .then(() => {
                    messageInput.value = '';
                    console.log("Message added successfully!");
                })
                .catch((error) => {
                    console.error("Error adding message:", error);
                    alert("Failed to add message. Check your rules and user permissions.");
                });
            } else if (!window.currentUser) {
                alert("Please sign in to add a message."); // Should be caught by auth-guard, but good fallback
            }
        });

    } else {
        // This block should ideally not be reached if auth-guard.js is correctly redirecting
        // if user is not authenticated.
        userInfoElement.textContent = "Loading...";
    }
});