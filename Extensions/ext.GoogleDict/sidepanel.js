let allTranslations = [];

async function renderList(filter = '') {
  const container = document.getElementById('list-container');
  const stats = document.getElementById('stats');

  const filtered = allTranslations.filter(t =>
    t.source.toLowerCase().includes(filter.toLowerCase()) ||
    t.target.toLowerCase().includes(filter.toLowerCase())
  );

  stats.innerText = `${filtered.length} items`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
        </svg>
        <p>${filter ? 'No matches found' : 'No translations collected yet'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="translation-card" data-id="${t.id}">
      <button class="delete-btn" title="Remove" data-action="delete" data-id="${t.id}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
      <span class="lang-label">${t.langInfo || 'Translation'}</span>
      <div class="source-text">${t.source}</div>
      <div class="target-text">${t.target}</div>
      <span class="timestamp">${t.timestamp ? new Date(t.timestamp).toLocaleString() : 'Just now'}</span>
    </div>
  `).join('');
}

// Handle clicks via event delegation to avoid CSP issues with inline onclick
document.getElementById('list-container').addEventListener('click', async (e) => {
  const deleteBtn = e.target.closest('[data-action="delete"]');
  if (deleteBtn) {
    const id = parseInt(deleteBtn.getAttribute('data-id'));
    if (confirm('Are you sure you want to remove this entry?')) {
      await deleteTranslation(id);
      allTranslations = allTranslations.filter(t => t.id !== id);
      renderList(document.getElementById('search-input').value);
    }
  }
});

async function init() {
  allTranslations = await getAllTranslations();
  renderList();

  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  // Listen for new items added from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TRANSLATION_ADDED') {
      allTranslations.unshift(message.entry); // Add to local list immediately
      renderList(searchInput.value);
    }
  });
}

// Global error handling for IndexedDB
window.onerror = (msg, url, line) => {
  console.error(`Sidepanel Error: ${msg} at ${url}:${line}`);
};

init();
