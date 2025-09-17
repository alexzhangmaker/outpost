// js/editor.js

const EditorManager = {
    editorInstance: null,
    isDirty: false, // 标记是否有未保存的修改
    currentDocInfo: { category: null, id: null, title: null },

    // 3.3. 自定义JSON转表格插件
    createJsonToTablePlugin: () => {
        return (context, options) => {
            const { eventEmitter, i18n, toastMark } = context;
            
            const command = {
                name: 'jsonToTable',
                exec: (payload, state, dispatch) => {
                    const url = prompt("请输入要获取的JSON数据的URL：");
                    if (!url) return false;

                    fetch(url)
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.json();
                        })
                        .then(data => {
                            // 假设SCHEMA是: { headers: ['h1', 'h2'], rows: [['r1c1', 'r1c2'], ['r2c1', 'r2c2']] }
                            if (!data.headers || !data.rows) {
                                alert("JSON格式不正确，需要包含 'headers' 和 'rows' 数组。");
                                return;
                            }
                            
                            let table = `| ${data.headers.join(' | ')} |\n`;
                            table += `| ${data.headers.map(() => '---').join(' | ')} |\n`;
                            data.rows.forEach(row => {
                                table += `| ${row.join(' | ')} |\n`;
                            });
                            
                            this.editorInstance.insertText(table);

                        })
                        .catch(error => {
                            console.error('Fetching JSON failed:', error);
                            alert('获取或解析JSON失败: ' + error.message);
                        });
                    return true;
                }
            };
            
            eventEmitter.listen('command', (type, payload, state, dispatch) => {
                if (type === 'jsonToTable') {
                    return command.exec(payload, state, dispatch);
                }
            });
             
            return {
                toolbarItems: [
                    {
                        groupIndex: 1,
                        itemIndex: 3,
                        item: {
                            name: 'jsonToTable',
                            tooltip: '从URL插入JSON表格',
                            className: 'toastui-editor-toolbar-icons fas fa-table', // 使用Font Awesome图标
                            command: 'jsonToTable',
                        },
                    },
                ],
            };
        }
    },

    init: () => {
        const Editor = toastui.Editor;

        this.editorInstance = new Editor({
            el: document.querySelector('#editor-wrapper'),
            height: '100%',
            initialEditType: 'markdown',
            previewStyle: 'vertical',
            plugins: [
                // CORRECTED LINE: Use toastui.Editor.plugin instead of Editor.plugin
                //[Editor.plugin.katex, { katexOptions: { output: 'html' } }]//,

                // Changed to 'this' for consistency within the object method
                //this.createJsonToTablePlugin() 
            ],
            events: {
                change: () => {
                    this.isDirty = true;
                    const content = this.editorInstance.getMarkdown();
                    localStorage.setItem('unsaved_content', content);
                    if (this.currentDocInfo.id) {
                         localStorage.setItem('current_doc_id', `${this.currentDocInfo.category}/${this.currentDocInfo.id}`);
                    }
                }
            }
        });
        
        const lastDocId = localStorage.getItem('current_doc_id');
        const unsavedContent = localStorage.getItem('unsaved_content');
        if (unsavedContent && confirm(`发现上次有未保存的内容 (文档ID: ${lastDocId || '新文档'}), 是否恢复?`)) {
            this.editorInstance.setMarkdown(unsavedContent);
        } else {
             localStorage.removeItem('unsaved_content');
             localStorage.removeItem('current_doc_id');
        }
    },

    setContent: (docData, category, docId) => {
        if (this.isDirty && !confirm('当前文档有未保存的更改，确定要切换吗？')) {
            return;
        }
        this.editorInstance.setMarkdown(docData.content || '');
        this.currentDocInfo = { category, id: docId, title: docData.title };
        this.isDirty = false;
        localStorage.setItem('current_doc_id', `${category}/${docId}`);
        // 切换文档后，清除本地的自动保存
        localStorage.removeItem('unsaved_content'); 
    },

    getContent: () => {
        return this.editorInstance.getMarkdown();
    },

    getHtmlContent: () => {
        return this.editorInstance.getHTML();
    },
    
    // 3.6 打印功能
    printContent: () => {
        const contentHtml = this.getHtmlContent();
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>打印 - ${this.currentDocInfo.title || '文档'}</title>
                    <link rel="stylesheet" href="https://uicdn.toast.com/editor/latest/toastui-editor.min.css" />
                    <link rel="stylesheet" href="css/print.css" />
                </head>
                <body>
                    <div class="toastui-editor-contents">
                        ${contentHtml}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
};