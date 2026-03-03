importScripts('db.js');

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_TRANSLATION') {
        findExisting(message.entry)
            .then(existing => {
                if (existing) {
                    sendResponse({ success: true, id: existing.id, duplicate: true });
                    return;
                }

                const timestamp = Date.now();
                const entryWithTime = { ...message.entry, timestamp };

                addTranslation(entryWithTime)
                    .then(id => {
                        const fullEntry = { ...entryWithTime, id };
                        sendResponse({ success: true, id });
                        // Notify other parts of the extension (like sidepanel) with the FULL entry including timestamp
                        chrome.runtime.sendMessage({ type: 'TRANSLATION_ADDED', entry: fullEntry });
                    })
                    .catch(error => sendResponse({ success: false, error: error.message }));
            })
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
