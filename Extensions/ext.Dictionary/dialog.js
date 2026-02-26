import { saveSetting, getSetting, saveHistory, getAllHistory, getHistoryByOriginal, getDictEntry, getDictStats, searchDict, saveDictEntry, batchSaveDictEntries, saveAuditEntry, getAllAuditEntries, deleteAuditEntry, getAllSettings, batchSaveSettings, clearAllSettings, getLifecycleLogs, clearLifecycleLogs } from './db.js';
import { FirebaseManager } from './firebase-manager.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Tab Elements
  const contents = {
    dict: document.getElementById('content-dict'),
    history: document.getElementById('content-history'),
    dictCache: document.getElementById('content-dict-cache'),
    settings: document.getElementById('content-settings'),
    account: document.getElementById('content-account'),
    debug: document.getElementById('content-debug')
  };
  const tabs = {
    dict: document.getElementById('tab-dict'),
    history: document.getElementById('tab-history'),
    dictCache: document.getElementById('tab-dict-cache'),
    settings: document.getElementById('tab-settings'),
    account: document.getElementById('tab-account'),
    debug: document.getElementById('tab-debug')
  };

  // New UI Elements for Gemini & Audit
  const geminiApiKeyInput = document.getElementById('gemini-api-key');
  const auditList = document.getElementById('audit-list');
  const auditCount = document.getElementById('audit-count');

  // Export/Import Elements
  const exportSettingsBtn = document.getElementById('export-settings-btn');
  const importSettingsBtn = document.getElementById('import-settings-btn');
  const importFileInput = document.getElementById('import-file-input');
  const restoreCloudBtn = document.getElementById('restore-cloud-btn');

  // Detect Sidepanel mode
  const isSidePanel = window.innerWidth < 450; // Simple heuristic for sidepanel vs popup window
  if (isSidePanel) {
    document.body.classList.add('is-sidepanel');
    console.log('Detected SidePanel mode');
  }

  // Dictionary Elements
  const textInput = document.getElementById('text-input');
  const langPair = document.getElementById('lang-pair');
  const translateBtn = document.getElementById('translate-btn');
  const resultBox = document.getElementById('result-box');
  const inputTtsBtn = document.createElement('div');
  inputTtsBtn.className = 'tts-btn';
  inputTtsBtn.innerText = '🔊 Play';
  inputTtsBtn.style.marginBottom = '5px';
  inputTtsBtn.style.float = 'right';
  textInput.parentNode.insertBefore(inputTtsBtn, textInput.nextSibling);

  // Thai Smart Input Widget Initialization
  const widgetContainer = document.getElementById('thai-widget-container');
  let thaiWidget = null;
  if (widgetContainer) {
    thaiWidget = new ThaiSmartInput(widgetContainer);
    // Link widget input to play button visibility
    thaiWidget.inputEl.addEventListener('input', () => {
      inputTtsBtn.classList.toggle('show', hasThai(thaiWidget.inputEl.value));
    });
  }

  inputTtsBtn.onclick = () => speak(thaiWidget ? thaiWidget.inputEl.value : textInput.value);
  textInput.oninput = () => {
    inputTtsBtn.classList.toggle('show', hasThai(textInput.value));
  };

  // Setting Elements
  const apiKeyInput = document.getElementById('api-key');
  const saveSettingsBtn = document.getElementById('save-settings');
  const saveMsg = document.getElementById('save-msg');
  const newHostInput = document.getElementById('new-host');
  const addHostBtn = document.getElementById('add-host');
  const hostListContainer = document.getElementById('host-list');

  // Firebase Settings Elements
  const fbApiKeyInput = document.getElementById('fb-api-key');
  const fbAuthDomainInput = document.getElementById('fb-auth-domain');
  const fbProjectIdInput = document.getElementById('fb-project-id');
  const fbDbUrlInput = document.getElementById('fb-db-url');
  const saveFbSettingsBtn = document.getElementById('save-fb-settings');
  const fbSaveMsg = document.getElementById('fb-save-msg');

  // Auth Elements
  const signinBtn = document.getElementById('google-signin-btn');
  const signoutBtn = document.getElementById('signout-btn');
  const authUnlogged = document.getElementById('auth-unlogged');
  const authLogged = document.getElementById('auth-logged');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userPhoto = document.getElementById('user-photo');

  let readingHosts = [];
  let fbManager = null;

  // Window Controls
  const stickyBtn = document.getElementById('sticky-btn');
  const closeBtn = document.getElementById('close-btn');

  let isSticky = false;

  // History Elements
  const historyContainer = document.getElementById('history-container');

  // Load initial settings
  let settingsLoaded = false;
  const loadSettings = async () => {
    try {
      const [savedApiKey, savedHosts, savedSticky, fbConfig, savedGeminiKey] = await Promise.all([
        getSetting('googleApiKey'),
        getSetting('readingHosts'),
        getSetting('isSticky'),
        getSetting('firebaseConfig'),
        getSetting('geminiApiKey')
      ]);

      if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
      }

      if (savedGeminiKey) {
        geminiApiKeyInput.value = savedGeminiKey;
      }

      readingHosts = savedHosts || [];
      // Migration: convert string hosts to objects
      readingHosts = readingHosts.map(h => typeof h === 'string' ? { host: h, selector: 'body' } : h);
      renderHosts();

      if (fbConfig) {
        fbApiKeyInput.value = fbConfig.apiKey || '';
        fbAuthDomainInput.value = fbConfig.authDomain || '';
        fbProjectIdInput.value = fbConfig.projectId || '';
        fbDbUrlInput.value = fbConfig.databaseURL || '';

        if (fbConfig.apiKey && fbConfig.databaseURL) {
          fbManager = new FirebaseManager(fbConfig);
          // Attempt to restore session
          try {
            const user = await fbManager.checkSession();
            if (user) {
              updateAuthUI(user);
              // Automatic pull removed as per user request
            }
          } catch (e) {
            console.error('Session check failed during load:', e);
          }
        }
      }

      isSticky = savedSticky || false;
      updateStickyUI();
      settingsLoaded = true;

    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    // Only add blur listener AFTER settings are loaded and ONLY if NOT in sidepanel
    if (!isSidePanel) {
      window.addEventListener('blur', () => {
        console.log('[StickyCheck] Window blur event. IsSticky:', isSticky);

        // If pinned, we absolutely stay open
        if (isSticky) {
          console.log('[StickyCheck] Sticking... (Ignoring blur)');
          return;
        }

        // If NOT pinned, we close with a small safety delay
        setTimeout(() => {
          // Re-check sticky state and also check if we've regained focus (e.g. clicking within window)
          if (!isSticky && !document.hasFocus()) {
            console.log('[StickyCheck] Closing window (Unpinned & No focus)');
            window.close();
          } else {
            console.log('[StickyCheck] Stay open: Sticky=%s, HasFocus=%s', isSticky, document.hasFocus());
          }
        }, 200);
      });
    } else {
      console.log('Skipping Sticky logic in SidePanel mode');
    }
  };
  loadSettings();

  const updateStickyUI = () => {
    console.log('Updating Sticky UI, isSticky:', isSticky);
    stickyBtn.classList.toggle('active', isSticky);
  };

  stickyBtn.addEventListener('click', async () => {
    isSticky = !isSticky;
    console.log('Sticky toggled to:', isSticky);
    await saveSetting('isSticky', isSticky);
    updateStickyUI();
  });

  closeBtn.addEventListener('click', () => {
    console.log('Close button clicked');
    window.close();
  });



  const renderHosts = () => {
    hostListContainer.innerHTML = '';
    if (readingHosts.length === 0) {
      hostListContainer.innerHTML = '<div style="text-align:center;color:#999;padding:10px;">No sites added.</div>';
      return;
    }
    readingHosts.forEach((cfg, index) => {
      const item = document.createElement('div');
      item.className = 'host-item';
      item.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column;">
          <span style="font-weight: 600;">${cfg.host}</span>
          <span style="font-size: 11px; color: #65676b;">Selector: ${cfg.selector}</span>
        </div>
        <span class="remove-host" data-index="${index}">×</span>
      `;
      hostListContainer.appendChild(item);
    });
  };

  addHostBtn.addEventListener('click', async () => {
    const host = newHostInput.value.trim().toLowerCase();
    const selector = document.getElementById('new-selector').value.trim() || 'body';

    if (host) {
      // Avoid duplicate hosts
      const existingIdx = readingHosts.findIndex(h => h.host === host);
      if (existingIdx !== -1) {
        readingHosts[existingIdx].selector = selector;
      } else {
        readingHosts.push({ host, selector });
      }

      await saveSetting('readingHosts', readingHosts);
      newHostInput.value = '';
      document.getElementById('new-selector').value = '';
      renderHosts();
    }
  });

  hostListContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-host')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      readingHosts.splice(index, 1);
      await saveSetting('readingHosts', readingHosts);
      renderHosts();
    }
  });

  // Tab switching logic
  const switchTab = (tabName) => {
    Object.keys(tabs).forEach(name => {
      tabs[name].classList.toggle('active', name === tabName);
      contents[name].classList.toggle('active', name === tabName);
    });
    if (tabName === 'history') {
      renderHistory();
    }
  };

  tabs.dict.addEventListener('click', () => switchTab('dict'));
  tabs.history.addEventListener('click', () => switchTab('history'));
  tabs.dictCache.addEventListener('click', () => {
    switchTab('dictCache');
    renderDictStats();
    renderAuditQueue();
  });
  tabs.settings.addEventListener('click', () => switchTab('settings'));
  tabs.account.addEventListener('click', () => switchTab('account'));
  tabs.debug.addEventListener('click', () => {
    switchTab('debug');
    renderLogs();
  });

  // Save Firebase Settings
  saveFbSettingsBtn.addEventListener('click', async () => {
    const config = {
      apiKey: fbApiKeyInput.value.trim(),
      authDomain: fbAuthDomainInput.value.trim(),
      projectId: fbProjectIdInput.value.trim(),
      databaseURL: fbDbUrlInput.value.trim()
    };
    await saveSetting('firebaseConfig', config);

    // Re-initialize manager and check session immediately
    if (config.apiKey && config.databaseURL) {
      fbManager = new FirebaseManager(config);
      try {
        const user = await fbManager.checkSession();
        if (user) {
          updateAuthUI(user);
          await syncSettingsToCloud();
        }
      } catch (e) {
        console.error('Immediate session check failed:', e);
      }
    }

    fbSaveMsg.style.display = 'block';
    setTimeout(() => fbSaveMsg.style.display = 'none', 3000);
  });

  // Sign In / Sign Out
  const updateAuthUI = (user) => {
    if (user) {
      authUnlogged.style.display = 'none';
      authLogged.style.display = 'block';
      userName.textContent = user.displayName || 'User';
      userEmail.textContent = user.email;
      userPhoto.src = user.photoUrl || 'icon128.png';
      userPhoto.onerror = () => {
        userPhoto.onerror = null; // Prevent loop
        userPhoto.src = 'icon128.png';
      };
    } else {
      authUnlogged.style.display = 'block';
      authLogged.style.display = 'none';
    }
  };

  signinBtn.addEventListener('click', async () => {
    if (!fbManager) {
      const fbConfig = await getSetting('firebaseConfig');
      if (!fbConfig || !fbConfig.apiKey) {
        alert('Please configure Firebase RTDB settings in the Settings tab first (API Key is required).');
        switchTab('settings');
        return;
      }
      fbManager = new FirebaseManager(fbConfig);
    }

    signinBtn.disabled = true;
    signinBtn.textContent = 'Signing in...';
    try {
      const user = await fbManager.signInWithGoogle();
      updateAuthUI(user);
      // Automatic pull removed as per user request
    } catch (e) {
      console.error('Sign in failed:', e);
      alert('Sign in failed: ' + e.message + '\n\nMake sure your Client ID in manifest.json is correct and Authorized domains in Firebase include this extension.');
    } finally {
      signinBtn.disabled = false;
      signinBtn.textContent = 'Sign in with Google';
    }
  });

  signoutBtn.addEventListener('click', async () => {
    if (fbManager) {
      await fbManager.signOut();
      updateAuthUI(null);
    }
  });

  // TTS Helpers
  const hasThai = (text) => /[\u0E00-\u0E7F]/.test(text);

  const speak = (text) => {
    if (!text) return;

    try {
      const urlGoogleTTSProxy = `https://googleapi-w56agazoha-uc.a.run.app/?text=${encodeURIComponent(text)}`;
      const audio = new Audio(urlGoogleTTSProxy);
      audio.play().catch(e => {
        console.error('TTS playback failed:', e);
        // Fallback to SpeechSynthesis if proxy fails
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const thaiVoice = voices.find(v => v.lang.startsWith('th'));
        if (thaiVoice) utterance.voice = thaiVoice;
        else utterance.lang = 'th-TH';
        window.speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error('TTS initialization failed:', error);
    }
  };

  const resultTtsBtn = document.getElementById('result-tts-btn');
  resultTtsBtn.addEventListener('click', () => {
    speak(resultBox.textContent);
  });

  // Save Settings
  saveSettingsBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const geminiKey = geminiApiKeyInput.value.trim();
    await Promise.all([
      saveSetting('googleApiKey', apiKey),
      saveSetting('geminiApiKey', geminiKey)
    ]);

    // Cloud Sync
    await syncSettingsToCloud();

    saveMsg.style.display = 'block';
    setTimeout(() => {
      saveMsg.style.display = 'none';
    }, 3000);
  });

  // Backup & Recovery Logic
  exportSettingsBtn.addEventListener('click', async () => {
    try {
      const settings = await getAllSettings();
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thai-dict-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  });

  importSettingsBtn.addEventListener('click', () => importFileInput.click());
  restoreCloudBtn.addEventListener('click', async () => {
    if (!fbManager || !fbManager.user) {
      alert('Please sign in in the Account tab first.');
      switchTab('account');
      return;
    }
    restoreCloudBtn.disabled = true;
    restoreCloudBtn.innerText = 'Checking Cloud...';
    await pullSettingsFromCloud(true);
    restoreCloudBtn.disabled = false;
    restoreCloudBtn.innerText = 'Restore from Cloud';
  });

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const settings = JSON.parse(event.target.result);
        if (confirm('Importing will overwrite current settings. Continue?')) {
          await batchSaveSettings(settings);
          alert('Settings imported successfully! Reloading UI...');
          window.location.reload();
        }
      } catch (err) {
        alert('Import failed: Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  });

  async function syncSettingsToCloud() {
    if (fbManager && fbManager.user) {
      try {
        const settings = await getAllSettings();
        await fbManager.saveData('userSettings', settings);
        console.log('Settings synced to cloud.');
      } catch (e) {
        console.error('Cloud sync failed:', e);
      }
    }
  }

  async function pullSettingsFromCloud(manual = false) {
    if (fbManager && fbManager.user) {
      try {
        const cloudSettings = await fbManager.getData('userSettings');
        if (cloudSettings && Object.keys(cloudSettings).length > 0) {
          const local = await getAllSettings();
          if (manual || !local.googleApiKey) {
            if (confirm('Found existing settings in cloud. Restore them?')) {
              await batchSaveSettings(cloudSettings);
              alert('Settings restored from cloud. Reloading...');
              window.location.reload();
            }
          }
        } else if (manual) {
          alert('No settings found in cloud for this account.');
        }
      } catch (e) {
        console.error('Cloud pull failed:', e);
        if (manual) alert('Fetch failed: ' + e.message);
      }
    }
  }

  // Translate logic
  translateBtn.addEventListener('click', async () => {
    const text = (thaiWidget ? thaiWidget.inputEl.value : textInput.value).trim();
    if (!text) return;

    let finalResult = null;

    // 1. Check translation history cache first
    try {
      const cached = await getHistoryByOriginal(text);
      if (cached) {
        console.log('Using translation history for:', text);
        finalResult = cached.translated;
      }
    } catch (e) {
      console.error('History lookup failed:', e);
    }

    // 2. Check dictionary cache second
    if (!finalResult) {
      try {
        const dictEntry = await getDictEntry(text);
        if (dictEntry) {
          console.log('Using dictionary entry for:', text);
          let result = '';
          if (dictEntry.thai && dictEntry.thai.word) {
            result += `${dictEntry.thai.word} (${dictEntry.thai.pronunciation})\n`;
          }
          if (dictEntry.definitions && dictEntry.definitions.length > 0) {
            result += `EN: ${dictEntry.definitions[0].en}\nZH: ${dictEntry.definitions[0].zh}`;
          }
          finalResult = result;
        }
      } catch (e) {
        console.error('Dictionary cache lookup failed:', e);
      }
    }

    // 3. Fallback to API if still no result
    if (!finalResult) {
      const apiKey = await getSetting('googleApiKey');
      if (!apiKey) {
        resultBox.textContent = 'Error: Please set Google API Key in Settings tab.';
        return;
      }

      resultBox.textContent = 'Translating...';
      resultTtsBtn.classList.remove('show');

      const [source, target] = langPair.value.split('-');

      try {
        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: source,
            target: target,
            format: 'text'
          })
        });

        const data = await response.json();
        if (data.data && data.data.translations) {
          finalResult = data.data.translations[0].translatedText;
        } else {
          resultBox.textContent = 'Error: ' + (data.error ? data.error.message : 'Unknown error');
          return;
        }
      } catch (error) {
        resultBox.textContent = 'Error: ' + error.message;
        return;
      }
    }

    // Display result and save to history
    if (finalResult) {
      resultBox.textContent = finalResult;

      // Show TTS button if result contains Thai
      if (hasThai(finalResult)) {
        resultTtsBtn.classList.add('show');
      } else {
        resultTtsBtn.classList.remove('show');
      }

      // Always save to history for today's record
      await saveHistory(text, finalResult);
    }
  });

  // History Rendering logic
  async function renderHistory() {
    const records = await getAllHistory();
    historyContainer.innerHTML = '';

    if (records.length === 0) {
      historyContainer.innerHTML = '<p style="text-align:center;color:#65676b;">No history records found.</p>';
      return;
    }

    // Group by date
    const grouped = records.sort((a, b) => b.timestamp - a.timestamp).reduce((acc, curr) => {
      const dateString = new Date(curr.timestamp).toLocaleDateString();
      if (!acc[dateString]) acc[dateString] = [];
      acc[dateString].push(curr);
      return acc;
    }, {});

    Object.keys(grouped).forEach(date => {
      const accordion = document.createElement('button');
      accordion.className = 'accordion';
      accordion.innerText = date;

      const panel = document.createElement('div');
      panel.className = 'panel';

      const table = document.createElement('table');
      table.className = 'history-table';

      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th class="select-col"><input type="checkbox" class="select-all-date" title="Select All"></th>
          <th>Content</th>
          <th>Result</th>
        </tr>
      `;
      table.appendChild(thead);

      const tableBody = document.createElement('tbody');
      grouped[date].forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.item = JSON.stringify(item);

        const tdSelect = document.createElement('td');
        tdSelect.className = 'select-col';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-select';
        tdSelect.appendChild(checkbox);

        const tdOrig = document.createElement('td');
        tdOrig.textContent = item.original;
        if (hasThai(item.original)) {
          const btn = document.createElement('span');
          btn.className = 'tts-btn show';
          btn.innerText = '🔊';
          btn.onclick = (e) => {
            e.stopPropagation();
            speak(item.original);
          };
          tdOrig.appendChild(btn);
        }

        const tdTrans = document.createElement('td');
        tdTrans.textContent = item.translated;
        if (hasThai(item.translated)) {
          const btn = document.createElement('span');
          btn.className = 'tts-btn show';
          btn.innerText = '🔊';
          btn.onclick = (e) => {
            e.stopPropagation();
            speak(item.translated);
          };
          tdTrans.appendChild(btn);
        }

        tr.appendChild(tdSelect);
        tr.appendChild(tdOrig);
        tr.appendChild(tdTrans);
        tableBody.appendChild(tr);
      });
      table.appendChild(tableBody);

      const panelActions = document.createElement('div');
      panelActions.className = 'panel-actions';

      const syncBtn = document.createElement('button');
      syncBtn.className = 'sync-btn';
      syncBtn.innerText = 'Save to Cloud';
      if (!fbManager || !fbManager.user) {
        syncBtn.disabled = true;
        syncBtn.title = 'Please sign in in the Account tab first';
      }
      panelActions.appendChild(syncBtn);

      const addDictBtn = document.createElement('button');
      addDictBtn.className = 'sync-btn';
      addDictBtn.style.marginLeft = '10px';
      addDictBtn.style.backgroundColor = '#28a745';
      addDictBtn.innerText = 'Add to Dictionary';
      panelActions.appendChild(addDictBtn);

      panel.appendChild(table);
      panel.appendChild(panelActions);
      historyContainer.appendChild(accordion);
      historyContainer.appendChild(panel);

      const updateActionVisibility = () => {
        const selectedCount = tableBody.querySelectorAll('.row-select:checked').length;
        panelActions.style.display = selectedCount > 0 ? 'flex' : 'none';
        if (accordion.classList.contains('active')) {
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      };

      const selectAllCb = thead.querySelector('.select-all-date');
      selectAllCb.addEventListener('change', () => {
        const rowChecks = tableBody.querySelectorAll('.row-select');
        rowChecks.forEach(cb => cb.checked = selectAllCb.checked);
        updateActionVisibility();
      });

      tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-select')) {
          updateActionVisibility();
          const allChecks = tableBody.querySelectorAll('.row-select');
          const checkedCount = tableBody.querySelectorAll('.row-select:checked').length;
          selectAllCb.checked = checkedCount === allChecks.length;
          selectAllCb.indeterminate = checkedCount > 0 && checkedCount < allChecks.length;
        }
      });

      syncBtn.addEventListener('click', async () => {
        const selectedRows = tableBody.querySelectorAll('tr');
        const itemsToSync = [];
        selectedRows.forEach(tr => {
          const cb = tr.querySelector('.row-select');
          if (cb && cb.checked) itemsToSync.push(JSON.parse(tr.dataset.item));
        });
        if (itemsToSync.length === 0) return;

        syncBtn.disabled = true;
        syncBtn.innerText = 'Saving...';
        try {
          const d = new Date(itemsToSync[0].timestamp);
          const datePath = `${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}_${String(d.getDate()).padStart(2, '0')}`;
          for (const item of itemsToSync) {
            const sanitizedOriginal = item.original.replace(/\./g, '_');
            await fbManager.saveData(`extOutpostDictionary/${datePath}/${sanitizedOriginal}`, item);
          }
          syncBtn.innerText = 'Success!';
          syncBtn.classList.add('success');
          setTimeout(() => {
            syncBtn.innerText = 'Save to Cloud';
            syncBtn.classList.remove('success');
            syncBtn.disabled = false;
            selectAllCb.checked = false;
            tableBody.querySelectorAll('.row-select').forEach(cb => cb.checked = false);
            updateActionVisibility();
          }, 2000);
        } catch (e) {
          console.error('Cloud Sync failed:', e);
          alert('Cloud Sync failed: ' + e.message);
          syncBtn.disabled = false;
          syncBtn.innerText = 'Save to Cloud';
        }
      });

      addDictBtn.addEventListener('click', async () => {
        const selectedRows = tableBody.querySelectorAll('tr');
        const itemsToAdd = [];
        selectedRows.forEach(tr => {
          const cb = tr.querySelector('.row-select');
          if (cb && cb.checked) itemsToAdd.push(JSON.parse(tr.dataset.item));
        });
        if (itemsToAdd.length === 0) return;

        addDictBtn.disabled = true;
        addDictBtn.innerText = 'Processing...';

        try {
          let addedCount = 0;
          let aiCount = 0;

          for (const item of itemsToAdd) {
            // Check if word exists in dictionary
            const existing = await getDictEntry(item.original);
            if (existing) {
              console.log('Word already in dictionary:', item.original);
              continue;
            }

            // Trigger AI Generation in background
            chrome.runtime.sendMessage({ action: 'generateAIEntry', word: item.original });
            aiCount++;
          }

          addDictBtn.innerText = aiCount > 0 ? `Sent ${aiCount} to AI` : 'Already in Dict';
          addDictBtn.style.backgroundColor = '#17a2b8';

          setTimeout(() => {
            addDictBtn.innerText = 'Add to Dictionary';
            addDictBtn.style.backgroundColor = '#28a745';
            addDictBtn.disabled = false;
            selectAllCb.checked = false;
            tableBody.querySelectorAll('.row-select').forEach(cb => cb.checked = false);
            updateActionVisibility();

            // If we sent items to AI, inform the user to check Audit tab
            if (aiCount > 0) {
              alert(`${aiCount} words sent to Gemini for processing. Please check the Audit Queue in the Dict Cache tab to review and approve them.`);
            }
          }, 2000);

        } catch (e) {
          console.error('AI Generation Request failed:', e);
          alert('Failed: ' + e.message);
          addDictBtn.disabled = false;
          addDictBtn.innerText = 'Add to Dictionary';
        }
      });

      accordion.addEventListener('click', function () {
        this.classList.toggle('active');
        const p = this.nextElementSibling;
        p.style.maxHeight = p.style.maxHeight ? null : p.scrollHeight + "px";
      });
    });
  }

  // Dict Cache Specific Logic
  const reloadDictBtn = document.getElementById('reload-dict-btn');
  const dictStatsDiv = document.getElementById('dict-stats');
  const dictSearchInput = document.getElementById('dict-search-input');
  const dictSearchBtn = document.getElementById('dict-search-btn');
  const dictResultsDiv = document.getElementById('dict-results');

  async function renderDictStats() {
    try {
      const stats = await getDictStats();
      dictStatsDiv.innerText = `Total cached items: ${stats.count}`;
    } catch (e) {
      console.error('Failed to get dict stats:', e);
      dictStatsDiv.innerText = 'Failed to load statistics.';
    }
  }

  async function renderAuditQueue() {
    try {
      if (!auditList || !auditCount) return;
      const entries = await getAllAuditEntries();
      auditList.innerHTML = '';
      auditCount.innerText = entries.length;

      if (entries.length === 0) {
        auditList.innerHTML = '<div style="text-align:center;color:#999;padding:10px;">No items pending audit.</div>';
        return;
      }

      entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'host-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        item.style.padding = '10px';

        let def = '';
        if (entry.definitions && entry.definitions.length > 0) {
          def = (entry.definitions[0].zh || entry.definitions[0].en).substring(0, 50);
        }

        item.innerHTML = `
          <div style="width:100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-weight: 600;">${entry.thai?.word || entry.word}</span>
            <span style="font-size: 11px; background: #e7f3ff; color: #1877f2; padding: 2px 6px; border-radius: 4px;">${entry.pos || 'n/a'}</span>
          </div>
          <div style="font-size: 13px; color: #65676b; margin-bottom: 8px;">${def}...</div>
          <div style="width: 100%; display: flex; gap: 8px;">
            <button class="approve-btn action-btn" style="flex: 1; padding: 4px; font-size: 12px; background: #28a745; border:none; color:white; border-radius:4px; cursor:pointer;">Approve</button>
            <button class="reject-btn action-btn" style="flex: 1; padding: 4px; font-size: 12px; background: #dc3545; border:none; color:white; border-radius:4px; cursor:pointer;">Reject</button>
          </div>
        `;

        item.querySelector('.approve-btn').onclick = async () => {
          try {
            await saveDictEntry(entry.word, entry);
            if (fbManager && fbManager.user) {
              const sanitizedWord = entry.word.replace(/\./g, '_');
              await fbManager.saveData(`thaiDictionary/${sanitizedWord}`, entry);
            }
            await deleteAuditEntry(entry.word);
            renderAuditQueue();
            renderDictStats();
          } catch (e) {
            alert('Approval failed: ' + e.message);
          }
        };

        item.querySelector('.reject-btn').onclick = async () => {
          if (confirm(`Are you sure you want to reject "${entry.word}"?`)) {
            await deleteAuditEntry(entry.word);
            renderAuditQueue();
          }
        };

        auditList.appendChild(item);
      });
    } catch (e) {
      console.error('Audit Load failed:', e);
    }
  }

  reloadDictBtn.addEventListener('click', async () => {
    reloadDictBtn.disabled = true;
    reloadDictBtn.innerText = 'Syncing...';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'reloadDictionary' });
      if (response && response.error) {
        alert('Sync failed: ' + response.error);
      } else if (response && response.status === 'success') {
        alert('Sync complete! Entries: ' + (response.count || 0));
        renderDictStats();
      } else {
        alert('Sync status: ' + (response ? response.status : 'unknown'));
        renderDictStats();
      }
    } catch (e) {
      console.error('Reload failed:', e);
      alert('Reload failed: ' + e.message);
    } finally {
      reloadDictBtn.disabled = false;
      reloadDictBtn.innerText = 'Reload from Cloud';
    }
  });

  const performDictSearch = async () => {
    const query = dictSearchInput.value.trim();
    if (!query) {
      dictResultsDiv.innerHTML = '<div style="text-align:center;color:#999;padding:10px;">Enter a word to search.</div>';
      return;
    }

    try {
      const results = await searchDict(query);
      dictResultsDiv.innerHTML = '';

      if (results.length === 0) {
        dictResultsDiv.innerHTML = '<div style="text-align:center;color:#999;padding:10px;">No matches found in cache.</div>';
        return;
      }

      results.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'host-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'flex-start';
        item.style.cursor = 'pointer';

        let def = '';
        if (entry.definitions && entry.definitions.length > 0) {
          def = entry.definitions[0].zh || entry.definitions[0].en;
        }

        item.innerHTML = `
          <div style="width:100%; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600; font-size: 15px;">${entry.thai?.word || entry.word}</span>
            <span style="font-size: 11px; color: #1877f2; background: #e7f3ff; padding: 2px 6px; border-radius: 4px;">${entry.pos || 'n/a'}</span>
          </div>
          <div style="font-size: 13px; color: #65676b; margin-top: 4px;">${def}</div>
        `;

        item.onclick = () => {
          const word = entry.thai?.word || entry.word;
          if (thaiWidget) {
            thaiWidget.inputEl.value = word;
            // Trigger input event to show TTS icon
            thaiWidget.inputEl.dispatchEvent(new Event('input'));
          } else {
            textInput.value = word;
          }
          switchTab('dict');
          translateBtn.click();
        };

        dictResultsDiv.appendChild(item);
      });
    } catch (e) {
      console.error('Search failed:', e);
      dictResultsDiv.innerHTML = '<div style="color:red;padding:10px;">Search failed: ' + e.message + '</div>';
    }
  };

  dictSearchBtn.addEventListener('click', performDictSearch);
  dictSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performDictSearch();
  });

  // Debug Logging Logic
  const logContainer = document.getElementById('log-container');
  const refreshLogsBtn = document.getElementById('refresh-logs-btn');
  const clearLogsBtn = document.getElementById('clear-logs-btn');

  async function renderLogs() {
    if (!logContainer) return;
    logContainer.innerHTML = 'Loading logs...';
    try {
      const logs = await getLifecycleLogs();
      if (logs.length === 0) {
        logContainer.innerHTML = '<div style="color: #999;">No logs recorded yet.</div>';
        return;
      }
      logContainer.innerHTML = logs.map(log => `
        <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
          <span style="color: #1877f2; font-weight: bold;">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
          <span>${log.event}</span>
        </div>
      `).join('');
    } catch (e) {
      logContainer.innerHTML = `<div style="color: red;">Error: ${e.message}</div>`;
    }
  }

  if (refreshLogsBtn) refreshLogsBtn.addEventListener('click', renderLogs);
  if (clearLogsBtn) clearLogsBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all debug logs?')) {
      await clearLifecycleLogs();
      renderLogs();
    }
  });
});