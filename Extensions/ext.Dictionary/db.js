// db.js
const DB_NAME = 'ThaiDictDB';
const DB_VERSION = 5; // Incremented for audit store
const STORE_NAME = 'settings';
const HISTORY_STORE = 'history';
const DICT_STORE = 'thaiDictionary';
const AUDIT_STORE = 'audit';

let dbInstance = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, { autoIncrement: true });
        historyStore.createIndex('original', 'original', { unique: false });
      } else {
        const transaction = event.currentTarget.transaction;
        const historyStore = transaction.objectStore(HISTORY_STORE);
        if (!historyStore.indexNames.contains('original')) {
          historyStore.createIndex('original', 'original', { unique: false });
        }
      }
      if (!db.objectStoreNames.contains(DICT_STORE)) {
        db.createObjectStore(DICT_STORE);
      }
      if (!db.objectStoreNames.contains(AUDIT_STORE)) {
        db.createObjectStore(AUDIT_STORE);
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;

      // Handle version changes from other tabs/scripts
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
        console.log('Database connection closed due to version change.');
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject('IndexedDB error: ' + event.target.errorCode);
    };

    request.onblocked = () => {
      console.warn('Database upgrade blocked. Please close other tabs.');
    };
  });
};

export const saveSetting = async (key, value) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getSetting = async (key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getHistoryByOriginal = async (original) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const index = store.index('original');
    const request = index.get(original);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveHistory = async (original, translated) => {
  const db = await initDB();
  const existing = await getHistoryByOriginal(original);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readwrite');
    const store = transaction.objectStore(HISTORY_STORE);

    if (existing) {
      // Update timestamp and maybe the translation if it improved
      const updatedData = { ...existing, translated, timestamp: new Date().getTime() };
      const index = store.index('original');
      const cursorRequest = index.openCursor(IDBKeyRange.only(original));
      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.update(updatedData);
          resolve();
        } else {
          resolve();
        }
      };
    } else {
      const request = store.add({
        original,
        translated,
        timestamp: new Date().getTime()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    }
  });
};

export const getAllHistory = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([HISTORY_STORE], 'readonly');
    const store = transaction.objectStore(HISTORY_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllSettings = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    const keysRequest = store.getAllKeys();

    request.onsuccess = () => {
      const results = {};
      const values = request.result;
      keysRequest.onsuccess = () => {
        const keys = keysRequest.result;
        keys.forEach((key, index) => {
          results[key] = values[index];
        });
        resolve(results);
      };
    };
    request.onerror = () => reject(request.error);
  });
};
export const batchSaveSettings = async (settings) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const [key, value] of Object.entries(settings)) {
      store.put(value, key);
    }
  });
};

export const clearAllSettings = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};


// Dictionary Cache Functions
export const saveDictEntry = async (word, definition) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.put(definition, word);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const batchSaveDictEntries = async (entries) => {
  if (!entries || typeof entries !== 'object') {
    console.warn('batchSaveDictEntries: Invalid entries provided', entries);
    return;
  }
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const [word, definition] of Object.entries(entries)) {
      store.put(definition, word);
    }
  });
};

export const getDictEntry = async (word) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readonly');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.get(word);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const searchDict = async (query) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readonly');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.openCursor();
    const results = [];

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.key.includes(query)) {
          results.push({ word: cursor.key, ...cursor.value });
        }
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const getDictStats = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readonly');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.count();

    request.onsuccess = () => resolve({ count: request.result });
    request.onerror = () => reject(request.error);
  });
};

export const clearDict = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DICT_STORE], 'readwrite');
    const store = transaction.objectStore(DICT_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
// Audit Queue Functions
export const saveAuditEntry = async (word, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIT_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIT_STORE);
    const request = store.put(data, word);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllAuditEntries = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIT_STORE], 'readonly');
    const store = transaction.objectStore(AUDIT_STORE);
    const request = store.getAll();
    const keysRequest = store.getAllKeys();

    request.onsuccess = () => {
      const results = [];
      const values = request.result;
      keysRequest.onsuccess = () => {
        const keys = keysRequest.result;
        keys.forEach((key, index) => {
          results.push({ word: key, ...values[index] });
        });
        resolve(results);
      };
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteAuditEntry = async (word) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([AUDIT_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIT_STORE);
    const request = store.delete(word);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Lifecycle Logging
export const logLifecycleEvent = async (event) => {
  try {
    const data = await chrome.storage.local.get('lifecycleLogs');
    const logs = data.lifecycleLogs || [];
    const newLog = {
      timestamp: new Date().toISOString(),
      event: event
    };
    logs.unshift(newLog);
    // Keep only last 100 logs
    if (logs.length > 100) logs.pop();
    await chrome.storage.local.set({ lifecycleLogs: logs });
  } catch (e) {
    console.error('Failed to log lifecycle event:', e);
  }
};

export const getLifecycleLogs = async () => {
  try {
    const data = await chrome.storage.local.get('lifecycleLogs');
    return data.lifecycleLogs || [];
  } catch (e) {
    return [{ timestamp: new Date().toISOString(), event: 'Error retrieving logs: ' + e.message }];
  }
};

export const clearLifecycleLogs = async () => {
  await chrome.storage.local.remove('lifecycleLogs');
};
