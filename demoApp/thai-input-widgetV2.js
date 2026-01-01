/**
 * Thai Smart Input Widget - Professional Edition
 * 功能：物理映射 + 模糊容错(Fuzzy) + 等级画像优化(B1/B2 Profile)
 */
(function() {
    const KEDMANEE = { 'KeyQ':'ๆ','KeyW':'ไ','KeyE':'ำ','KeyR':'พ','KeyT':'ะ','KeyY':'ั','KeyU':'ี','KeyI':'ร','KeyO':'น','KeyP':'ย','BracketLeft':'บ','BracketRight':'ล','KeyA':'ฟ','KeyS':'ห','KeyD':'ก','KeyF':'ด','KeyG':'เ','KeyH':'้','KeyJ':'่','KeyK':'า','KeyL':'ส','Semicolon':'ว','Quote':'ง','KeyZ':'ผ','KeyX':'ป','KeyC':'แ','KeyV':'อ','KeyB':'ิ','KeyN':'ื','KeyM':'ท','Comma':'ม','Period':'ใ','Slash':'ฝ' };
    const KEDMANEE_SHIFT = { 'KeyQ':'๐','KeyW':'"','KeyE':'ฎ','KeyR':'ฑ','KeyT':'ธ','KeyY':'ํ','KeyU':'ี','KeyI':'ณ','KeyO':'ฯ','KeyP':'ญ','BracketLeft':'ฐ','BracketRight':',','KeyA':'ฤ','KeyS':'ฆ','KeyD':'ฏ','KeyF':'โ','KeyG':'ฌ','KeyH':'็','KeyJ':'๋','KeyK':'ษ','KeyL':'ศ','Semicolon':'ซ','Quote':'.','KeyZ':'(','KeyX':')','KeyC':'ฉ','KeyV':'ฮ','KeyB':'ฺ','KeyN':'์','KeyM':'?','Comma':'ฒ','Period':'ฬ','Slash':'ฦ' };
    
    const FUZZY_GROUPS = {
        'ส': 'สศษซ', 'ศ': 'สศษซ', 'ษ': 'สศษซ', 'ซ': 'สศษซ',
        'ด': 'ดตฎฏ', 'ต': 'ดตฎฏ', 'น': 'ณน', 'ภ': 'ภถ', 'บ': 'บป', 'ล': 'ลฬ'
    };

    const THAI_DIACRITICS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g;

    class ThaiSmartInput {
        constructor(container, options = {}) {
            this.container = container;
            this.config = {
                isFuzzyEnabled: options.isFuzzyEnabled ?? true,
                isMappingEnabled: options.isMappingEnabled ?? true,
                isProfileOptimized: options.isProfileOptimized ?? true, // 新增：画像优化开关
                userLevel: options.userLevel ?? 'B1', // 目标等级
                ...options
            };
            this.db = null;
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
                request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
            });
        }

        renderStructure() {
            this.shadow = this.container.attachShadow({ mode: 'open' });
            const style = document.createElement('style');
            style.textContent = `
                :host { display: block; --primary: #2563eb; --bg: #f8fafc; }
                .widget { font-family: system-ui, -apple-system, sans-serif; position: relative; }
                .input-area { position: relative; background: var(--bg); border: 2px solid #e2e8f0; border-radius: 16px; transition: all 0.2s; }
                .input-area:focus-within { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
                
                #thai-input, #ghost-text {
                    font-size: 1.5rem; line-height: 2.25rem; padding: 1.25rem; width: 100%; 
                    box-sizing: border-box; border: none; background: transparent;
                }
                #thai-input { position: relative; z-index: 10; outline: none; }
                #ghost-text { position: absolute; top: 0; left: 0; color: #cbd5e1; z-index: 5; white-space: pre; font-style: italic; }

                .list {
                    position: absolute; top: 100%; left: 0; right: 0; background: white;
                    border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                    margin-top: 10px; max-height: 350px; overflow-y: auto; display: none; z-index: 100;
                }
                .item { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
                .item.active { background: #eff6ff; border-left: 5px solid var(--primary); }
                
                .word-box { display: flex; flex-direction: column; }
                .word-text { font-weight: 700; color: #1e293b; font-size: 1.25rem; }
                .badge-row { display: flex; gap: 4px; margin-top: 2px; }
                .badge { font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
                .badge-rank { background: #dbeafe; color: #1e40af; }
                .badge-fuzzy { background: #fef3c7; color: #92400e; }
                .badge-profile { background: #dcfce7; color: #166534; }

                .def-text { font-size: 0.9rem; color: #64748b; font-style: italic; text-align: right; max-width: 50%; }
                
                .toolbar { margin-top: 12px; display: flex; gap: 15px; font-size: 12px; color: #64748b; flex-wrap: wrap; }
                .sw { display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
                .sw:hover { background: #f1f5f9; }
                .sw.on { color: var(--primary); font-weight: 600; }
                .db-info { margin-left: auto; font-family: monospace; }
            `;

            this.shadow.appendChild(style);
            const root = document.createElement('div');
            root.className = 'widget';
            root.innerHTML = `
                <div class="input-area">
                    <div id="ghost-text"></div>
                    <input type="text" id="thai-input" placeholder="输入泰语..." spellcheck="false" autocomplete="off">
                </div>
                <div id="suggestion-list" class="list no-scrollbar"></div>
                <div class="toolbar">
                    <div class="sw ${this.config.isMappingEnabled?'on':''}" id="t-map"><input type="checkbox" ${this.config.isMappingEnabled?'checked':''}> 键盘映射</div>
                    <div class="sw ${this.config.isFuzzyEnabled?'on':''}" id="t-fuzzy"><input type="checkbox" ${this.config.isFuzzyEnabled?'checked':''}> 模糊容错</div>
                    <div class="sw ${this.config.isProfileOptimized?'on':''}" id="t-prof"><input type="checkbox" ${this.config.isProfileOptimized?'checked':''}> B1/B2 权重</div>
                    <span class="db-info" id="db-count">...</span>
                    <button id="btn-csv" style="color:var(--primary); cursor:pointer; background:none; border:none; font-size:12px; text-decoration:underline;">导入</button>
                    <input type="file" id="f-csv" style="display:none" multiple accept=".csv">
                </div>
            `;
            this.shadow.appendChild(root);

            this.inputEl = this.shadow.querySelector('#thai-input');
            this.ghostEl = this.shadow.querySelector('#ghost-text');
            this.listEl = this.shadow.querySelector('#suggestion-list');
            this.countEl = this.shadow.querySelector('#db-count');
        }

        bindEvents() {
            this.inputEl.addEventListener('keydown', (e) => this.onKey(e));
            this.inputEl.addEventListener('input', () => this.onInput());
            
            const setupSwitch = (id, key) => {
                const el = this.shadow.querySelector(id);
                el.onclick = () => {
                    this.config[key] = !this.config[key];
                    el.classList.toggle('on', this.config[key]);
                    el.querySelector('input').checked = this.config[key];
                    this.onInput();
                    this.inputEl.focus();
                };
            };
            setupSwitch('#t-map', 'isMappingEnabled');
            setupSwitch('#t-fuzzy', 'isFuzzyEnabled');
            setupSwitch('#t-prof', 'isProfileOptimized');

            this.shadow.querySelector('#btn-csv').onclick = () => this.shadow.querySelector('#f-csv').click();
            this.shadow.querySelector('#f-csv').onchange = (e) => this.doImport(e);
            document.addEventListener('click', (e) => { if(!this.container.contains(e.target)) this.close(); });
        }

        onKey(e) {
            if (this.config.isMappingEnabled && !e.ctrlKey && !e.altKey && !e.metaKey) {
                const c = e.shiftKey ? KEDMANEE_SHIFT[e.code] : KEDMANEE[e.code];
                if(c) {
                    e.preventDefault();
                    const s = this.inputEl.selectionStart;
                    this.inputEl.value = this.inputEl.value.substring(0, s) + c + this.inputEl.value.substring(this.inputEl.selectionEnd);
                    this.inputEl.selectionStart = this.inputEl.selectionEnd = s + 1;
                    this.inputEl.dispatchEvent(new Event('input'));
                    return;
                }
            }
            const items = this.listEl.querySelectorAll('.item');
            if (e.key === 'ArrowDown') { e.preventDefault(); this.activeIndex = (this.activeIndex + 1) % items.length; this.drawActive(items); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); this.activeIndex = (this.activeIndex - 1 + items.length) % items.length; this.drawActive(items); }
            else if (e.key === 'Tab') { if(this.ghostEl.innerText) { e.preventDefault(); this.select(this.ghostEl.innerText, true); } }
            else if (e.key === 'Enter') { if(this.activeIndex >= 0) this.select(this.currentMatches[this.activeIndex].word, false); else this.close(); }
            else if (e.key === 'Escape') this.close();
        }

        async onInput() {
            const val = this.inputEl.value;
            if(!val.trim()) return this.close();
            this.activeIndex = -1;
            this.currentMatches = await this.query(val.trim());
            this.render(this.currentMatches, val);
        }

        async query(q) {
            return new Promise((resolve) => {
                const tx = this.db.transaction('vocabulary', 'readonly');
                const store = tx.objectStore('vocabulary');
                const qCons = q.replace(THAI_DIACRITICS, '');
                
                let fuzzyRx = null;
                if (this.config.isFuzzyEnabled) {
                    let p = '';
                    for (const c of qCons) p += FUZZY_GROUPS[c] ? `[${FUZZY_GROUPS[c]}]` : c;
                    fuzzyRx = new RegExp('^' + p);
                }

                const res = [];
                store.openCursor().onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const it = cursor.value;
                        let score = 0;
                        let isFuzzy = false;
                        let isProf = false;

                        if (it.word === q) score = 400;
                        else if (it.word.startsWith(q)) score = 300;
                        else if (it.consonants.startsWith(qCons)) score = 200;
                        else if (fuzzyRx && fuzzyRx.test(it.consonants)) { score = 100; isFuzzy = true; }

                        //画像优化：B1/B2 级别词汇（Rank 2000-8000）获得额外权重
                        if (this.config.isProfileOptimized && it.rank >= 2000 && it.rank <= 8000) {
                            score += 50;
                            isProf = true;
                        }

                        if (score > 0) res.push({ ...it, score, isFuzzy, isProf });
                        if (res.length < 50) cursor.continue(); else finalize();
                    } else finalize();
                };
                function finalize() {
                    res.sort((a, b) => b.score - a.score || a.rank - b.rank);
                    resolve(res.slice(0, 15));
                }
            });
        }

        render(ms, q) {
            if(!ms.length) return this.close();
            this.listEl.innerHTML = ms.map((it, i) => `
                <div class="item" data-index="${i}">
                    <div class="word-box">
                        <span class="word-text">${it.word}</span>
                        <div class="badge-row">
                            <span class="badge badge-rank">Rank ${it.rank}</span>
                            ${it.isFuzzy ? '<span class="badge badge-fuzzy">Fuzzy</span>' : ''}
                            ${it.isProf ? '<span class="badge badge-profile">B1/B2 Core</span>' : ''}
                        </div>
                    </div>
                    <span class="def-text">${it.def}</span>
                </div>
            `).join('');

            this.listEl.querySelectorAll('.item').forEach(el => {
                el.onclick = () => this.select(ms[el.dataset.index].word, false);
                el.onmousemove = () => { this.activeIndex = parseInt(el.dataset.index); this.drawActive(this.listEl.querySelectorAll('.item'), false); };
            });

            this.listEl.style.display = 'block';
            if(ms[0] && ms[0].word.startsWith(q)) {
                const rem = ms[0].word.substring(q.length);
                this.ghostEl.innerHTML = `<span style="color:transparent">${q}</span>${rem}`;
            } else this.ghostEl.textContent = '';
        }

        drawActive(items, sc = true) {
            items.forEach((it, i) => {
                it.classList.toggle('active', i === this.activeIndex);
                if(i === this.activeIndex && sc) it.scrollIntoView({ block: 'nearest' });
            });
        }

        select(w, stay) {
            this.inputEl.value = w;
            if(stay) this.onInput(); else this.close();
            this.inputEl.focus();
        }

        close() { this.listEl.style.display = 'none'; this.ghostEl.textContent = ''; this.activeIndex = -1; }

        async doImport(e) {
            const files = Array.from(e.target.files);
            const csvRegex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
            for(let f of files) {
                const text = await f.text();
                const items = text.split(/\r?\n/).slice(1).map(l => {
                    const m = l.match(csvRegex);
                    if(m && m.length >= 2) {
                        const w = m[1].replace(/^"|"$/g, '').trim();
                        return { rank: parseInt(m[0])||9999, word: w, def: m[2]?m[2].replace(/^"|"$/g,''):"", consonants: w.replace(THAI_DIACRITICS, '') };
                    }
                }).filter(Boolean);
                
                const BATCH = 500;
                for (let i = 0; i < items.length; i += BATCH) {
                    await new Promise(res => {
                        const tx = this.db.transaction('vocabulary', 'readwrite');
                        items.slice(i, i + BATCH).forEach(it => tx.objectStore('vocabulary').put(it));
                        tx.oncomplete = res;
                    });
                }
            }
            this.updateDbStatus();
            alert("导入完成");
        }

        updateDbStatus() {
            if(!this.db) return;
            this.db.transaction('vocabulary','readonly').objectStore('vocabulary').count().onsuccess = (e) => {
                this.countEl.innerText = `DB: ${e.target.result}`;
            };
        }
    }
    window.ThaiSmartInput = ThaiSmartInput;
})();