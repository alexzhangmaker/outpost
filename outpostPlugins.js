/*
const svgBTNSize = 18 ;
createStickyToolbar({
    buttons: [
        {
            svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${svgBTNSize}" height="${svgBTNSize}" viewBox="0 0 16 16"><path fill="#000000" d="M8 1.4L6 2.7V1H4v3L0 6.6l.6.8L8 2.6l7.4 4.8l.6-.8z"/><path fill="#000000" d="M8 4L2 8v7h5v-3h2v3h5V8z"/></svg>`,
            tip: 'Home',
            onClick: () => alert('Home clicked'),
        }
    ]
});
*/
function createStickyToolbar(config) {
    // Helper to inject script or stylesheet
    function injectResource(type, url) {
        return new Promise((resolve, reject) => {
            let el;
            if (type === 'script') {
                el = document.createElement('script');
                el.src = url;
                el.async = true;
            } else if (type === 'style') {
                el = document.createElement('link');
                el.href = url;
                el.rel = 'stylesheet';
            }
            el.onload = () => resolve();
            el.onerror = () => reject(`Failed to load ${url}`);
            document.head.appendChild(el);
        });
    }

    // Check if dependencies exist
    const hasTippy = typeof window.tippy === 'function';
    const hasPopper = typeof window.Popper === 'function';

    const loadDependencies = async () => {
        const promises = [];

        if (!hasPopper) {
            promises.push(injectResource('script', 'https://unpkg.com/@popperjs/core@2'));
        }
        if (!hasTippy) {
            promises.push(injectResource('script', 'https://unpkg.com/tippy.js@6'));
            promises.push(injectResource('style', 'https://unpkg.com/tippy.js@6/dist/tippy.css'));
        }

        await Promise.all(promises);
    };

    // Main toolbar logic
    const initToolbar = () => {
        const toolbar = document.createElement('div');
        toolbar.style.position = 'fixed';
        toolbar.style.bottom = '20px';
        toolbar.style.right = '20px';
        toolbar.style.display = 'flex';
        toolbar.style.alignItems = 'center'; // 👈 Aligns icons vertically
        toolbar.style.gap = '12px';
        toolbar.style.background = '#fff';
        toolbar.style.border = '1px solid #ccc';
        toolbar.style.borderRadius = '8px';
        toolbar.style.padding = '10px';
        toolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        toolbar.style.zIndex = '9999';

        config.buttons.forEach((btn) => {
            const button = document.createElement('button');
            button.style.border = 'none';
            button.style.background = 'transparent';
            button.style.cursor = 'pointer';
            button.style.padding = '0';
            button.style.width = '32px';
            button.style.height = '32px';

            if(btn.hasOwnProperty("svg")){
                button.innerHTML=btn.svg ;
            }else{
                const img = document.createElement('img');
                img.src = btn.iconUrl;
                img.alt = btn.tip;
                img.style.width = '100%';
                img.style.height = '100%';
                button.appendChild(img);
            }
            

            button.onclick = btn.onClick;

            toolbar.appendChild(button);

                // Initialize tooltip
            window.tippy(button, {
                content: btn.tip,
                placement: 'top',
                animation: 'scale',
            });
        });

        document.body.appendChild(toolbar);
    };

    // Load dependencies and initialize
    loadDependencies().then(initToolbar).catch((err) => console.error('Toolbar setup failed:', err));
}


/*创建一个垂直方向可以拖动的工具条*/
function createVerticalDraggableToolbar(config, container, position = 'left') {
    const ensureTippy = async () => {
        const loadScript = (url) =>
            new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(`Failed to load ${url}`);
            document.head.appendChild(script);
            });

        const loadStyle = (url) =>
            new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            link.onload = () => resolve();
            link.onerror = () => reject(`Failed to load ${url}`);
            document.head.appendChild(link);
            });

        const needsTippy = typeof window.tippy !== 'function';

        if (needsTippy) {
            await loadScript('https://unpkg.com/@popperjs/core@2');
            await loadScript('https://unpkg.com/tippy.js@6');
            await loadStyle('https://unpkg.com/tippy.js@6/dist/tippy.css');

            // Wait until window.tippy is available
            await new Promise((resolve) => {
            const check = () => {
                if (typeof window.tippy === 'function') {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
            });
        }
    };

    const loadResource = (type, url) => {
        return new Promise((resolve, reject) => {
            const el = type === 'script' ? document.createElement('script') : document.createElement('link');
            if (type === 'script') {
                el.src = url;
                el.async = true;
            } else {
                el.href = url;
                el.rel = 'stylesheet';
            }
            el.onload = () => resolve();
            el.onerror = () => reject(`Failed to load ${url}`);
            document.head.appendChild(el);
        });
    };

    const initToolbar = () => {
        const toolbar = document.createElement('div');
        toolbar.style.position = 'absolute';
        toolbar.style.top = '20px';
        toolbar.style[position] = '20px';
        toolbar.style.display = 'flex';
        toolbar.style.flexDirection = 'column';
        toolbar.style.gap = '12px';
        toolbar.style.background = '#fff';
        toolbar.style.border = '1px solid #ccc';
        toolbar.style.borderRadius = '4px';
        toolbar.style.padding = '6px';
        toolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        toolbar.style.zIndex = '9999';
        toolbar.style.cursor = 'grab';

        toolbar.setAttribute('draggable', 'true');

        config.buttons.forEach(btn => {
            const button = document.createElement('button');
            button.style.border = 'none';
            button.style.background = 'transparent';
            button.style.cursor = 'pointer';
            button.style.padding = '0';
            button.style.width = '32px';
            button.style.height = '32px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';

            if (btn.svg) {
                button.innerHTML = btn.svg;
            } else if (btn.iconUrl) {
                const img = document.createElement('img');
                img.src = btn.iconUrl;
                img.alt = btn.tip;
                img.style.width = '100%';
                img.style.height = '100%';
                button.appendChild(img);
            }

            button.onclick = btn.onClick;
            toolbar.appendChild(button);

            window.tippy(button, {
                content: btn.tip,
                placement: 'right',
                animation: 'scale',
            });
        });

        let offsetX = 0, offsetY = 0;
        toolbar.addEventListener('dragstart', (e) => {
            const rect = toolbar.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        container.addEventListener('dragover', (e) => e.preventDefault());

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const containerRect = container.getBoundingClientRect();
            const x = e.clientX - containerRect.left - offsetX;
            const y = e.clientY - containerRect.top - offsetY;
            toolbar.style.left = `${x}px`;
            toolbar.style.top = `${y}px`;
            toolbar.style.right = ''; // clear right if repositioned
        });

        container.appendChild(toolbar);
  };

  ensureTippy().then(initToolbar).catch(err => console.error('Toolbar setup failed:', err));
}

/*
// Sample config
const myToolbarConfig = {
  buttons: [
    {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 576 512"><path fill="#000000" d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z"/></svg>`,
        tip: 'Home',
        onClick: () => alert('Clicked Green Dot'),
    },
    {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#000000"><g fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="M20.232 10.055c.48-.54 1.308-1.356 1.264-1.689c.034-.323-.141-.627-.491-1.234l-.494-.856c-.373-.648-.56-.972-.877-1.101c-.318-.13-.677-.028-1.395.176l-1.22.344c-.46.106-.94.046-1.359-.17l-.337-.194a2 2 0 0 1-.788-.968l-.334-.997c-.22-.66-.33-.99-.59-1.179C13.348 2 13 2 12.306 2h-1.114c-.695 0-1.042 0-1.303.188c-.262.19-.371.52-.591 1.18l-.334.996a2 2 0 0 1-.788.968l-.337.195c-.419.215-.9.275-1.359.169l-1.22-.344c-.718-.204-1.077-.306-1.395-.176c-.317.129-.504.453-.877 1.1l-.494.857c-.35.607-.525.911-.49 1.234c.033.323.267.584.736 1.105l1.03 1.152c.253.32.432.876.432 1.375c0 .5-.18 1.056-.431 1.375L2.74 14.526c-.469.521-.703.781-.737 1.105s.141.627.491 1.234l.494.856c.373.648.56.972.877 1.101c.318.13.677.028 1.395-.176l1.22-.344a2 2 0 0 1 1.36.17l.336.194c.359.23.635.569.788.968l.334.997c.22.66.34 1.003.541 1.148c.06.043.3.24.888.221M15 17.218s1 .284 1.5 1.284c0 0 1.096-2.5 2.508-3"/><path d="M22 16.999a5 5 0 1 1-10 0a5 5 0 0 1 10 0m-7.84-7.556c-.84-.684-1.5-.948-2.46-.948c-1.8.024-3.444 1.51-3.444 3.444c0 1.065.324 1.74.936 2.448"/></g></svg>`,
        tip: 'Settings',
        onClick: () => alert('Settings clicked'),
    },
    {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 26 26"><path fill="#000000" d="M10 .188A9.812 9.812 0 0 0 .187 10A9.812 9.812 0 0 0 10 19.813c2.29 0 4.393-.811 6.063-2.125l.875.875a1.845 1.845 0 0 0 .343 2.156l4.594 4.625c.713.714 1.88.714 2.594 0l.875-.875a1.84 1.84 0 0 0 0-2.594l-4.625-4.594a1.824 1.824 0 0 0-2.157-.312l-.875-.875A9.812 9.812 0 0 0 10 .188zM10 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16zM4.937 7.469a5.446 5.446 0 0 0-.812 2.875a5.46 5.46 0 0 0 5.469 5.469a5.516 5.516 0 0 0 3.156-1a7.166 7.166 0 0 1-.75.03a7.045 7.045 0 0 1-7.063-7.062c0-.104-.005-.208 0-.312z"/></svg>`,
        tip: 'Search',
        onClick: () => alert('Search clicked'),
    },
  ]
};

const containerDiv = document.getElementById('myContainer');
createVerticalDraggableToolbar(myToolbarConfig, containerDiv, 'left');
*/


/*创建对话框*/
/*
const modalSchema = [
    { name: "Quiz", type: "select", option: [] }
];

for(let i=0;i<Quizs.length;i++){
    modalSchema[0].option.push(Quizs[i].title) ;
}

const modalCallbacks = {
    onConfirm: async (data) => {
        console.log(Quizs) ;
        console.log('Confirmed:', data) ;
    },
    onCancel: () => console.log('Cancelled')
};

createSchemaModal(modalSchema, modalCallbacks);
*/

function createSchemaModal(schema, callbacks) {
    // Remove existing modal if present
    const existing = document.getElementById('schema-modal');
    if (existing) existing.remove();

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'schema-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';

    // Create modal content box
    const box = document.createElement('div');
    box.style.background = '#fff';
    box.style.padding = '20px';
    box.style.borderRadius = '8px';
    box.style.minWidth = '300px';
    box.style.maxWidth = '400px';
    box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.gap = '12px';

    const formData = {};

    schema.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';

        const label = document.createElement('label');
        label.textContent = field.name;
        label.style.marginBottom = '4px';
        label.style.fontWeight = 'bold';

        let input;

        if (field.type === 'string') {
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = field.placeholder || '';
        } else if (field.type === 'select') {
            input = document.createElement('select');
            field.option.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
        } else if (field.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            wrapper.style.flexDirection = 'row';
            wrapper.style.alignItems = 'center';
            label.style.marginRight = '8px';
        }

        input.name = field.name;
        input.style.padding = '6px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';

        wrapper.appendChild(label);
        wrapper.appendChild(input);
        box.appendChild(wrapper);
    });

    // Buttons
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'flex-end';
    buttonRow.style.gap = '10px';
    buttonRow.style.marginTop = '16px';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.onclick = () => {
        callbacks.onCancel?.();
        modal.remove();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm';
    confirmBtn.style.padding = '6px 12px';
    confirmBtn.style.background = '#007bff';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.onclick = () => {
        schema.forEach(field => {
        const el = box.querySelector(`[name="${field.name}"]`);
        if (field.type === 'checkbox') {
            formData[field.name] = el.checked;
        } else {
            formData[field.name] = el.value;
        }
        });
        callbacks.onConfirm?.(formData);
        modal.remove();
    };

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(confirmBtn);
    box.appendChild(buttonRow);
    modal.appendChild(box);
    document.body.appendChild(modal);
}



//Example usage in consoleAll.html
/**
 * 创建一个通用的表单模态框
 * @param {string} title 模态框的标题
 * @param {Array<Object>} schema 定义表单结构的数组
 * @param {Object} callbacks 包含 onConfirm 和 onCancel 回调函数的对象
 */
/*
// 1. 定义你的表单结构 (Schema)
const mySchema = [
    { "name": "key", "type": "string", "placeholder": "请输入唯一的Key" },
    { "name": "Words", "type": "array", "placeholder": "输入词语，用英文逗号,分隔" },
    { "name": "大类title", "type": "string" },
    { "name": "分类title", "type": "textarea", "placeholder": "请输入详细描述信息" },
    { "name": "级别", "type": "number", "placeholder": "请输入数字级别" },
    { "name": "是否发布", "type": "boolean" }
];

// 2. 定义回调函数
const myCallbacks = {
    onConfirm: (formData) => {
        console.log("表单已确认, 接收到的数据:", formData);
        alert("数据已提交，请查看控制台！");
    },
    onCancel: () => {
        console.log("用户取消了操作。");
    }
};

// 3. 调用函数创建并显示 Modal
createFormModal('新建项目', mySchema, myCallbacks);
*/

function createFormModal(title, schema, callbacks) {
    // --- 1. 防止重复创建，先移除已存在的 modal ---
    const existingModal = document.getElementById('generic-modal-backdrop');
    if (existingModal) {
        existingModal.remove();
    }

    // --- 2. 创建 CSS 样式 ---
    // 为了让组件自包含，我们动态创建 style 标签
    const styleId = 'generic-modal-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .modal-content {
                background-color: white;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 500px;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }
            .modal-backdrop.visible {
                opacity: 1;
            }
            .modal-backdrop.visible .modal-content {
                transform: scale(1);
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .modal-header h2 {
                margin: 0;
                font-size: 1.25rem;
            }
            .modal-close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #888;
            }
            .modal-form .form-group {
                margin-bottom: 15px;
            }
            .modal-form .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #333;
            }
            .modal-form .form-group input[type="text"],
            .modal-form .form-group input[type="number"],
            .modal-form .form-group textarea {
                width: 100%;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-sizing: border-box; /* 保证 padding 不会影响宽度 */
            }
            .modal-form .form-group .checkbox-group {
                display: flex;
                align-items: center;
            }
             .modal-form .form-group .checkbox-group input {
                margin-right: 10px;
            }
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 25px;
            }
            .modal-footer button {
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            }
            .modal-btn-confirm {
                background-color: #007bff;
                color: white;
            }
            .modal-btn-cancel {
                background-color: #f1f1f1;
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }

    // --- 3. 创建 Modal 的 DOM 结构 ---
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'generic-modal-backdrop';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `<h2>${title}</h2>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '&times;';
    modalHeader.appendChild(closeBtn);

    // Body (Form)
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    const form = document.createElement('form');
    form.className = 'modal-form';

    // 根据 Schema 生成表单项
    schema.forEach(field => {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', field.name);
        label.textContent = field.name;
        group.appendChild(label);

        let input;
        switch (field.type) {
            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                break;
            case 'array':
            case 'textarea': // textarea 可以复用 array 的输入形式
                input = document.createElement('textarea');
                input.rows = 3;
                break;
            case 'boolean':
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'checkbox-group';
                input = document.createElement('input');
                input.type = 'checkbox';
                // 对于 checkbox，把 label 放在右边更符合习惯
                checkboxWrapper.appendChild(input);
                checkboxWrapper.appendChild(label); 
                group.innerHTML = ''; // 清空 group，因为 label 已经放入 wrapper
                group.appendChild(checkboxWrapper);
                break;
            case 'string':
            default:
                input = document.createElement('input');
                input.type = 'text';
                break;
        }

        if (field.type !== 'boolean') {
             input.id = field.name;
             input.name = field.name;
             if(field.placeholder) {
                input.placeholder = field.placeholder;
             }
             group.appendChild(input);
        } else {
             input.id = field.name;
             input.name = field.name;
        }

        form.appendChild(group);
    });

    modalBody.appendChild(form);

    // Footer (Buttons)
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn-confirm';
    confirmBtn.textContent = '确认';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'modal-btn-cancel';
    cancelBtn.textContent = '取消';
    modalFooter.appendChild(cancelBtn);
    modalFooter.appendChild(confirmBtn);

    // 组装 Modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalBackdrop.appendChild(modalContent);

    // --- 4. 挂载到 Body ---
    document.body.appendChild(modalBackdrop);
    
    // 触发显示动画
    setTimeout(() => {
        modalBackdrop.classList.add('visible');
    }, 10);


    // --- 5. 事件处理 ---
    const closeModal = () => {
        modalBackdrop.classList.remove('visible');
        modalBackdrop.addEventListener('transitionend', () => {
            modalBackdrop.remove();
        }, { once: true });
    };

    // 点击确认按钮
    confirmBtn.addEventListener('click', () => {
        const formData = {};
        schema.forEach(field => {
            const inputElement = form.elements[field.name];
            if (inputElement) {
                switch (field.type) {
                    case 'number':
                        formData[field.name] = parseFloat(inputElement.value) || 0;
                        break;
                    case 'array':
                        // 将逗号分隔的字符串转为数组，并去除首尾空格
                        formData[field.name] = inputElement.value ? inputElement.value.split(',').map(item => item.trim()) : [];
                        break;
                    case 'boolean':
                        formData[field.name] = inputElement.checked;
                        break;
                    default:
                        formData[field.name] = inputElement.value;
                        break;
                }
            }
        });

        // 调用成功回调
        if (callbacks && typeof callbacks.onConfirm === 'function') {
            callbacks.onConfirm(formData);
        }
        closeModal();
    });
    
    // 监听表单的 submit 事件，防止页面刷新，并触发确认按钮的点击
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmBtn.click();
    });

    // 点击取消按钮
    cancelBtn.addEventListener('click', () => {
        // 调用取消回调
        if (callbacks && typeof callbacks.onCancel === 'function') {
            callbacks.onCancel();
        }
        closeModal();
    });

    // 点击关闭按钮
    closeBtn.addEventListener('click', () => {
        cancelBtn.click();
    });

    // 点击背景遮罩层关闭
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) {
            cancelBtn.click();
        }
    });
}

/*创建上下文菜单 */
function createContextMenu(container) {
    let menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.display = 'none';
    menu.style.flexDirection = 'column';
    menu.style.gap = '10px';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '8px';
    menu.style.padding = '10px';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    menu.style.zIndex = '10000';

    container.appendChild(menu);

    // 自动加载 Tippy.js
    const ensureTippy = async () => {
        if (typeof window.tippy === 'function') return;
        await Promise.all([
            loadScript('https://unpkg.com/@popperjs/core@2'),
            loadScript('https://unpkg.com/tippy.js@6'),
            loadStyle('https://unpkg.com/tippy.js@6/dist/tippy.css')
        ]);
        await new Promise(resolve => {
            const check = () => typeof window.tippy === 'function' ? resolve() : setTimeout(check, 50);
            check();
        });
    };

    const loadScript = (url) => new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.onload = resolve;
        s.onerror = () => reject(`Failed to load ${url}`);
        document.head.appendChild(s);
    });

    const loadStyle = (url) => new Promise((resolve, reject) => {
        const l = document.createElement('link');
        l.href = url;
        l.rel = 'stylesheet';
        l.onload = resolve;
        l.onerror = () => reject(`Failed to load ${url}`);
        document.head.appendChild(l);
    });

    const api = {
        show(x, y) {
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            menu.style.display = 'flex';
        },
        hide() {
            menu.style.display = 'none';
        },
        populate(items) {
            menu.innerHTML = '';
            items.forEach(item => {
                const btn = document.createElement('button');
                btn.style.border = 'none';
                btn.style.background = 'transparent';
                btn.style.cursor = 'pointer';
                btn.style.width = '32px';
                btn.style.height = '32px';
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';

                if (item.svg) {
                    btn.innerHTML = item.svg;
                } else if (item.iconUrl) {
                    const img = document.createElement('img');
                    img.src = item.iconUrl;
                    img.alt = item.tip;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    btn.appendChild(img);
                }

                btn.onclick = () => {
                    item.onClick?.();
                    api.hide();
                };

                menu.appendChild(btn);

                ensureTippy().then(() => {
                    window.tippy(btn, {
                        content: item.tip,
                        placement: 'right',
                        animation: 'scale',
                    });
                });
            });
        }
    };

    // 点击空白处隐藏菜单
    document.addEventListener('click', () => api.hide());

    return api;
}
/*范例
const container = document.getElementById('myContainer');
const contextMenu = createContextMenu(container);

container.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const target = e.target;
  // 根据点击对象动态生成菜单项
  let items = [];
  if (target.classList.contains('file')) {
    items = [
      {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="#000000"><g fill="none" stroke="#000000" stroke-linecap="round" stroke-width="4"><path stroke-linejoin="round" d="M29 4H9C7.89543 4 7 4.89543 7 6V42C7 43.1046 7.89543 44 9 44H37C38.1046 44 39 43.1046 39 42V20.0046"/><path d="M13 18H21"/><path d="M13 28H25"/><path stroke-linejoin="round" d="M40.9991 6.00098L29.0044 17.9958"/></g></svg>',
        tip: '打开文件',
        onClick: () => alert('打开文件')
      }//...
    ];
  } 

  contextMenu.populate(items);
  contextMenu.show(e.clientX, e.clientY);
});
 */