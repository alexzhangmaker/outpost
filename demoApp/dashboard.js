// dashboard.js
// Assumes 'auth' and 'database' are available globally from firebase-config.js

// DOM elements
const userInfoElement = document.getElementById('currentUserInfo');
const messageInput = document.getElementById('messageInput');
const addMessageBtn = document.getElementById('addMessageBtn');
const messagesList = document.getElementById('messagesList');
const accessDeniedSection = document.getElementById('accessDeniedSection');

// Reference to your secret messages in the Realtime Database
const messagesRef = database.ref('secretMessages');

let currentAuthenticatedUser = null; // Local variable to hold the authenticated user

// Function to display messages (from your previous code)
const displayMessage = (id, text, ownerUid) => {
    const listItem = document.createElement('li');
    listItem.id = `msg-${id}`;
    const messageSpan = document.createElement('span');
    messageSpan.textContent = text;
    listItem.appendChild(messageSpan);

    if (currentAuthenticatedUser && currentAuthenticatedUser.uid === ownerUid) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.onclick = () => {
            messagesRef.child(id).remove()
                .then(() => console.log("Message deleted!"))
                .catch(error => console.error("Error deleting message:", error));
        };
        listItem.appendChild(deleteBtn);
    }
    messagesList.appendChild(listItem);
};

// Function to listen for messages (from your previous code)
const listenForMessages = () => {
    // Clear previous listeners to avoid duplicates if re-authenticating
    messagesRef.off();
    messagesList.innerHTML = ''; // Clear list before re-populating

    // Listen for new messages added
    messagesRef.on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        displayMessage(messageId, message.text, message.ownerUid);
    });

    // Listen for messages removed
    messagesRef.on('child_removed', (snapshot) => {
        const messageId = snapshot.key;
        const listItem = document.getElementById(`msg-${messageId}`);
        if (listItem) {
            listItem.remove();
        }
    });

    // Listen for messages changed (e.g., text updated)
    messagesRef.on('child_changed', (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        const listItem = document.getElementById(`msg-${messageId}`);
        if (listItem) {
            listItem.querySelector('span').textContent = message.text;
        }
    });
};

// --- IMPORTANT CHANGE: Use onAuthStateChanged directly in dashboard.js ---
auth.onAuthStateChanged((user) => {
    currentAuthenticatedUser = user; // Update the local user variable

    if (user) {
        // User is signed in. Update UI with user info.
        userInfoElement.textContent = `Logged in as: ${user.displayName} (${user.email})`;

        // Get a fresh ID token and then check allowed status
        // This ensures the database read has the latest authentication context
        user.getIdToken(true)
            .then(idToken => {
                console.log("Dashboard: User ID Token obtained successfully.");
                // Now, proceed with the database read to check 'allowedUsers' status
                return database.ref('allowedUsers/' + user.uid).once('value');
            })
            .then(snapshot => {
                if (snapshot.val() === true) {
                    // User is allowed to access secret messages
                    accessDeniedSection.style.display = 'none';
                    messageInput.style.display = 'inline-block';
                    addMessageBtn.style.display = 'inline-block';
                    listenForMessages(); // Start listening for messages
                } else {
                    // User is authenticated but not specifically allowed for secret messages
                    accessDeniedSection.textContent = 'Access to secret messages denied. You are signed in but not authorized for this content.';
                    accessDeniedSection.style.display = 'block';
                    messageInput.style.display = 'none';
                    addMessageBtn.style.display = 'none';
                    messagesList.innerHTML = ''; // Clear any messages
                    console.warn("Dashboard: User is authenticated but not in the allowedUsers list (value is not true).");
                }
            })
            .catch(error => {
                // Handle any errors during token acquisition or allowed user check
                console.error("Dashboard: Error checking allowed user status:", error);
                accessDeniedSection.textContent = 'Error checking user authorization: ' + error.message;
                accessDeniedSection.style.display = 'block';
                messageInput.style.display = 'none';
                addMessageBtn.style.display = 'none';
            });

    } else {
        // User is NOT signed in.
        // The auth-guard.js should handle redirection, but this ensures dashboard.js
        // also reacts correctly if somehow the user lands here unauthenticated.
        userInfoElement.textContent = "Not signed in. Redirecting...";
        // If auth-guard.js didn't redirect, this will.
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
            window.location.href = 'index.html';
        }
    }
});

// Add message button handler (moved outside onAuthStateChanged for clarity, but uses currentAuthenticatedUser)
addMessageBtn.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
    if (messageText && currentAuthenticatedUser) { // Use the local variable
        const newMessageRef = messagesRef.push();
        newMessageRef.set({
            text: messageText,
            ownerUid: currentAuthenticatedUser.uid,
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
    } else if (!currentAuthenticatedUser) {
        alert("Please sign in to add a message."); // Should be caught by auth-guard, but good fallback
    }
});