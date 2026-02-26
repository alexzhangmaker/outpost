export class FirebaseManager {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.authDomain = config.authDomain;
        this.projectId = config.projectId;
        this.databaseURL = config.databaseURL;
        this.idToken = null;
        this.user = null;
    }

    async checkSession() {
        return new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: false }, async (token) => {
                if (chrome.runtime.lastError || !token) {
                    return resolve(null);
                }

                try {
                    // Exchange for Firebase token
                    const user = await this.exchangeToken(token);
                    resolve(user);
                } catch (e) {
                    console.error('Session check failed:', e);
                    resolve(null);
                }
            });
        });
    }

    async exchangeToken(token) {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${this.apiKey}`, {
            method: 'POST',
            body: JSON.stringify({
                postBody: `access_token=${token}&providerId=google.com`,
                requestUri: `http://localhost`,
                returnIdpCredential: true,
                returnSecureToken: true
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        this.idToken = data.idToken;
        this.user = {
            uid: data.localId,
            email: data.email,
            displayName: data.displayName,
            photoUrl: data.profilePicture
        };
        return this.user;
    }

    async signInWithGoogle() {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                try {
                    const user = await this.exchangeToken(token);
                    resolve(user);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    async signOut() {
        this.idToken = null;
        this.user = null;
        return new Promise((resolve) => {
            chrome.identity.clearAllCachedAuthTokens(() => resolve());
        });
    }

    async saveData(path, data) {
        if (!this.idToken) throw new Error('Not authenticated');
        const url = `${this.databaseURL}/${path}.json?auth=${this.idToken}`;
        const response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async getData(path) {
        if (!this.idToken) throw new Error('Not authenticated');
        const url = `${this.databaseURL}/${path}.json?auth=${this.idToken}`;
        const response = await fetch(url);
        return await response.json();
    }
}
