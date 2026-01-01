/**
 * Thai Smart Input Widget (Self-Contained)
 * 封装了：数据库逻辑、键盘映射、UI 渲染、CSS 样式
 */
(function() {
    const KEDMANEE = { 'KeyQ':'ๆ','KeyW':'ไ','KeyE':'ำ','KeyR':'พ','KeyT':'ะ','KeyY':'ั','KeyU':'ี','KeyI':'ร','KeyO':'น','KeyP':'ย','BracketLeft':'บ','BracketRight':'ล','KeyA':'ฟ','KeyS':'ห','KeyD':'ก','KeyF':'ด','KeyG':'เ','KeyH':'้','KeyJ':'่','KeyK':'า','KeyL':'ส','Semicolon':'ว','Quote':'ง','KeyZ':'ผ','KeyX':'ป','KeyC':'แ','KeyV':'อ','KeyB':'ิ','KeyN':'ื','KeyM':'ท','Comma':'ม','Period':'ใ','Slash':'ฝ' };
    const KEDMANEE_SHIFT = { 'KeyQ':'๐','KeyW':'"','KeyE':'ฎ','KeyR':'ฑ','KeyT':'ธ','KeyY':'ํ','KeyU':'ี','KeyI':'ณ','KeyO':'ฯ','KeyP':'ญ','BracketLeft':'ฐ','BracketRight':',','KeyA':'ฤ','KeyS':'ฆ','KeyD':'ฏ','KeyF':'โ','KeyG':'ฌ','KeyH':'็','KeyJ':'๋','KeyK':'ษ','KeyL':'ศ','Semicolon':'ซ','Quote':'.','KeyZ':'(','KeyX':')','KeyC':'ฉ','KeyV':'ฮ','KeyB':'ฺ','KeyN':'์','KeyM':'?','Comma':'ฒ','Period':'ฬ','Slash':'ฦ' };
    const THAI_DIACRITICS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g;

    class ThaiSmartInput {
        constructor(container, options = {}) {
            this.container = container;
            this.db = null;
            this.isMappingEnabled = true;
            this.activeIndex = -1;
            this.currentMatches = [];
            this.init();
        }

        async init() {
            await this.initDB();
            this.renderStructure();
            this.bindEvents();
            this.updateDbStatus();
        }

        initDB() {
            return new Promise((resolve) => {
                const request = indexedDB.open('ThaiDictDB', 1);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const store = db.createObjectStore('vocabulary', { keyPath: 'word' });
                    store.createIndex('rank', 'rank', { unique: false });
                    store.createIndex('consonants', 'consonants', { unique: false });
                };
                request.onsuccess = (e) => {
                    this.db = e.target.result;
                    resolve();
                };
            });
        }

        renderStructure() {
            // 使用 Shadow DOM 隔离样式
            this.shadow = this.container.attachShadow({ mode: 'open' });
            
            const style = document.createElement('style');
            style.textContent = `
                :host { display: block; font-family: sans-serif; }
                .widget-container { position: relative; width: 100%; box-sizing: border-box; }
                .input-wrapper { position: relative; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 1rem; overflow: hidden; display: flex; align-items: center; }
                .input-wrapper:focus-within { border-color: #3b82f6; background: white; }
                
                #thai-input, #ghost-text {
                    font-size: 1.25rem; line-height: 1.75rem; padding: 1rem;
                    width: 100%; box-sizing: border-box; border: none; background: transparent;
                }
                #thai-input { position: relative; z-index: 10; outline: none; }
                #ghost-text { position: absolute; top: 0; left: 0; color: #d1d5db; z-index: 5; white-space: pre; font-style: italic; }
                
                .suggestion-list {
                    position: absolute; top: 100%; left: 0; right: 0; background: white;
                    border-radius: 0.75rem; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                    margin-top: 0.5rem; max-height: 300px; overflow-y: auto; display: none; z-index: 100;
                }
                .suggestion-item { padding: 0.75rem 1rem; display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
                .suggestion-item.active { background: #eff6ff; border-left: 4px solid #3b82f6; }
                .word-bold { font-weight: bold; color: #1e3a8a; }
                .rank-label { font-size: 0.7rem; color: #3b82f6; font-weight: bold; }
                .def-label { font-size: 0.875rem; color: #6b7280; font-style: italic; }
                
                .controls { margin-top: 0.5rem; display: flex; gap: 0.5rem; align-items: center; font-size: 0.75rem; }
                .btn { background: #3b82f6; color: white; border: none; padding: 0.25rem 0.75rem; border-radius: 0.5rem; cursor: pointer; }
                .status-label { color: #9ca3af; }
                .mapping-indicator { color: #10b981; font-weight: bold; }
            `;

            const html = `
                <div class="widget-container">
                    <div class="input-wrapper">
                        <div id="ghost-text"></div>
                        <input type="text" id="thai-input" placeholder="输入泰语..." spellcheck="false">
                    </div>
                    <div id="suggestion-list" class="suggestion-list no-scrollbar"></div>
                    <div class="controls">
                        <button class="btn" id="import-btn">导入CSV</button>
                        <button class="btn" id="toggle-btn">关闭映射</button>
                        <span class="status-label" id="db-count">加载中...</span>
                        <span class="mapping-indicator" id="map-label">MAPPING ON</span>
                        <input type="file" id="csv-input" style="display:none" multiple accept=".csv">
                    </div>
                </div>
            `;

            this.shadow.appendChild(style);
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            this.shadow.appendChild(wrapper);

            // 获取内部引用
            this.inputEl = this.shadow.querySelector('#thai-input');
            this.ghostEl = this.shadow.querySelector('#ghost-text');
            this.listEl = this.shadow.querySelector('#suggestion-list');
            this.countEl = this.shadow.querySelector('#db-count');
            this.mapLabel = this.shadow.querySelector('#map-label');
            this.toggleBtn = this.shadow.querySelector('#toggle-btn');
        }

        bindEvents() {
            this.inputEl.addEventListener('keydown', (e) => this.handleKeydown(e));
            this.inputEl.addEventListener('input', () => this.handleInput());
            this.shadow.querySelector('#import-btn').onclick = () => this.shadow.querySelector('#csv-input').click();
            this.shadow.querySelector('#csv-input').onchange = (e) => this.handleImport(e);
            this.toggleBtn.onclick = () => this.toggleMapping();
            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target)) this.hideSuggestions();
            });
        }

        toggleMapping() {
            this.isMappingEnabled = !this.isMappingEnabled;
            this.mapLabel.style.display = this.isMappingEnabled ? 'inline' : 'none';
            this.toggleBtn.innerText = this.isMappingEnabled ? '关闭映射' : '开启映射';
            this.inputEl.focus();
        }

        handleKeydown(e) {
            // 物理映射
            if (this.isMappingEnabled && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const char = e.shiftKey ? KEDMANEE_SHIFT[e.code] : KEDMANEE[e.code];
                if (char) {
                    e.preventDefault();
                    const start = this.inputEl.selectionStart, end = this.inputEl.selectionEnd;
                    this.inputEl.value = this.inputEl.value.substring(0, start) + char + this.inputEl.value.substring(end);
                    this.inputEl.selectionStart = this.inputEl.selectionEnd = start + 1;
                    this.inputEl.dispatchEvent(new Event('input'));
                    return;
                }
            }

            const items = this.listEl.querySelectorAll('.suggestion-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length > 0) {
                    this.activeIndex = (this.activeIndex + 1) % items.length;
                    this.updateActiveUI(true);
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length > 0) {
                    this.activeIndex = (this.activeIndex - 1 + items.length) % items.length;
                    this.updateActiveUI(true);
                }
            } else if (e.key === 'Tab') {
                const suggestion = this.ghostEl.innerText.replace(this.inputEl.value, '').trim();
                if (this.ghostEl.innerText) {
                    e.preventDefault();
                    this.selectWord(this.ghostEl.innerText, true);
                }
            } else if (e.key === 'Enter') {
                if (this.activeIndex >= 0 && this.currentMatches[this.activeIndex]) {
                    this.selectWord(this.currentMatches[this.activeIndex].word, false);
                } else {
                    this.hideSuggestions();
                }
            }
        }

        async handleInput() {
            const q = this.inputEl.value.trim();
            if (!q) return this.hideSuggestions();
            this.activeIndex = -1;
            this.currentMatches = await this.searchDatabase(q);
            this.renderSuggestions(this.currentMatches, q);
        }

        async searchDatabase(query) {
            return new Promise((resolve) => {
                const tx = this.db.transaction('vocabulary', 'readonly');
                const store = tx.objectStore('vocabulary');
                const qCons = query.replace(THAI_DIACRITICS, '');
                const matches = [];
                store.openCursor().onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const it = cursor.value;
                        let s = it.word === query ? 200 : it.word.startsWith(query) ? 100 : it.consonants.startsWith(qCons) ? 50 : 0;
                        if (s > 0) matches.push({ ...it, s });
                        if (matches.length < 40) cursor.continue(); else finalize();
                    } else finalize();
                };
                function finalize() {
                    matches.sort((a, b) => b.s - a.s || a.rank - b.rank);
                    resolve(matches.slice(0, 15));
                }
            });
        }

        renderSuggestions(ms, q) {
            if (!ms.length) return this.hideSuggestions();
            this.listEl.innerHTML = ms.map((it, i) => `
                <div class="suggestion-item" data-index="${i}">
                    <div><span class="word-bold">${it.word}</span> <span class="rank-label">#${it.rank}</span></div>
                    <span class="def-label">${it.def}</span>
                </div>
            `).join('');

            this.listEl.querySelectorAll('.suggestion-item').forEach(item => {
                item.onclick = () => this.selectWord(ms[item.dataset.index].word, false);
                item.onmousemove = () => {
                    this.activeIndex = parseInt(item.dataset.index);
                    this.updateActiveUI(false);
                };
            });

            this.listEl.style.display = 'block';
            if (ms[0] && ms[0].word.startsWith(q)) {
                const remaining = ms[0].word.substring(q.length);
                this.ghostEl.innerHTML = `<span style="color:transparent">${q}</span>${remaining}`;
            } else this.ghostEl.textContent = '';
        }

        updateActiveUI(fromKeyboard) {
            const items = this.listEl.querySelectorAll('.suggestion-item');
            items.forEach((item, i) => {
                if (i === this.activeIndex) {
                    item.classList.add('active');
                    if (fromKeyboard) item.scrollIntoView({ block: 'nearest' });
                } else item.classList.remove('active');
            });
        }

        selectWord(word, stay) {
            this.inputEl.value = word;
            if (stay) this.handleInput();
            else this.hideSuggestions();
            this.inputEl.focus();
        }

        hideSuggestions() { this.listEl.style.display = 'none'; this.ghostEl.textContent = ''; this.activeIndex = -1; }

        async handleImport(e) {
            const files = Array.from(e.target.files);
            let count = 0;
            const csvRegex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
            for (let file of files) {
                const text = await file.text();
                const items = [];
                text.split(/\r?\n/).slice(1).forEach(line => {
                    const m = line.match(csvRegex);
                    if (m && m.length >= 2) {
                        const word = m[1].replace(/^"|"$/g, '').trim();
                        items.push({ rank: parseInt(m[0])||99, word, def: m[2]?m[2].replace(/^"|"$/g,''):"", consonants: word.replace(THAI_DIACRITICS, '') });
                        count++;
                    }
                });
                const tx = this.db.transaction('vocabulary', 'readwrite');
                items.forEach(it => tx.objectStore('vocabulary').put(it));
            }
            alert(`导入成功 ${count} 条词汇`);
            this.updateDbStatus();
        }

        updateDbStatus() {
            if(!this.db) return;
            this.db.transaction('vocabulary','readonly').objectStore('vocabulary').count().onsuccess = (e) => {
                this.countEl.innerText = `词库: ${e.target.result}`;
            };
        }
    }

    // 全局暴露
    window.ThaiSmartInput = ThaiSmartInput;
})();