/**
 * learningActivity.js
 * 
 * This file defines the learning activity framework for Thai conversation learning.
 * It provides a base class and specific implementations for different part types.
 */

class LearningActivity {
    /**
     * @param {Object} partData - Data for this specific part from scene.json
     */
    constructor(partData) {
        this.partData = partData;
        this.container = null;
        this.startTime = Date.now();
        
        // Detect language from classifier
        const classifier = this.partData.classifier || 'thai';
        if (classifier === 'spanish') {
            this.langCode = 'es';
            this.langSuffix = 'Es';
        } else {
            this.langCode = 'th';
            this.langSuffix = 'Th';
        }
        
        // Full Kedmanee Keyboard Mapping
        this.KEDMANEE = { 
            'KeyQ':'ๆ','KeyW':'ไ','KeyE':'ำ','KeyR':'พ','KeyT':'ะ','KeyY':'ั','KeyU':'ี','KeyI':'ร','KeyO':'น','KeyP':'ย','BracketLeft':'บ','BracketRight':'ล',
            'KeyA':'ฟ','KeyS':'ห','KeyD':'ก','KeyF':'ด','KeyG':'เ','KeyH':'้','KeyJ':'่','KeyK':'า','KeyL':'ส','Semicolon':'ว','Quote':'ง',
            'KeyZ':'ผ','KeyX':'ป','KeyC':'แ','KeyV':'อ','KeyB':'ิ','KeyN':'ื','KeyM':'ท','Comma':'ม','Period':'ใ','Slash':'ฝ',
            'Digit1':'ๅ','Digit2':'/','Digit3':'_','Digit4':'ภ','Digit5':'ถ','Digit6':'ู','Digit7':'ึ','Digit8':'ค','Digit9':'ต','Digit0':'จ','Minus':'ข','Equal':'ช'
        };
        this.KEDMANEE_SHIFT = { 
            'KeyQ':'๐','KeyW':'"','KeyE':'ฎ','KeyR':'ฑ','KeyT':'ธ','KeyY':'ํ','KeyU':'ี','KeyI':'ณ','KeyO':'ฯ','KeyP':'ญ','BracketLeft':'ฐ','BracketRight':',',
            'KeyA':'ฤ','KeyS':'ฆ','KeyD':'ฏ','KeyF':'โ','KeyG':'ฌ','KeyH':'็','KeyJ':'๋','KeyK':'ษ','KeyL':'ศ','Semicolon':'ซ','Quote':'.',
            'KeyZ':'(','KeyX':')','KeyC':'ฉ','KeyV':'ฮ','KeyB':'ฺ','KeyN':'์','KeyM':'?','Comma':'ฒ','Period':'ฬ','Slash':'ฦ',
            'Digit1':'+','Digit2':'๑','Digit3':'๒','Digit4':'๓','Digit5':'๔','Digit6':'ู','Digit7':'฿','Digit8':'๕','Digit9':'๖','Digit0':'๗','Minus':'๘','Equal':'๙'
        };
    }

    /**
     * Records the completion of a learning session and generates a learning record.
     * @param {Object} data - Additional data for the record (e.g., score)
     * @returns {Object} The generated learning record
     */
    checkIn(data = {}) {
        const endTime = Date.now();
        const record = {
            partId: this.partData.partId,
            partType: this.partData.partType,
            learner: "default_user", // Placeholder for actual user system
            startTime: new Date(this.startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            durationSeconds: Math.floor((endTime - this.startTime) / 1000),
            score: data.score ?? 0,
            status: "completed",
            ...data
        };
        console.log("Learning record generated (Check-in):", record);
        
        // Custom event so the app can handle the record (e.g., save to DB)
        const event = new CustomEvent('learningActivityCheckIn', { detail: record });
        window.dispatchEvent(event);
        
        return record;
    }

    /**
     * Renders the activity into the specified container.
     * @param {HTMLElement} container 
     */
    render(container) {
        this.container = container;
        this.container.innerHTML = '';
        console.log(`Rendering activity: ${this.partData.partType}`);
    }

    /**
     * Helper to speak text using Web Speech API
     * @param {string} text 
     * @param {string} lang - 'th' or 'en'
     */
    // --- Dynamic Language Getters ---
    getTargetText(obj) { return obj ? (obj[`text${this.langSuffix}`] || obj.textTh || obj.text || '') : ''; }
    getTargetWord(obj) { return obj ? (obj[`word${this.langSuffix}`] || obj.wordTh || obj.word || '') : ''; }
    getTargetExplanation(obj) { return obj ? (obj[`explanation${this.langSuffix}`] || obj.explanationTh || obj.explanation || '') : ''; }
    getTargetExample(obj) { return obj ? (obj[`example${this.langSuffix}`] || obj.exampleTh || obj.example || '') : ''; }
    getTargetValue(obj) { return obj ? (obj[`value${this.langSuffix}`] || obj.valueTh || obj.value || '') : ''; }
    getTargetAudio(obj) { return obj ? (obj[`audioUrl${this.langSuffix}`] || obj.audioUrlTh || obj.audioUrl || '') : ''; }

    speak(text, langCodeOverride = null) {
        if (!text) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            
            const targetLang = langCodeOverride || this.langCode;
            const LANG_MAP = {
                'th': 'th-TH',
                'es': 'es-ES',
                'en': 'en-US'
            };
            
            utterance.lang = LANG_MAP[targetLang] || 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("Speech synthesis not supported in this browser.");
        }
    }
}

/**
 * Standard Dialog Activity
 * Sequential playback of the dialog.
 */
class StandardDialogActivity extends LearningActivity {
    constructor(partData) {
        super(partData);
        this.currentIndex = 0;
        this.history = [];
    }

    render(container) {
        super.render(container);
        this.container.classList.add('dialog-activity', 'standard-mode');

        this.container.innerHTML = `
            <div class="activity-header">
                <h2>${this.partData.title}</h2>
                <div class="subtitle">${this.partData.title_en}</div>
            </div>
            
            <div class="chat-display" id="chatDisplay"></div>
            
            <div class="interaction-bar">
                <div id="progressInfo" class="progress-counter">进度: 1 / ${this.partData.script.length}</div>
                <div class="controls">
                    <button id="btnAction" class="btn-primary">开始对话</button>
                </div>
            </div>
        `;

        this.chatDisplay = this.container.querySelector('#chatDisplay');
        this.btnAction = this.container.querySelector('#btnAction');
        this.progressInfo = this.container.querySelector('#progressInfo');

        this.btnAction.onclick = () => this.handleAction();
        
        this.updateUI();
    }

    handleAction() {
        if (this.currentIndex < this.partData.script.length) {
            this.advance();
        } else {
            // Already finished, this button shouldn't be here in its current form
            // But we'll handle state in updateUI
        }
    }

    advance() {
        const line = this.partData.script[this.currentIndex];
        this.history.push(line);
        this.speak(this.getTargetText(line));
        this.currentIndex++;
        this.updateUI();
    }

    updateUI() {
        // Render history
        this.chatDisplay.innerHTML = this.history.map((line, idx) => `
            <div class="chat-message ${line.role} fade-in">
                <div class="message-bubble" data-idx="${idx}" style="cursor: pointer;">
                    <div class="role-name">${line.role}</div>
                    <div class="text-th target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${this.getTargetText(line)}</div>
                    <div class="text-en">${line.textEn}</div>
                </div>
            </div>
        `).join('');

        // Bind click events to replay audio
        this.chatDisplay.querySelectorAll('.message-bubble').forEach(msg => {
            msg.onclick = (e) => {
                e.stopPropagation();
                const idx = msg.dataset.idx;
                const line = this.history[idx];
                this.speak(this.getTargetText(line));
            };
        });

        const isFinished = this.currentIndex >= this.partData.script.length;
        
        if (!isFinished) {
            const pInfo = this.container.querySelector('#progressInfo');
            if (pInfo) pInfo.innerText = `进度: ${this.currentIndex + 1} / ${this.partData.script.length}`;
            
            if (this.btnAction) {
                this.btnAction.innerText = this.currentIndex === 0 ? "开始对话" : "下一句";
                this.btnAction.style.display = 'block';
            }
        } else {
            const pInfo = this.container.querySelector('#progressInfo');
            if (pInfo) pInfo.innerText = "✨ 对话已完成";
            this.renderCompletionControls();
        }

        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
    }

    renderCompletionControls() {
        const controls = this.container.querySelector('.controls');
        controls.innerHTML = `
            <button id="btnRedo" class="btn-secondary">重新开始 (Redo)</button>
            <button id="btnCheckIn" class="btn-primary">完成打卡 (Check-in)</button>
        `;
        
        document.getElementById('btnRedo').onclick = () => {
            this.currentIndex = 0;
            this.history = [];
            this.startTime = Date.now();
            this.render(this.container);
        };
        
        document.getElementById('btnCheckIn').onclick = () => {
            this.checkIn({ score: 100 });
            // Optionally disable buttons or show final state
            document.getElementById('btnCheckIn').disabled = true;
            document.getElementById('btnRedo').disabled = true;
        };
    }
}

/**
 * Role Play Dialog Activity
 * Multi-round practice where the user plays each role.
 */
class RolePlayDialogActivity extends LearningActivity {
    constructor(partData) {
        super(partData);
        this.currentIndex = 0;
        this.history = [];
        this.roles = this.partData.roles.map(r => r.id);
        this.currentRoleIdx = 0;
        this.userRole = this.roles[this.currentRoleIdx];
        this.isRevealed = false;
    }

    render(container) {
        super.render(container);
        this.container.classList.add('dialog-activity', 'role-play-mode');
        
        this.container.innerHTML = `
            <div class="activity-header">
                <h2>${this.partData.title}</h2>
                <div class="subtitle">${this.partData.title_en} (角色扮演: <span id="roleDisplay"></span>)</div>
            </div>
            
            <div class="chat-display" id="chatDisplay"></div>
            
            <div class="interaction-bar">
                <div id="progressInfo" class="progress-counter">进度: 1 / ${this.partData.script.length}</div>
                <div id="lineHint" class="line-hint"></div>
                <div class="controls" id="controls">
                    <button id="btnAction" class="btn-primary">开始练习</button>
                </div>
            </div>
        `;

        this.chatDisplay = this.container.querySelector('#chatDisplay');
        this.btnAction = this.container.querySelector('#btnAction');
        this.roleDisplay = this.container.querySelector('#roleDisplay');
        this.lineHint = this.container.querySelector('#lineHint');
        this.controls = this.container.querySelector('#controls');

        this.updateUI();
    }

    updateUI() {
        this.roleDisplay.innerText = this.userRole === 'waiter' ? '服务员' : '顾客';
        
        // Render history
        this.chatDisplay.innerHTML = this.history.map((line, idx) => {
            const isUserRole = line.role === this.userRole;
            const showThai = !isUserRole || (isUserRole && idx < this.history.length - 1) || (isUserRole && this.isRevealed);
            
            const targetText = this.getTargetText(line);
            return `
                <div class="chat-message ${line.role} fade-in">
                    <div class="message-bubble ${isUserRole ? 'user-target' : ''}" data-idx="${idx}" style="cursor: pointer;">
                        <div class="role-name">${line.role} ${isUserRole ? '(你)' : ''}</div>
                        <div class="text-th target-text" style="display: ${showThai ? 'block' : 'none'}; font-family: var(--target-font, 'Noto Serif Thai', serif);">${targetText}</div>
                        <div class="text-en">${line.textEn}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Replay audio on click
        this.chatDisplay.querySelectorAll('.message-bubble').forEach(bubble => {
            bubble.onclick = () => {
                const idx = bubble.dataset.idx;
                const line = this.history[idx];
                // Only allow playing if revealed or not user role
                if (line.role !== this.userRole || this.isRevealed || idx < this.history.length - 1) {
                    this.speak(this.getTargetText(line));
                }
            };
        });

        const isFinished = this.currentIndex >= this.partData.script.length;
        const currentLine = this.partData.script[this.currentIndex];
        const pInfo = this.container.querySelector('#progressInfo');
        if (pInfo) pInfo.innerText = `进度: ${this.currentIndex + 1} / ${this.partData.script.length}`;

        if (!isFinished) {
            const isUserTurn = currentLine.role === this.userRole;
            
            if (isUserTurn) {
                if (!this.isRevealed) {
                    this.lineHint.innerHTML = `<strong>请说出这句台词 (泰语):</strong><br><span style="font-size:1.2rem">${currentLine.textEn}</span>`;
                    this.controls.innerHTML = `<button id="btnReveal" class="btn-primary">点击揭晓 & 播放</button>`;
                    document.getElementById('btnReveal').onclick = () => {
                        this.isRevealed = true;
                        this.speak(this.getTargetText(currentLine));
                        this.updateUI();
                    };
                } else {
                    this.lineHint.innerHTML = `<strong>正确表达:</strong><br><span class="text-th target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${this.getTargetText(currentLine)}</span>`;
                    this.controls.innerHTML = `<button id="btnNext" class="btn-primary">下一句</button>`;
                    document.getElementById('btnNext').onclick = () => this.advance();
                }
            } else {
                // System turn
                this.lineHint.innerHTML = `<strong>系统 (${currentLine.role}):</strong><br>${currentLine.textEn}`;
                this.controls.innerHTML = `<button id="btnNext" class="btn-primary">${this.currentIndex === 0 ? '开始' : '下一句'}</button>`;
                document.getElementById('btnNext').onclick = () => this.advance();
            }
        } else {
            this.renderCompletionControls();
        }

        this.chatDisplay.scrollTop = this.chatDisplay.scrollHeight;
    }

    advance() {
        const line = this.partData.script[this.currentIndex];
        this.history.push(line);
        
        // Auto-speak if it's system turn
        if (line.role !== this.userRole) {
            this.speak(this.getTargetText(line));
        }
        
        this.currentIndex++;
        this.isRevealed = false;
        this.updateUI();
    }

    renderCompletionControls() {
        const isLastRound = this.currentRoleIdx >= this.roles.length - 1;
        
        if (!isLastRound) {
            this.lineHint.innerHTML = `✨ 这一轮练习已完成！准备好扮演下一个角色了吗？`;
            this.controls.innerHTML = `<button id="btnNextRound" class="btn-primary">进入下一轮 (扮演 ${this.roles[this.currentRoleIdx+1]})</button>`;
            document.getElementById('btnNextRound').onclick = () => {
                this.currentRoleIdx++;
                this.userRole = this.roles[this.currentRoleIdx];
                this.currentIndex = 0;
                this.history = [];
                this.render(this.container);
            };
        } else {
            this.lineHint.innerHTML = `🏆 所有角色练习已完成！`;
            this.controls.innerHTML = `
                <button id="btnRedo" class="btn-secondary">重新开始</button>
                <button id="btnCheckIn" class="btn-primary">完成打卡</button>
            `;
            
            document.getElementById('btnRedo').onclick = () => {
                this.currentRoleIdx = 0;
                this.userRole = this.roles[0];
                this.currentIndex = 0;
                this.history = [];
                this.render(this.container);
            };
            
            document.getElementById('btnCheckIn').onclick = () => this.showScoringUI();
        }
    }

    showScoringUI() {
        this.lineHint.innerHTML = `请为自己的表现打分 (0-5):`;
        this.controls.innerHTML = `
            <div class="scoring-container">
                ${[0,1,2,3,4,5].map(s => `<button class="btn-score" onclick="ActivityFactory.activeActivity.submitScore(${s})">${s}</button>`).join('')}
            </div>
        `;
    }

    submitScore(score) {
        this.checkIn({ score: score * 20 }); // Scale to 0-100
        this.lineHint.innerHTML = `✅ 已成功打卡！得分: ${score}`;
        this.controls.innerHTML = `<button class="btn-secondary" onclick="ActivityFactory.activeActivity.render(ActivityFactory.activeActivity.container)">返回</button>`;
    }
}

/**
 * Vocabulary Activity Flashcards
 */
class VocabularyActivity extends LearningActivity {
    constructor(partData) {
        super(partData);
        this.isFirstRound = true;
        this.firstRoundScore = 0;
        this.initDeck();
    }

    initDeck() {
        const items = this.partData.items || [];
        this.cards = [];
        
        items.forEach(item => {
            const targetWord = this.getTargetWord(item);
            const targetExplanation = this.getTargetExplanation(item);
            
            // Card 1: Target -> En
            this.cards.push({
                type: 'Target2En',
                frontText: `<span class="target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${targetWord}</span>`,
                frontAudio: targetWord,
                frontLang: this.langCode,
                backText: `<strong>${item.wordEn}</strong><br><span style="font-size:0.9rem;opacity:0.8;display:block;margin-top:8px;">${item.explanationEn || ''}</span><br><span class="target-text" style="font-size:1.1rem;font-family: var(--target-font, 'Noto Serif Thai', serif);margin-top:8px;display:block;color:var(--text-muted);">${targetExplanation}</span>`,
                backAudio: null, 
                backLang: 'en',
                wordId: item.wordId
            });

            // Card 2: En -> Target
            this.cards.push({
                type: 'En2Target',
                frontText: `<strong>${item.wordEn}</strong><br><span style="font-size:0.9rem;opacity:0.8;display:block;margin-top:8px;">${item.explanationEn || ''}</span>`,
                frontAudio: null,
                frontLang: 'en',
                backText: `<span class="target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${targetWord}</span><br><span class="target-text" style="font-size:1.1rem;font-family: var(--target-font, 'Noto Serif Thai', serif);margin-top:16px;display:block;color:var(--text-muted);">${targetExplanation}</span>`,
                backAudio: targetWord,
                backLang: this.langCode,
                wordId: item.wordId
            });
        });

        this.shuffle(this.cards);
        this.currentIndex = 0;
        this.scores = [];
        this.isFlipped = false;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    render(container) {
        super.render(container);
        this.container.classList.add('vocabulary-activity');
        
        // Inject CSS specific for flashcards if not already present
        if (!document.getElementById('vocab-styles')) {
            const style = document.createElement('style');
            style.id = 'vocab-styles';
            style.innerHTML = `
                .flashcard-container {
                    perspective: 1000px;
                    width: 100%;
                    max-width: 500px;
                    margin: 20px auto;
                    height: 300px;
                    cursor: pointer;
                }
                .flashcard {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    text-align: center;
                    transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
                    transform-style: preserve-3d;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    border-radius: 24px;
                }
                .flashcard.flipped {
                    transform: rotateY(180deg);
                }
                .flashcard-face {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    border-radius: 24px;
                    background: white;
                    border: 2px solid #e2e8f0;
                    padding: 30px;
                    box-sizing: border-box;
                }
                .flashcard-back {
                    transform: rotateY(180deg);
                    background: #f8fafc;
                }
                .card-text {
                    font-size: 2.5rem;
                    font-family: 'Noto Serif Thai', serif;
                    margin-bottom: 20px;
                    word-wrap: break-word;
                    max-width: 100%;
                    line-height: 1.3;
                }
                .audio-btn {
                    background: #f1f5f9;
                    border: none;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.2s;
                    margin-top: 10px;
                }
                .audio-btn:hover {
                    background: #e2e8f0;
                    transform: scale(1.1);
                }
                .rating-container {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 30px;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.4s ease;
                    pointer-events: none;
                }
                .rating-container.visible {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
                .rating-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    border: 2px solid var(--primary);
                    background: white;
                    color: var(--primary);
                    font-weight: 700;
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rating-btn:hover {
                    background: var(--primary);
                    color: white;
                    transform: translateY(-5px);
                }
                .rating-hint {
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    margin-top: 10px;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }
                .click-hint {
                    position: absolute;
                    bottom: 20px;
                    font-size: 0.9rem;
                    color: #94a3b8;
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.innerHTML = `
            <div class="activity-header">
                <h2>${this.partData.title}</h2>
                <div class="subtitle">${this.partData.title_en}</div>
            </div>
            
            <div class="interaction-bar" style="display:flex; justify-content:center; align-items:center; margin-bottom: 20px; background: transparent; padding-top: 0;">
                <div id="progressInfo" class="progress-counter" style="font-size: 1.2rem; font-weight: 600; color: var(--primary);">进度: 1 / ${this.cards.length}</div>
            </div>

            <div id="cardStage"></div>
        `;

        this.updateUI();
    }

    updateUI() {
        const stage = this.container.querySelector('#cardStage');
        
        if (this.currentIndex >= this.cards.length) {
            this.renderCompletionControls(stage);
            return;
        }

        const card = this.cards[this.currentIndex];
        this.isFlipped = false;
        
        const pInfo = this.container.querySelector('#progressInfo');
        if (pInfo) pInfo.innerText = `进度: ${this.currentIndex + 1} / ${this.cards.length}`;

        stage.innerHTML = `
            <div class="flashcard-container" id="fcContainer">
                <div class="flashcard" id="fcElement">
                    <!-- FRONT -->
                    <div class="flashcard-face">
                        <div class="card-text">${card.frontText}</div>
                        ${card.frontAudio ? `<button class="audio-btn" onclick="event.stopPropagation(); window.ActivityFactory.activeActivity.speak('${card.frontAudio}', '${card.frontLang}')">🔊</button>` : ''}
                        <div class="click-hint">点击翻开卡片</div>
                    </div>
                    <!-- BACK -->
                    <div class="flashcard-face flashcard-back">
                        <div class="card-text">${card.backText}</div>
                        ${card.backAudio ? `<button class="audio-btn" onclick="event.stopPropagation(); window.ActivityFactory.activeActivity.speak('${card.backAudio}', '${card.backLang}')">🔊</button>` : ''}
                    </div>
                </div>
            </div>

            <div class="rating-container" id="ratingContainer">
                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(1)" title="完全不会">1</button>
                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(2)" title="比较生疏">2</button>
                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(3)" title="模棱两可">3</button>
                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(4)" title="基本认识">4</button>
                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(5)" title="非常熟悉">5</button>
            </div>
            <div class="rating-hint" id="ratingHint">请根据熟悉程度打分 (1=完全不会, 5=非常熟悉)</div>
        `;

        const fcContainer = stage.querySelector('#fcContainer');
        const fcElement = stage.querySelector('#fcElement');
        const ratingContainer = stage.querySelector('#ratingContainer');
        const ratingHint = stage.querySelector('#ratingHint');

        // Auto-play front audio if Thai
        if (card.frontAudio && card.frontLang === 'th') {
            setTimeout(() => this.speak(card.frontAudio, card.frontLang), 300);
        }

        fcContainer.onclick = () => {
            if (!this.isFlipped) {
                this.isFlipped = true;
                fcElement.classList.add('flipped');
                ratingContainer.classList.add('visible');
                ratingHint.style.opacity = 1;

                // Play back audio if Thai
                if (card.backAudio && card.backLang === 'th') {
                    setTimeout(() => this.speak(card.backAudio, card.backLang), 500);
                }
            }
        };
    }

    submitScore(rating) {
        this.scores.push(rating);
        this.currentIndex++;
        this.updateUI();
    }

    renderCompletionControls(stage) {
        const sum = this.scores.reduce((a, b) => a + b, 0);
        const avgRating = this.scores.length > 0 ? (sum / this.scores.length) : 0;
        
        const finalScore = Math.round(avgRating * 20);

        if (this.isFirstRound) {
            this.firstRoundScore = finalScore;
            this.isFirstRound = false;
        }

        stage.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                <h3 style="font-size: 2rem; color: var(--primary); margin-bottom: 20px;">🎉 学习完成！</h3>
                <p style="font-size: 1.2rem; color: var(--text-muted); margin-bottom: 10px;">平均熟悉度评分: <strong>${avgRating.toFixed(1)} / 5.0</strong></p>
                <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 40px;">打卡折算得分: <strong>${this.firstRoundScore} 分</strong> <span style="font-size:0.9rem;">(首轮分数)</span></p>
                
                <div style="display:flex; justify-content:center; gap: 20px;">
                    <button id="btnRedo" style="padding: 12px 24px; border-radius: 12px; border: 2px solid #e2e8f0; font-weight: 600; cursor: pointer; background: white; color: var(--text-muted); transition: all 0.2s;">重新练习 (Redo)</button>
                    <button id="btnCheckIn" class="btn-primary" style="padding: 12px 24px; border-radius: 12px; font-weight: 600;">完成打卡 (Check-in)</button>
                </div>
            </div>
        `;

        document.getElementById('btnRedo').onclick = () => {
            this.initDeck(); // Reshuffle and reset state
            this.updateUI();
        };

        document.getElementById('btnCheckIn').onclick = () => {
            this.checkIn({ score: this.firstRoundScore });
            document.getElementById('btnCheckIn').disabled = true;
            document.getElementById('btnRedo').disabled = true;
        };
    }
}

/**
 * Grammar Activity
 */
class GrammarActivity extends LearningActivity {
    constructor(partData) {
        super(partData);
        this.items = this.partData.items || [];
        this.currentIndex = 0;
        this.isCompleted = false;
        this.scoreSubmitted = false;
        this.finalRating = 0;
    }

    // Strip markdown formatting for TTS
    cleanAudioText(text) {
        if (!text) return '';
        return text.replace(/\*\*/g, '');
    }

    // Convert markdown to HTML for display
    formatMarkdown(text) {
        if (!text) return '';
        return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--primary);">$1</strong>');
    }

    render(container) {
        super.render(container);
        this.container.classList.add('grammar-activity');
        
        if (!document.getElementById('grammar-styles')) {
            const style = document.createElement('style');
            style.id = 'grammar-styles';
            style.innerHTML = `
                .grammar-card {
                    background: white;
                    border-radius: 24px;
                    border: 2px solid #e2e8f0;
                    padding: 32px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    margin: 20px auto;
                    max-width: 600px;
                    text-align: left;
                    animation: fadeIn 0.4s ease-out;
                }
                .grammar-title {
                    font-size: 1.8rem;
                    color: var(--text-main);
                    margin-bottom: 8px;
                    font-weight: 700;
                    font-family: 'Noto Serif Thai', serif;
                }
                .grammar-title-en {
                    font-size: 1rem;
                    color: var(--text-muted);
                    margin-bottom: 24px;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 16px;
                }
                .grammar-explanation {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    color: var(--text-main);
                    margin-bottom: 12px;
                    font-family: 'Noto Serif Thai', serif;
                }
                .grammar-explanation-en {
                    font-size: 1rem;
                    color: var(--text-muted);
                    margin-bottom: 24px;
                }
                .grammar-example-box {
                    background: #f8fafc;
                    border-left: 4px solid var(--primary);
                    padding: 20px;
                    border-radius: 0 16px 16px 0;
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .grammar-example-content {
                    flex: 1;
                    padding-right: 16px;
                }
                .grammar-example-th {
                    font-size: 1.4rem;
                    color: var(--text-main);
                    margin-bottom: 8px;
                    font-family: 'Noto Serif Thai', serif;
                }
                .grammar-example-en {
                    font-size: 0.95rem;
                    color: var(--text-muted);
                }
                .audio-btn-sm {
                    background: #e0e7ff;
                    color: var(--primary);
                    border: none;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    font-size: 1.2rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .audio-btn-sm:hover {
                    background: var(--primary);
                    color: white;
                    transform: scale(1.1);
                }
                .grammar-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 2px solid #f1f5f9;
                }
                .nav-btn {
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .nav-btn.prev {
                    background: white;
                    border: 2px solid #e2e8f0;
                    color: var(--text-muted);
                }
                .nav-btn.prev:hover:not(:disabled) {
                    background: #f1f5f9;
                    color: var(--text-main);
                }
                .nav-btn.next {
                    background: var(--primary);
                    border: 2px solid var(--primary);
                    color: white;
                }
                .nav-btn.next:hover {
                    background: var(--primary-hover);
                }
                .nav-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .completion-panel {
                    margin-top: 24px;
                    padding: 24px;
                    background: #fef2f2;
                    border: 2px solid #fecaca;
                    border-radius: 16px;
                    text-align: center;
                    animation: fadeIn 0.4s ease-out;
                }
                .completion-panel.success {
                    background: #ecfdf5;
                    border-color: #a7f3d0;
                }
                .completion-panel h3 {
                    color: #b91c1c;
                    margin-bottom: 16px;
                    font-size: 1.2rem;
                }
                .completion-panel.success h3 {
                    color: #047857;
                    margin-bottom: 0;
                }
            `;
            document.head.appendChild(style);
        }

        this.container.innerHTML = `
            <div class="activity-header">
                <h2>${this.partData.title}</h2>
                <div class="subtitle">${this.partData.title_en}</div>
            </div>
            
            <div class="interaction-bar" style="display:flex; justify-content:center; align-items:center; margin-bottom: 10px; background: transparent; padding-top: 0;">
                <div id="progressInfo" class="progress-counter" style="font-size: 1.2rem; font-weight: 600; color: var(--primary);"></div>
            </div>

            <div id="grammarStage"></div>
        `;

        this.updateUI();
    }

    updateUI() {
        const stage = this.container.querySelector('#grammarStage');
        const pInfo = this.container.querySelector('#progressInfo');
        
        if (!this.items || this.items.length === 0) {
            stage.innerHTML = `<div class="skeleton-placeholder">暂无语法点数据</div>`;
            return;
        }

        const item = this.items[this.currentIndex];
        pInfo.innerText = `进度: ${this.currentIndex + 1} / ${this.items.length}`;

        const isFirst = this.currentIndex === 0;
        const isLast = this.currentIndex === this.items.length - 1;

        let exampleHtml = '';
        const targetExample = this.getTargetExample(item);
        if (targetExample || item.exampleEn) {
            const cleanAudio = this.cleanAudioText(targetExample);
            // Replace single quotes in audio string to avoid breaking HTML inline handlers
            const safeAudio = (cleanAudio || '').replace(/'/g, "\\'");
            
            exampleHtml = `
                <div class="grammar-example-box">
                    <div class="grammar-example-content">
                        <div class="grammar-example-th target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${this.formatMarkdown(targetExample)}</div>
                        <div class="grammar-example-en">${item.exampleEn || ''}</div>
                    </div>
                    ${targetExample ? `<button class="audio-btn-sm" onclick="window.ActivityFactory.activeActivity.speak('${safeAudio}')" title="播放例句">🔊</button>` : ''}
                </div>
            `;
        }

        let completionHtml = '';
        if (this.isCompleted && isLast) {
            if (!this.scoreSubmitted) {
                completionHtml = `
                    <div class="completion-panel" id="completionPanel">
                        <h3>🎉 你已学完本节语法，请对掌握程度打分：</h3>
                        <div class="rating-container" style="opacity:1; transform:none; pointer-events:auto; margin-top:16px;">
                            <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(1)" title="完全不懂">1</button>
                            <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(2)" title="一知半解">2</button>
                            <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(3)" title="大致理解">3</button>
                            <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(4)" title="基本掌握">4</button>
                            <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(5)" title="完全熟练">5</button>
                        </div>
                    </div>
                `;
            } else {
                completionHtml = `
                    <div class="completion-panel success">
                        <h3>✅ 已完成打卡，你的评分为 ${this.finalRating} / 5 </h3>
                    </div>
                `;
            }
        }

        stage.innerHTML = `
            <div class="grammar-card" id="grammarCard">
                <div class="grammar-title">${item.title}</div>
                <div class="grammar-title-en">${item.title_en || ''}</div>
                
                <div class="grammar-explanation target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${this.getTargetExplanation(item)}</div>
                <div class="grammar-explanation-en">${item.explanationEn || ''}</div>
                
                ${exampleHtml}
                
                <div class="grammar-nav">
                    <button class="nav-btn prev" id="btnPrev" ${isFirst ? 'disabled' : ''}>⬅️ 前翻复习</button>
                    <button class="nav-btn next" id="btnNext">${isLast && !this.isCompleted ? '完成学习 ✅' : (isLast ? '已到达最后' : '下一条 ➡️')}</button>
                </div>

                ${completionHtml}
            </div>
        `;

        document.getElementById('btnPrev').onclick = () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateUI();
            }
        };

        const btnNext = document.getElementById('btnNext');
        if (isLast) {
            if (this.isCompleted) {
                btnNext.disabled = true;
            } else {
                btnNext.onclick = () => {
                    this.isCompleted = true;
                    this.updateUI();
                    
                    // Scroll to completion panel
                    setTimeout(() => {
                        const panel = document.getElementById('completionPanel');
                        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                };
            }
        } else {
            btnNext.onclick = () => {
                this.currentIndex++;
                this.updateUI();
            };
        }
    }

    submitScore(rating) {
        this.finalRating = rating;
        this.scoreSubmitted = true;
        
        // Scale 1-5 to 0-100
        const finalScore = rating * 20;
        this.checkIn({ score: finalScore });
        
        this.updateUI();
    }
}

/**
 * Substitution Drills Activity
 */
class SubstitutionDrillsActivity extends LearningActivity {
    constructor(partData) {
        super(partData);
        this.drills = this.partData.drills || [];
        this.currentIndex = 0;
        
        // Track state for the current drill
        this.filledSlots = {}; 
        
        // Final completion flags
        this.isCompleted = false;
        this.scoreSubmitted = false;
        this.finalRating = 0;
    }

    render(container) {
        super.render(container);
        this.container.classList.add('drills-activity');
        
        if (!document.getElementById('drills-styles')) {
            const style = document.createElement('style');
            style.id = 'drills-styles';
            style.innerHTML = `
                .drill-card {
                    background: white;
                    border-radius: 24px;
                    border: 2px solid #e2e8f0;
                    padding: 32px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
                    margin: 20px auto;
                    max-width: 600px;
                    text-align: center;
                    animation: fadeIn 0.4s ease-out;
                }
                .drill-sentence-container {
                    font-size: 1.6rem;
                    line-height: 2;
                    margin: 30px 0;
                    font-family: 'Noto Serif Thai', serif;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                }
                .drill-text-span {
                    color: var(--text-main);
                }
                .slot-zone {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 80px;
                    height: 48px;
                    padding: 0 16px;
                    border: 2px dashed #94a3b8;
                    border-radius: 12px;
                    background: #f8fafc;
                    color: #94a3b8;
                    font-size: 1.2rem;
                    font-family: 'Inter', sans-serif;
                    transition: all 0.2s;
                    vertical-align: middle;
                }
                .slot-zone.drag-over {
                    background: #e0e7ff;
                    border-color: var(--primary);
                    border-style: solid;
                }
                .slot-zone.filled {
                    border-style: solid;
                    border-color: var(--primary);
                    background: var(--primary);
                    color: white;
                    font-family: 'Noto Serif Thai', serif;
                    font-size: 1.4rem;
                    box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
                }
                .substitutions-panel {
                    margin-top: 40px;
                    padding-top: 30px;
                    border-top: 2px solid #f1f5f9;
                }
                .tokens-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    justify-content: center;
                    min-height: 80px;
                }
                .draggable-token {
                    background: white;
                    border: 2px solid #cbd5e1;
                    border-radius: 16px;
                    padding: 12px 24px;
                    cursor: grab;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: all 0.2s;
                    user-select: none;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .draggable-token:hover {
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }
                .draggable-token:active {
                    cursor: grabbing;
                }
                .draggable-token.used {
                    opacity: 0.3;
                    pointer-events: none;
                    filter: grayscale(100%);
                }
                .token-th {
                    font-size: 1.4rem;
                    font-family: 'Noto Serif Thai', serif;
                    color: var(--text-main);
                    font-weight: bold;
                }
                .token-en {
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-top: 4px;
                }
                .drill-result {
                    margin-top: 20px;
                    padding: 24px;
                    background: #ecfdf5;
                    border-radius: 16px;
                    border: 2px solid #10b981;
                    animation: fadeIn 0.4s ease-out;
                }
                .drill-result-th {
                    font-size: 1.8rem;
                    color: #047857;
                    font-family: 'Noto Serif Thai', serif;
                    margin-bottom: 8px;
                    font-weight: 700;
                }
                .drill-result-en {
                    font-size: 1rem;
                    color: #065f46;
                    opacity: 0.8;
                }
                .result-actions {
                    margin-top: 16px;
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                }
                .audio-btn-lg {
                    background: white;
                    color: var(--primary);
                    border: 2px solid var(--primary);
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.2s;
                }
                .audio-btn-lg:hover {
                    background: var(--primary);
                    color: white;
                    transform: scale(1.1);
                }
                
                .completion-panel {
                    margin-top: 24px;
                    padding: 24px;
                    background: #fef2f2;
                    border: 2px solid #fecaca;
                    border-radius: 16px;
                    text-align: center;
                    animation: fadeIn 0.4s ease-out;
                }
                .completion-panel.success {
                    background: #ecfdf5;
                    border-color: #a7f3d0;
                }
                .completion-panel h3 {
                    color: #b91c1c;
                    margin-bottom: 16px;
                    font-size: 1.2rem;
                }
                .completion-panel.success h3 {
                    color: #047857;
                    margin-bottom: 0;
                }
                .rating-container {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                }
                .rating-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 2px solid var(--primary);
                    background: white;
                    color: var(--primary);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rating-btn:hover {
                    background: var(--primary);
                    color: white;
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(style);
        }

        this.container.innerHTML = `
            <div class="activity-header">
                <h2>${this.partData.title}</h2>
                <div class="subtitle">${this.partData.title_en}</div>
            </div>
            
            <div class="interaction-bar" style="display:flex; justify-content:center; align-items:center; margin-bottom: 10px; background: transparent; padding-top: 0;">
                <div id="progressInfo" class="progress-counter" style="font-size: 1.2rem; font-weight: 600; color: var(--primary);"></div>
            </div>

            <div id="drillStage"></div>
        `;

        this.updateUI();
    }

    updateUI() {
        const stage = this.container.querySelector('#drillStage');
        const pInfo = this.container.querySelector('#progressInfo');
        
        if (!this.drills || this.drills.length === 0) {
            stage.innerHTML = `<div class="skeleton-placeholder">暂无练习数据</div>`;
            return;
        }

        const drill = this.drills[this.currentIndex];
        pInfo.innerText = `进度: ${this.currentIndex + 1} / ${this.drills.length}`;

        const isLastDrill = this.currentIndex === this.drills.length - 1;

        // Parse Template: split "ขอ{{food}}หนึ่ง{{classifier}}ครับ" into parts
        const templateText = this.getTargetText(drill.template);
        const regex = /\{\{(.*?)\}\}/g;
        let lastIndex = 0;
        let sentenceHtml = '';
        let match;
        
        let expectedSlotsCount = 0;

        while ((match = regex.exec(templateText)) !== null) {
            // Text before the slot
            if (match.index > lastIndex) {
                sentenceHtml += `<span class="drill-text-span">${templateText.substring(lastIndex, match.index)}</span>`;
            }
            // The slot
            const slotName = match[1];
            expectedSlotsCount++;
            
            if (this.filledSlots[slotName]) {
                // If already filled, show the value
                sentenceHtml += `<div class="slot-zone filled" data-slot="${slotName}">${this.getTargetValue(this.filledSlots[slotName])}</div>`;
            } else {
                // Empty drop zone
                sentenceHtml += `<div class="slot-zone" data-slot="${slotName}" id="slot-${slotName}">?</div>`;
            }
            lastIndex = regex.lastIndex;
        }
        // Text after last slot
        if (lastIndex < templateText.length) {
            sentenceHtml += `<span class="drill-text-span">${templateText.substring(lastIndex)}</span>`;
        }

        // Render Tokens
        let tokensHtml = '';
        const substitutions = drill.substitutions || [];
        substitutions.forEach(sub => {
            // Check if this token was used
            const isUsed = Object.values(this.filledSlots).some(filled => filled.itemId === sub.itemId);
            
            tokensHtml += `
                <div class="draggable-token ${isUsed ? 'used' : ''}" 
                     draggable="${!isUsed}" 
                     data-itemid="${sub.itemId}" 
                     data-slotname="${sub.slotName}"
                     data-valuetarget="${this.getTargetValue(sub)}"
                     id="token-${sub.itemId}">
                    <div class="token-th target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${this.getTargetValue(sub)}</div>
                    <div class="token-en">${sub.valueEn || ''}</div>
                </div>
            `;
        });

        // Check if drill is fully answered
        const isDrillFinished = Object.keys(this.filledSlots).length === expectedSlotsCount && expectedSlotsCount > 0;

        let resultHtml = '';
        if (isDrillFinished) {
            const resultText = this.getTargetText(drill.drilledSentence);
            const safeAudio = (resultText || '').replace(/'/g, "\\'");
            
            resultHtml = `
                <div class="drill-result">
                    <div class="drill-result-th target-text" style="font-family: var(--target-font, 'Noto Serif Thai', serif);">${resultText}</div>
                    <div class="drill-result-en">${drill.drilledSentence.textEn || ''}</div>
                    <div class="result-actions">
                        <button class="audio-btn-lg" onclick="window.ActivityFactory.activeActivity.speak('${safeAudio}')" title="播放完整句子">🔊</button>
                    </div>
                </div>
            `;
            
            // Add navigation/completion
            if (isLastDrill) {
                if (!this.scoreSubmitted) {
                    resultHtml += `
                        <div class="completion-panel" id="completionPanel">
                            <h3>🎉 替换练习全部完成，请对掌握程度打分：</h3>
                            <div class="rating-container" style="margin-top:16px;">
                                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(1)">1</button>
                                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(2)">2</button>
                                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(3)">3</button>
                                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(4)">4</button>
                                <button class="rating-btn" onclick="window.ActivityFactory.activeActivity.submitScore(5)">5</button>
                            </div>
                        </div>
                    `;
                } else {
                    resultHtml += `
                        <div class="completion-panel success">
                            <h3>✅ 已完成打卡，你的评分为 ${this.finalRating} / 5 </h3>
                        </div>
                    `;
                }
            } else {
                resultHtml += `
                    <div style="margin-top: 24px; text-align: center;">
                        <button class="btn-primary" style="font-size:1.2rem; padding: 16px 32px;" onclick="window.ActivityFactory.activeActivity.nextDrill()">下一题 ➡️</button>
                    </div>
                `;
            }
        }

        stage.innerHTML = `
            <div class="drill-card">
                <div style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 8px;">请拖动下方词语到对应的空位：</div>
                <div style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 24px;">${drill.template.textEn || ''}</div>
                
                <div class="drill-sentence-container">
                    ${sentenceHtml}
                </div>
                
                ${!isDrillFinished ? `
                    <div class="substitutions-panel">
                        <div class="tokens-container">
                            ${tokensHtml}
                        </div>
                    </div>
                ` : ''}

                ${resultHtml}
            </div>
        `;

        this.attachDragEvents();
        
        // Auto-scroll to completion if needed
        if (isDrillFinished && isLastDrill && !this.scoreSubmitted) {
            setTimeout(() => {
                const panel = document.getElementById('completionPanel');
                if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }

    attachDragEvents() {
        const tokens = this.container.querySelectorAll('.draggable-token:not(.used)');
        const slots = this.container.querySelectorAll('.slot-zone:not(.filled)');

        // Token Drag Start
        tokens.forEach(token => {
            token.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    itemId: token.dataset.itemid,
                    slotName: token.dataset.slotname,
                    valueTarget: token.dataset.valuetarget
                }));
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => token.style.opacity = '0.5', 0);
            });
            token.addEventListener('dragend', (e) => {
                token.style.opacity = '1';
            });
        });

        // Slot Drag Over & Drop
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault(); // allow drop
                e.dataTransfer.dropEffect = 'move';
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', (e) => {
                slot.classList.remove('drag-over');
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');

                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const targetSlotName = slot.dataset.slot;

                    // Validate if the token's slotName matches the drop zone's data-slot
                    if (data.slotName === targetSlotName) {
                        // Success! Fill the slot
                        this.filledSlots[targetSlotName] = {
                            itemId: data.itemId
                        };
                        // We need to store the value back into filledSlots if we want to show it in updateUI
                        // Since we are using getTargetValue on the token data, let's just store the value directly or re-fetch it.
                        // Simplified: store it in a way that getTargetValue can read it.
                        this.filledSlots[targetSlotName][`value${this.langSuffix}`] = data.valueTarget;
                        
                        this.updateUI();
                    } else {
                        // Wrong slot! Visual shake effect
                        slot.style.animation = 'shake 0.4s';
                        setTimeout(() => slot.style.animation = '', 400);
                    }
                } catch (err) {
                    console.error("Drop error", err);
                }
            });
        });

        // Add shake keyframes if not exists
        if (!document.getElementById('shake-keyframes')) {
            const style = document.createElement('style');
            style.id = 'shake-keyframes';
            style.innerHTML = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-5px); border-color: #ef4444; color: #ef4444; }
                    40%, 80% { transform: translateX(5px); border-color: #ef4444; color: #ef4444; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    nextDrill() {
        if (this.currentIndex < this.drills.length - 1) {
            this.currentIndex++;
            this.filledSlots = {}; // Reset slots for the new drill
            this.updateUI();
        }
    }

    submitScore(rating) {
        this.finalRating = rating;
        this.scoreSubmitted = true;
        this.isCompleted = true;
        
        // Scale 1-5 to 0-100
        const finalScore = rating * 20;
        this.checkIn({ score: finalScore });
        
        this.updateUI();
    }
}

/**
 * Factory class to create activities
 */
class ActivityFactory {
    static activeActivity = null;

    static create(partData) {
        let activity;
        switch (partData.partType) {
            case 'standardDialog':
                activity = new StandardDialogActivity(partData);
                break;
            case 'vocabulary':
                activity = new VocabularyActivity(partData);
                break;
            case 'grammar':
                activity = new GrammarActivity(partData);
                break;
            case 'substitutionDrills':
                activity = new SubstitutionDrillsActivity(partData);
                break;
            default:
                activity = new LearningActivity(partData);
        }
        ActivityFactory.activeActivity = activity;
        return activity;
    }
}

// Export to global scope
window.LearningActivity = LearningActivity;
window.StandardDialogActivity = StandardDialogActivity;
window.RolePlayDialogActivity = RolePlayDialogActivity;
window.VocabularyActivity = VocabularyActivity;
window.GrammarActivity = GrammarActivity;
window.SubstitutionDrillsActivity = SubstitutionDrillsActivity;
window.ActivityFactory = ActivityFactory;
