function injectButton(item) {
    if (item.querySelector('.google-dict-collect-btn')) return;

    // Header area from the screenshot: div.gWKGZc
    const header = item.querySelector('.gWKGZc') || item.querySelector('div:first-child');
    if (!header) return;

    const collectBtn = document.createElement('button');
    collectBtn.className = 'google-dict-collect-btn';
    collectBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  `;
    collectBtn.title = 'Collect this translation';

    collectBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const sourceElement = item.querySelector('.EYBmYc');
        const sourceText = sourceElement?.innerText;
        const targetElement = item.querySelector('.uQiNJb') || sourceElement?.nextElementSibling;
        const targetText = targetElement?.innerText;

        const langLabel = item.querySelector('.v9p7kc');
        const langInfo = langLabel?.getAttribute('aria-label') || '';

        if (sourceText && targetText) {
            chrome.runtime.sendMessage({
                type: 'ADD_TRANSLATION',
                entry: {
                    source: sourceText.trim(),
                    target: targetText.trim(),
                    langInfo: langInfo,
                    url: window.location.href
                }
            }, (response) => {
                if (response?.success) {
                    item.style.transition = 'all 0.4s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.9)';
                    setTimeout(() => { item.style.display = 'none'; }, 400);
                }
            });
        }
    };

    header.appendChild(collectBtn);
}

function processList() {
    // Use the user's suggest: role="list" container
    const historyList = document.querySelector('.D2iQR [role="list"]');
    if (!historyList) return;

    const items = historyList.querySelectorAll('.vvNkBd');
    items.forEach(injectButton);
}

// Observe for dynamic content
const observer = new MutationObserver((mutations) => {
    processList();
});

// Watch the whole body for the history container to appear
observer.observe(document.body, { childList: true, subtree: true });

// Also check periodically as backup
setInterval(processList, 1000);

console.log('GoogleDict extension: monitoring history list...');
