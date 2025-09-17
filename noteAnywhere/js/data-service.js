// js/data-service.js

const DataService = {
    // 1. 从Firebase读取文档清单
    fetchDocumentList: async () => {
        try {
            const snapshot = await db.ref('documents').get();
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("No data available in 'documents' path.");
                return null;
            }
        } catch (error) {
            console.error("Error fetching document list:", error);
            return null;
        }
    },

    // 从Firebase加载特定文档内容
    loadDocumentContent: async (category, docId) => {
        try {
            const path = `documents/${category}/${docId}`;
            const snapshot = await db.ref(path).get();
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error(`Error loading document ${docId}:`, error);
            return null;
        }
    },

    // 3.5. 保存文档到Firebase
    saveDocument: async (category, docId, title, content) => {
        try {
            const path = `documents/${category}/${docId}`;
            await db.ref(path).set({
                title: title,
                content: content,
                lastModified: firebase.database.ServerValue.TIMESTAMP
            });
            console.log(`Document ${docId} saved successfully.`);
            return true;
        } catch (error) {
            console.error(`Error saving document ${docId}:`, error);
            return false;
        }
    }
};