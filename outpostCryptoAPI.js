async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000, // Higher iterations increase security (adjust based on performance)
            hash: "SHA-256"
        },
        passwordKey,
        { name: "AES-GCM", length: 256 }, // 256-bit key for AES-GCM
        true,
        ["encrypt", "decrypt"]
    );
}

async function encryptData(plainText, password) {
    const enc = new TextEncoder();
    const encoded = enc.encode(plainText);
    const salt = crypto.getRandomValues(new Uint8Array(16)); // Random salt
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Random IV for AES-GCM
    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    return {
        iv: Array.from(iv),
        salt: Array.from(salt),
        encrypted: Array.from(new Uint8Array(encrypted))
    };
}

async function decryptData(encryptedData, password, salt, iv) {
    // Convert plain arrays back to Uint8Array
    console.log(salt) ;
    console.log(iv) ;
    const saltArray = new Uint8Array(salt);
    console.log(saltArray) ;
    const ivArray = new Uint8Array(iv);
    const encryptedArray = new Uint8Array(encryptedData);
    
    const key = await deriveKey(password, saltArray);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivArray },
      key,
      encryptedArray
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
}


/*
// Usage example
(async () => {
const password = "MySecretPassword123"; // Easy-to-remember password
const message = "Sensitive data";

// Encrypt
const { iv, salt, encrypted } = await encryptData(message, password);
console.log("Encrypted:", encrypted, "IV:", iv, "Salt:", salt);

// Decrypt
const decrypted = await decryptData(encrypted, password, salt, iv);
console.log("Decrypted:", decrypted); // Outputs: Sensitive data
})();
*/