// content.js

let toolbar = null;
let currentSelectionText = '';

const hasThai = (text) => /[\u0E00-\u0E7F]/.test(text);

const speak = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.startsWith('th'));
    if (thaiVoice) utterance.voice = thaiVoice;
    else utterance.lang = 'th-TH';
    window.speechSynthesis.speak(utterance);
};

const createToolbar = () => {
    toolbar = document.createElement('div');
    toolbar.className = 'thai-dict-toolbar';
    toolbar.style.display = 'none';
    document.body.appendChild(toolbar);

    const actions = document.createElement('div');
    actions.className = 'thai-dict-toolbar-actions';
    toolbar.appendChild(actions);

    const translateIcon = document.createElement('div');
    translateIcon.className = 'thai-dict-icon-btn';
    translateIcon.innerHTML = '🌐';
    translateIcon.title = 'Translate';
    translateIcon.onclick = handleTranslate;
    actions.appendChild(translateIcon);

    const speakIcon = document.createElement('div');
    speakIcon.className = 'thai-dict-icon-btn';
    speakIcon.innerHTML = '🔊';
    speakIcon.title = 'Speak';
    speakIcon.onclick = () => speak(currentSelectionText);
    actions.appendChild(speakIcon);

    const resultArea = document.createElement('div');
    resultArea.className = 'thai-dict-result-area';
    toolbar.appendChild(resultArea);
};

const getSelectionInfo = () => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        if (start !== end) {
            const text = activeElement.value.substring(start, end).trim();
            if (text) {
                const rect = activeElement.getBoundingClientRect();
                return { text, rect, isFormElement: true };
            }
        }
    }

    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        return { text, rect, isFormElement: false };
    }

    return null;
};

const handleTranslate = async (e) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (!currentSelectionText) return;

    const resultArea = toolbar.querySelector('.thai-dict-result-area');
    resultArea.innerHTML = '<span class="thai-dict-loading">Translating...</span>';
    resultArea.classList.add('show');

    chrome.runtime.sendMessage({ action: 'translate', text: currentSelectionText }, (response) => {
        if (response && response.result) {
            resultArea.innerText = response.result;
        } else if (response && response.error) {
            resultArea.innerText = 'Error: ' + response.error;
        } else {
            resultArea.innerText = 'Error: No response from extension.';
        }
    });
};

document.addEventListener('mouseup', (e) => {
    // If clicking inside toolbar, don't reset or re-position
    if (toolbar && toolbar.contains(e.target)) return;

    setTimeout(() => {
        const info = getSelectionInfo();

        if (info) {
            currentSelectionText = info.text;
            if (!toolbar) createToolbar();

            const rect = info.rect;
            const resultArea = toolbar.querySelector('.thai-dict-result-area');

            // Only show speak icon if content has Thai
            const speakIcon = toolbar.querySelector('.thai-dict-icon-btn[title="Speak"]');
            speakIcon.style.display = hasThai(currentSelectionText) ? 'flex' : 'none';

            // Reset result area on new selection
            resultArea.classList.remove('show');
            resultArea.innerText = '';

            toolbar.style.left = `${rect.left + window.scrollX}px`;
            toolbar.style.top = `${rect.top + window.scrollY - 35}px`;
            toolbar.style.display = 'flex';
        } else {
            // Check if clicking inside toolbar to prevent hiding while interacting
            const isClickInsideToolbar = toolbar && toolbar.contains(e.target);
            if (!isClickInsideToolbar && toolbar) {
                toolbar.style.display = 'none';
            }
        }
    }, 10);
});

document.addEventListener('mousedown', (e) => {
    if (toolbar && !toolbar.contains(e.target)) {
        toolbar.style.display = 'none';
    }
});

const checkReadingHosts = () => {
    chrome.runtime.sendMessage({ action: 'getReadingHosts' }, (hosts) => {
        const currentHost = window.location.host.toLowerCase();
        // hosts is now an array of objects: { host, selector }
        // Migration: handle possible old string format just in case
        const config = hosts && hosts.find(cfg => {
            const h = typeof cfg === 'string' ? cfg : cfg.host;
            return h.toLowerCase() === currentHost;
        });

        if (config) {
            const selector = typeof config === 'string' ? 'body' : config.selector;
            applyReadingFont(selector);
        }
    });
};

const applyReadingFont = (selector) => {
    // Inject Google Font
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@400;700&display=swap';
    document.head.appendChild(link);

    // Apply to specific selector with high specificity
    const style = document.createElement('style');
    style.innerHTML = `
        ${selector} {
            font-family: 'Noto Serif Thai', serif !important;
        }
    `;
    document.head.appendChild(style);
};

checkReadingHosts();

document.addEventListener('selectionchange', () => {
    const info = getSelectionInfo();
    if (!info && toolbar && toolbar.style.display !== 'none') {
        // Only hide if we aren't hovering/interacting with the toolbar
        // Actually, for better UX, usually we wait for mouseup/mousedown
    }
});
