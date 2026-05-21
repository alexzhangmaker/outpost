/**
 * thaiQuizActivity.js
 * 
 * Quiz Engine framework for Thai vocabulary quizzes.
 * Provides a base class QuizEngine and a concrete MultiChoiceQuizEngine implementation.
 */

// ─── QuizResult ────────────────────────────────────────────────
class QuizResult {
    constructor({ quizIndex, question, correctAnswer, selectedAnswer, isCorrect, type, about }) {
        this.quizIndex = quizIndex;
        this.question = question;
        this.correctAnswer = correctAnswer;
        this.selectedAnswer = selectedAnswer;
        this.isCorrect = isCorrect;
        this.type = type;
        this.about = about;
    }
}

// ─── QuizEngine (Base Class) ───────────────────────────────────
class QuizEngine {
    /**
     * Render a quiz into the given container DOM element.
     * @param {Object} quiz - A single quiz JSON object.
     * @param {HTMLElement} container - The DOM element to render into.
     * @param {number} index - The quiz index (0-based).
     */
    toRender(quiz, container, index) {
        throw new Error('toRender() must be implemented by subclass');
    }

    /**
     * Check the user's answer for a rendered quiz.
     * @param {HTMLElement} container - The container that was rendered.
     * @param {Object} quiz - The original quiz JSON object.
     * @param {number} index - The quiz index.
     * @returns {QuizResult}
     */
    toCheck(container, quiz, index) {
        throw new Error('toCheck() must be implemented by subclass');
    }

    /**
     * Format a quiz for print/text output.
     * @param {Object} quiz - A single quiz JSON object.
     * @param {number} index - The quiz index.
     * @returns {string} Formatted text representation.
     */
    toFormat(quiz, index) {
        throw new Error('toFormat() must be implemented by subclass');
    }
}

// ─── MultiChoiceQuizEngine ─────────────────────────────────────
class MultiChoiceQuizEngine extends QuizEngine {

    /**
     * Type label mapping for display
     */
    static TYPE_LABELS = {
        meaning: { label: '词义理解', color: 'indigo', icon: '📖' },
        usage: { label: '用法辨析', color: 'emerald', icon: '✍️' },
        synonym: { label: '近义词', color: 'amber', icon: '🔗' },
        antonym: { label: '反义词', color: 'rose', icon: '⚡' },
        fillBlank: { label: '填空题', color: 'violet', icon: '✏️' },
    };

    toRender(quiz, container, index) {
        const meta = MultiChoiceQuizEngine.TYPE_LABELS[quiz.type] || { label: quiz.type, color: 'slate', icon: '❓' };

        const wrapper = document.createElement('div');
        wrapper.className = 'quiz-card glass-panel p-8 rounded-[32px] bg-white border border-slate-200/50 relative mb-8';
        wrapper.dataset.quizIndex = index;
        wrapper.dataset.correctAnswer = quiz.correct_answer;
        wrapper.dataset.answered = 'false';
        wrapper.dataset.selectedAnswer = '';

        wrapper.innerHTML = `
            <div class="absolute -top-5 left-8 flex items-center gap-2">
                <span class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-xl shadow-indigo-200 ring-4 ring-white">${index + 1}</span>
                <span class="px-3 py-1.5 bg-${meta.color}-50 text-${meta.color}-600 rounded-xl text-xs font-bold ring-1 ring-${meta.color}-200 shadow-sm">${meta.icon} ${meta.label}</span>
            </div>

            <div class="mt-4 mb-8">
                <p class="thai-text text-xl font-bold text-slate-800 leading-relaxed">${quiz.question}</p>
            </div>

            <div class="quiz-options space-y-3">
                ${quiz.options.map(opt => `
                    <button type="button" data-option-id="${opt.id}"
                        class="quiz-option w-full text-left px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50
                               hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md
                               active:scale-[0.98] transition-all duration-200 group flex items-center gap-4">
                        <span class="option-badge w-10 h-10 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center
                                     font-black text-slate-400 text-sm shadow-sm group-hover:border-indigo-400 group-hover:text-indigo-600 transition-all shrink-0">
                            ${opt.id}
                        </span>
                        <span class="thai-text text-base font-medium text-slate-700 leading-relaxed">${opt.text}</span>
                    </button>
                `).join('')}
            </div>

            <div class="quiz-feedback hidden mt-6 p-5 rounded-2xl border-2 text-sm font-bold"></div>
        `;

        // Bind click handlers
        const optionButtons = wrapper.querySelectorAll('.quiz-option');
        optionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (wrapper.dataset.answered === 'true') return;
                this._handleOptionClick(wrapper, btn, quiz);
            });
        });

        container.appendChild(wrapper);
    }

    _handleOptionClick(wrapper, clickedBtn, quiz) {
        wrapper.dataset.answered = 'true';
        const selectedId = clickedBtn.dataset.optionId;
        wrapper.dataset.selectedAnswer = selectedId;
        const isCorrect = selectedId === quiz.correct_answer;

        const allBtns = wrapper.querySelectorAll('.quiz-option');
        allBtns.forEach(btn => {
            btn.classList.remove('hover:border-indigo-300', 'hover:bg-indigo-50/50', 'hover:shadow-md', 'active:scale-[0.98]');
            btn.style.cursor = 'default';
            const optId = btn.dataset.optionId;
            const badge = btn.querySelector('.option-badge');

            if (optId === quiz.correct_answer) {
                // Correct answer styling
                btn.classList.remove('border-slate-100', 'bg-slate-50/50');
                btn.classList.add('border-green-400', 'bg-green-50', 'shadow-md', 'shadow-green-100');
                badge.classList.remove('border-slate-200', 'text-slate-400');
                badge.classList.add('border-green-500', 'text-white', 'bg-green-500');
            } else if (optId === selectedId && !isCorrect) {
                // Wrong selected answer
                btn.classList.remove('border-slate-100', 'bg-slate-50/50');
                btn.classList.add('border-rose-400', 'bg-rose-50', 'shadow-md', 'shadow-rose-100');
                badge.classList.remove('border-slate-200', 'text-slate-400');
                badge.classList.add('border-rose-500', 'text-white', 'bg-rose-500');
            } else {
                // Other options: dim
                btn.classList.add('opacity-40');
            }
        });

        // Show feedback
        const feedback = wrapper.querySelector('.quiz-feedback');
        feedback.classList.remove('hidden');
        if (isCorrect) {
            feedback.className = 'quiz-feedback mt-6 p-5 rounded-2xl border-2 text-sm font-bold border-green-200 bg-green-50 text-green-700';
            feedback.innerHTML = '✅ ถูกต้อง! 回答正确！';
        } else {
            const correctOpt = quiz.options.find(o => o.id === quiz.correct_answer);
            feedback.className = 'quiz-feedback mt-6 p-5 rounded-2xl border-2 text-sm font-bold border-rose-200 bg-rose-50 text-rose-700';
            feedback.innerHTML = `❌ ไม่ถูกต้อง 回答错误。正确答案是 <strong>${quiz.correct_answer}</strong>: ${correctOpt?.text || ''}`;
        }
    }

    toCheck(container, quiz, index) {
        const wrapper = container.querySelector(`.quiz-card[data-quiz-index="${index}"]`);
        if (!wrapper) return null;

        const answered = wrapper.dataset.answered === 'true';
        const selectedAnswer = wrapper.dataset.selectedAnswer || '';
        const isCorrect = selectedAnswer === quiz.correct_answer;

        return new QuizResult({
            quizIndex: index,
            question: quiz.question,
            correctAnswer: quiz.correct_answer,
            selectedAnswer: answered ? selectedAnswer : null,
            isCorrect: answered ? isCorrect : false,
            type: quiz.type,
            about: quiz.about,
        });
    }

    toFormat(quiz, index) {
        let text = `Q${index + 1} [${quiz.type}]: ${quiz.question}\n`;
        quiz.options.forEach(opt => {
            const marker = opt.id === quiz.correct_answer ? '✓' : ' ';
            text += `  ${marker} ${opt.id}. ${opt.text}\n`;
        });
        text += `  Answer: ${quiz.correct_answer}\n`;
        return text;
    }
}

// ─── QuizSession (orchestrator for rendering a full quiz set) ──
class QuizSession {
    constructor(quizzes, engine) {
        this.quizzes = quizzes || [];
        this.engine = engine || new MultiChoiceQuizEngine();
        this.container = null;
    }

    /**
     * Render all quizzes into the given container.
     * @param {HTMLElement} container
     */
    renderAll(container) {
        this.container = container;
        container.innerHTML = '';

        if (this.quizzes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16">
                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <p class="text-slate-400 font-bold">暂无测验题</p>
                    <p class="text-slate-300 text-sm mt-1">请先在管理后台生成该单词的 Quiz 数据</p>
                </div>
            `;
            return;
        }

        // Header
        const header = document.createElement('div');
        header.className = 'text-center mb-14';
        header.innerHTML = `
            <div class="w-16 h-16 bg-white shadow-lg rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2" stroke-linecap="round"></line>
                </svg>
            </div>
            <h3 class="text-3xl font-black text-slate-800 mb-2 tracking-tight">词汇掌握度测验</h3>
            <p class="text-slate-400 font-medium">共 ${this.quizzes.length} 道选择题，完成后点击"提交评测"查看成绩</p>
        `;
        container.appendChild(header);

        // Quiz cards
        const quizContainer = document.createElement('div');
        quizContainer.id = 'quiz-cards-container';
        quizContainer.className = 'space-y-12';
        container.appendChild(quizContainer);

        this.quizzes.forEach((quiz, idx) => {
            this.engine.toRender(quiz, quizContainer, idx);
        });

        // Submit button
        const submitArea = document.createElement('div');
        submitArea.className = 'mt-12 text-center';
        submitArea.innerHTML = `
            <button id="quiz-submit-btn" onclick="window._quizSession.submitAll()"
                class="px-12 py-4 bg-indigo-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
                📊 提交评测
            </button>
            <div id="quiz-score-panel" class="hidden mt-8 glass-panel p-8 rounded-[32px] bg-white border border-slate-200/50 max-w-lg mx-auto"></div>
        `;
        container.appendChild(submitArea);
    }

    /**
     * Check all quizzes and display the score.
     */
    submitAll() {
        if (!this.container) return;

        const results = this.quizzes.map((quiz, idx) => {
            return this.engine.toCheck(this.container.querySelector('#quiz-cards-container'), quiz, idx);
        }).filter(r => r !== null);

        const total = results.length;
        const answered = results.filter(r => r.selectedAnswer !== null).length;
        const correct = results.filter(r => r.isCorrect).length;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;

        const panel = this.container.querySelector('#quiz-score-panel');
        if (!panel) return;
        panel.classList.remove('hidden');

        const emoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : score >= 40 ? '💪' : '📚';
        const message = score >= 80 ? '优秀！掌握度极高！' : score >= 60 ? '不错，继续加油！' : score >= 40 ? '还需要多复习哦' : '建议重新学习一遍';

        panel.innerHTML = `
            <div class="text-center">
                <p class="text-5xl mb-4">${emoji}</p>
                <p class="text-4xl font-black ${score >= 60 ? 'text-green-600' : 'text-rose-600'} mb-2">${score}分</p>
                <p class="text-slate-500 font-bold mb-6">${message}</p>
                <div class="flex justify-center gap-6 text-sm">
                    <div class="text-center">
                        <p class="text-2xl font-black text-slate-800">${answered}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已答</p>
                    </div>
                    <div class="w-px bg-slate-200"></div>
                    <div class="text-center">
                        <p class="text-2xl font-black text-green-600">${correct}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">正确</p>
                    </div>
                    <div class="w-px bg-slate-200"></div>
                    <div class="text-center">
                        <p class="text-2xl font-black text-rose-600">${answered - correct}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">错误</p>
                    </div>
                    <div class="w-px bg-slate-200"></div>
                    <div class="text-center">
                        <p class="text-2xl font-black text-slate-300">${total - answered}</p>
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">未答</p>
                    </div>
                </div>
            </div>
        `;

        // Hide submit button after clicking
        const submitBtn = this.container.querySelector('#quiz-submit-btn');
        if (submitBtn) submitBtn.classList.add('hidden');

        // Scroll to score panel
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Format all quizzes for printing.
     * @returns {string}
     */
    formatAll() {
        return this.quizzes.map((quiz, idx) => this.engine.toFormat(quiz, idx)).join('\n');
    }
}

// Export for use
window.QuizEngine = QuizEngine;
window.QuizResult = QuizResult;
window.MultiChoiceQuizEngine = MultiChoiceQuizEngine;
window.QuizSession = QuizSession;
