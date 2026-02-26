import { getSetting, saveHistory, getHistoryByOriginal, batchSaveDictEntries, saveDictEntry, getDictEntry, getDictStats, saveAuditEntry, logLifecycleEvent } from './db.js';
import { FirebaseManager } from './firebase-manager.js';

// Persistent state backed by chrome.storage.session
let fbManager = null;
let dictSyncing = false;

// Global error handlers
self.onerror = (message, source, lineno, colno, error) => {
  logLifecycleEvent(`Error: ${message} at ${source}:${lineno}:${colno}`);
};

self.onunhandledrejection = (event) => {
  logLifecycleEvent(`Unhandled Rejection: ${event.reason}`);
};

const getDialogWindowId = async () => {
  const data = await chrome.storage.session.get('dialogWindowId');
  return data.dialogWindowId || null;
};

const setDialogWindowId = async (id) => {
  await chrome.storage.session.set({ dialogWindowId: id });
};

// ... (existing action listener)
const openDialog = async () => {
  let dialogWindowId = await getDialogWindowId();
  if (dialogWindowId !== null) {
    try {
      await chrome.windows.get(dialogWindowId);
      await chrome.windows.update(dialogWindowId, { focused: true });
      return;
    } catch (e) {
      await setDialogWindowId(null); // Window was closed or invalid
    }
  }

  console.log('openDialog triggered');
  try {
    const displays = await chrome.system.display.getInfo();
    const primary = displays.find(d => d.isPrimary) || displays[0];
    const { width, height } = primary.bounds;

    const w = 600, h = 400;
    const left = Math.round((width - w) / 2);
    const top = Math.round((height - h) / 2);

    const win = await chrome.windows.create({
      url: chrome.runtime.getURL('dialog.html'),
      type: 'popup',
      width: w,
      height: h,
      left: left,
      top: top,
      focused: true
    });
    await setDialogWindowId(win.id);

  } catch (e) {
    console.error('Failed to create centered window:', e);
    chrome.windows.create({
      url: chrome.runtime.getURL('dialog.html'),
      type: 'popup',
      width: 600,
      height: 450
    });
  }
};

// Configure side panel behavior and alarms on startup/install
chrome.runtime.onInstalled.addListener((details) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  // Ensure the alarm exists
  chrome.alarms.create('syncDictionary', { periodInMinutes: 60 });
  console.log('Extension installed/updated, sync alarm created.');
  logLifecycleEvent(`Extension Installed/Updated: ${details.reason}`);
});

// For shortcut key
chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === 'open-dictionary-dialog') {
    openDialog();
  }
});

// Translation handle for content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'translate') {
    handleTranslation(message.text).then(sendResponse);
    return true; // async response
  } else if (message.action === 'getReadingHosts') {
    getSetting('readingHosts').then(hosts => {
      sendResponse(hosts || []);
    });
    return true;
  } else if (message.action === 'reloadDictionary') {
    syncDictionary().then(result => sendResponse(result));
    return true;
  } else if (message.action === 'getDictStats') {
    getDictStats().then(stats => sendResponse(stats));
    return true;
  } else if (message.action === 'generateAIEntry') {
    handleAIGeneration(message.word).then(sendResponse);
    return true;
  }
});

async function handleAIGeneration(word) {
  const geminiKey = await getSetting('geminiApiKey');
  if (!geminiKey) return { error: 'Gemini API Key not set' };

  const prompt = `请为泰语单词 "${word}" 生成完整的词汇卡片信息。

请严格按照以下JSON格式返回数据，包含所有字段：
{
    "word_id": "生成基于单词的唯一ID",
    "thai": {
        "word": "泰语单词",
        "pronunciation": "泰语发音（国际音标或拼音）",
        "spelling_breakdown": "拼写分解和组成分析"
    },
    "pos": "词性（名词/动词/形容词/副词等）",
    "level": "CEFR级别（A1/A2/B1/B2/C1/C2）",
    "topic": ["相关主题分类1", "相关主题分类2"],
    "definitions": [
        {
            "en": "英文释义1",
            "zh": "中文释义1"
        },
        {
            "en": "英文释义2", 
            "zh": "中文释义2"
        }
    ],
    "grammar_notes": "详细的语法说明和使用规则",
    "conjugations": {
        "过去式": "过去式形式（如适用）",
        "未来式": "未来式形式（如适用）",
        "否定形式": "否定形式（如适用）"
    },
    "common_phrases": [
        {
            "phrase": "包含该单词的常见泰语短语1",
            "translation": "短语的中文翻译1"
        },
        {
            "phrase": "包含该单词的常见泰语短语2",
            "translation": "短语的中文翻译2"
        }
    ],
    "synonyms": ["近义词1", "近义词2"],
    "antonyms": ["反义词1", "反义词2"],
    "tags": ["相关标签1", "相关标签2"]
}

要求：
1. 所有字段都必须提供，不能为空
2. word_id 请基于泰语单词生成唯一标识符
3. pronunciation 请提供准确的发音标注
4. spelling_breakdown 请分析单词的拼写结构
5. definitions 至少提供2个不同角度的释义
6. common_phrases 至少提供2个常用短语例子
7. 请确保所有信息准确且符合泰语语言规范

请只返回JSON格式的数据，不要有其他任何文字说明。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      let aiText = data.candidates[0].content.parts[0].text;
      // Extract JSON if there's any markdown wrapping
      aiText = aiText.replace(/```json\n?|\n?```/g, '').trim();
      const aiData = JSON.parse(aiText);

      // Save to audit store
      await saveAuditEntry(word, aiData);

      return { status: 'success', data: aiData };
    } else {
      console.error('Gemini failure:', data);
      return { error: 'Gemini AI failed to generate content' };
    }
  } catch (e) {
    console.error('AI Generation error:', e);
    return { error: e.message };
  }
}

async function syncDictionary() {
  if (dictSyncing) return { status: 'syncing' };
  dictSyncing = true;
  console.log('Starting dictionary sync...');
  logLifecycleEvent('Sync dictionary heartbeat start');

  try {
    const fbConfig = await getSetting('firebaseConfig');
    if (!fbConfig || !fbConfig.apiKey || !fbConfig.databaseURL) {
      dictSyncing = false;
      return { error: 'Firebase not configured' };
    }

    if (!fbManager) {
      fbManager = new FirebaseManager(fbConfig);
    }

    const user = await fbManager.checkSession();
    if (!user) {
      dictSyncing = false;
      return { error: 'Not authenticated with Firebase' };
    }

    const data = await fbManager.getData('thaiDictionary');
    if (data) {
      await batchSaveDictEntries(data);
      console.log('Dictionary sync complete. Entries:', Object.keys(data).length);
      dictSyncing = false;
      return { status: 'success', count: Object.keys(data).length };
    } else {
      dictSyncing = false;
      return { status: 'empty' };
    }
  } catch (e) {
    console.error('Dictionary sync failed:', e);
    dictSyncing = false;
    return { error: e.message };
  }
}

// Initial sync on startup
chrome.runtime.onStartup.addListener(() => {
  logLifecycleEvent('Extension Startup (Browser/Profile Start)');
  syncDictionary();
});

// Periodic sync alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncDictionary') {
    syncDictionary().catch(err => console.error('Alarm sync failed:', err));
  }
});



async function handleTranslation(text) {
  // Check dictionary cache first (highest priority)
  try {
    const dictEntry = await getDictEntry(text);
    if (dictEntry) {
      console.log('Using dictionary entry for:', text);
      // Format dictionary entry for display
      let result = '';
      if (dictEntry.thai && dictEntry.thai.word) {
        result += `${dictEntry.thai.word} (${dictEntry.thai.pronunciation})\n`;
      }
      if (dictEntry.definitions && dictEntry.definitions.length > 0) {
        result += `EN: ${dictEntry.definitions[0].en}\nZH: ${dictEntry.definitions[0].zh}`;
      }
      return { result: result, isDict: true };
    }
  } catch (e) {
    console.error('Dictionary lookup failed:', e);
  }

  // Check translation history cache second
  try {
    const cached = await getHistoryByOriginal(text);
    if (cached) {
      console.log('Using cached translation for:', text);
      return { result: cached.translated };
    }
  } catch (e) {
    console.error('Cache lookup failed:', e);
  }

  const apiKey = await getSetting('googleApiKey');
  if (!apiKey) {
    return { error: 'Google API Key not set. Please open extension settings.' };
  }

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: 'en', // Default to English for on-page translation
        format: 'text'
      })
    });

    const data = await response.json();
    if (data.data && data.data.translations) {
      const result = data.data.translations[0].translatedText;
      await saveHistory(text, result);
      return { result: result };
    } else {
      return { error: data.error ? data.error.message : 'Unknown translation error' };
    }
  } catch (error) {
    return { error: error.message };
  }
}