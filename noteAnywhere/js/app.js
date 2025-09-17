// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 初始化编辑器
    UIManager.init(); // <-- Add this line
    EditorManager.init();
    
    // 加载文档列表
    async function loadAndRenderList() {
        const docList = await DataService.fetchDocumentList();
        if (docList) {
            UIManager.renderDocList(docList);
        }
    }
    loadAndRenderList();

    // 事件监听
    
    // 2.2 点击文档清单条目后在内容区显示文档内容
    UIManager.docListContainer.addEventListener('click', async (e) => {
        if (e.target.tagName === 'LI') {
            const { category, docId } = e.target.dataset;
            if (category && docId) {
                const docData = await DataService.loadDocumentContent(category, docId);
                if (docData) {
                    EditorManager.setContent(docData, category, docId);
                    UIManager.setActiveItem(category, docId);
                }
            }
        }
    });
    
    // 3.5 保存按钮
    document.getElementById('save-btn').addEventListener('click', async () => {
        const { category, id, title } = EditorManager.currentDocInfo;
        if (!id) {
            alert("请先选择一篇文档，或者实现新建文档功能！");
            return;
        }
        const content = EditorManager.getContent();
        const success = await DataService.saveDocument(category, id, title, content);
        if (success) {
            alert("保存成功！");
            EditorManager.isDirty = false;
            localStorage.removeItem('unsaved_content');
        } else {
            alert("保存失败，请查看控制台信息。");
        }
    });
    
    // 3.6 打印按钮
    document.getElementById('print-btn').addEventListener('click', () => {
        EditorManager.printContent();
    });

    // 3.4 退出时提醒有未保存数据
    window.addEventListener('beforeunload', (event) => {
        if (EditorManager.isDirty) {
            event.preventDefault();
            // 大多数现代浏览器会显示一个标准化的提示，而不是自定义消息
            event.returnValue = '您有未保存的更改，确定要离开吗？';
        }
    });

});