async function doModalChooseAnkiSet(jsonAnkis) {
    return new Promise((resolve) => {
        // 创建modal容器
        const modalContainer = document.createElement('div');
        modalContainer.id = 'anki-set-modal-container';
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // 创建modal内容
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 400px;
            max-width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        // 创建标题
        const title = document.createElement('h2');
        title.textContent = '选择Anki集合';
        title.style.marginBottom = '20px';

        // 创建选项容器
        const optionsContainer = document.createElement('div');
        optionsContainer.id = 'anki-set-options';
        optionsContainer.style.marginBottom = '20px';

        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;

        // 创建确定按钮
        const confirmButton = document.createElement('button');
        confirmButton.textContent = '确定';
        confirmButton.disabled = true; // 初始状态禁用
        confirmButton.style.cssText = `
            padding: 8px 16px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        // 创建取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;

        // 存储当前选中的key
        let selectedKey = null;

        // 为每个JSON项创建选项
        Object.entries(jsonAnkis).forEach(([key, value]) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.cssText = `
                padding: 10px;
                margin-bottom: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            // 创建显示内容
            const titleSpan = document.createElement('span');
            titleSpan.textContent = value.title || '无标题';
            titleSpan.style.fontWeight = 'bold';

            const nextReviewSpan = document.createElement('span');
            nextReviewSpan.textContent = ` - 下次复习: ${value.nextReview || '无日期'}`;
            nextReviewSpan.style.color = '#666';
            nextReviewSpan.style.marginLeft = '8px';

            optionDiv.appendChild(titleSpan);
            optionDiv.appendChild(nextReviewSpan);

            // 添加点击事件
            optionDiv.addEventListener('click', () => {
                // 移除之前选中的样式
                document.querySelectorAll('#anki-set-options > div').forEach(opt => {
                    opt.style.backgroundColor = '';
                    opt.style.borderColor = '#ddd';
                });

                // 设置当前选中的样式
                optionDiv.style.backgroundColor = '#e3f2fd';
                optionDiv.style.borderColor = '#007bff';

                // 更新选中状态
                selectedKey = key;
                confirmButton.disabled = false;
            });

            optionsContainer.appendChild(optionDiv);
        });

        // 按钮事件处理
        confirmButton.addEventListener('click', () => {
            if (selectedKey) {
                cleanup();
                resolve(selectedKey);
            }
        });

        cancelButton.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        // 点击modal外部关闭
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                cleanup();
                resolve(null);
            }
        });

        // 清理函数
        function cleanup() {
            if (document.body.contains(modalContainer)) {
                document.body.removeChild(modalContainer);
            }
        }

        // 组装modal
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);

        modalContent.appendChild(title);
        modalContent.appendChild(optionsContainer);
        modalContent.appendChild(buttonContainer);

        modalContainer.appendChild(modalContent);

        // 添加到DOM
        document.body.appendChild(modalContainer);
    });
}

// 使用示例
// async function exampleUsage() {
//     const jsonAnkis = {
//         "set1": {
//             "title": "英语单词",
//             "nextReview": "2024-01-15"
//         },
//         "set2": {
//             "title": "数学公式",
//             "nextReview": "2024-01-16"
//         },
//         "set3": {
//             "title": "历史事件",
//             "nextReview": "2024-01-17"
//         }
//     };
//     
//     const selectedKey = await doModalChooseAnkiSet(jsonAnkis);
//     console.log('用户选择了:', selectedKey);
// }