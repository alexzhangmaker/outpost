document.getElementById('extract-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url.includes('thai-notes.com')) {
    updateStatus('Please navigate to a Thai-notes.com lesson page');
    return;
  }

  updateStatus('Extracting content...');

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractContent
  }, (results) => {
    if (results && results[0] && results[0].result) {
      document.getElementById('json-editor').value = JSON.stringify(results[0].result, null, 2);
      updateStatus('Extraction complete');
    } else {
      updateStatus('Failed to extract content');
    }
  });
});

document.getElementById('export-btn').addEventListener('click', () => {
  const jsonContent = document.getElementById('json-editor').value;
  try {
    JSON.parse(jsonContent); // Validate JSON
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Generate filename from content if possible
    let filename = 'thai_notes_lesson.json';
    try {
      const data = JSON.parse(jsonContent);
      if (data.title) {
        filename = data.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json';
      }
    } catch (e) {}

    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    updateStatus('Exported: ' + filename);
  } catch (e) {
    updateStatus('Invalid JSON in editor');
    alert('Please fix JSON formatting before exporting');
  }
});

function updateStatus(msg) {
  document.getElementById('status').innerText = msg;
}

function extractContent() {
  const result = {
    title: document.title.split('๏')[0].trim(),
    source: window.location.href,
    sections: []
  };

  const mainContent = document.querySelector('.mw-parser-output');
  if (!mainContent) return result;

  const children = Array.from(mainContent.children);
  let currentSection = null;
  let currentSubTitle = null;

  children.forEach(el => {
    if (el.tagName === 'H2') {
      const title = el.innerText.replace('[edit]', '').trim();
      currentSection = {
        title: title,
        type: title.toUpperCase(),
        content: []
      };
      result.sections.push(currentSection);
      currentSubTitle = null;
    } else if (el.tagName === 'H3' && currentSection) {
      const title = el.innerText.replace('[edit]', '').trim();
      currentSubTitle = title;
      currentSection.content.push({
        subTitle: title,
        items: []
      });
    } else if (el.tagName === 'TABLE' && el.classList.contains('wikitable')) {
      const isGrammarDrill = currentSection && currentSection.title.includes('Grammar Drills');
      const rows = Array.from(el.querySelectorAll('tr'));
      
      if (isGrammarDrill) {
        // Handle as Key-Value objects based on headers
        let headers = [];
        const firstRow = rows[0];
        if (firstRow) {
          const headerCells = Array.from(firstRow.querySelectorAll('th, td'));
          headers = headerCells.map(c => c.innerText.trim());
        }

        const tableData = rows.slice(1).map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          const rowObj = {};
          cells.forEach((cell, idx) => {
            const key = headers[idx] || `col_${idx}`;
            // Handle Thai script spans within cells
            const thaiSpan = cell.querySelector('.thaiscript');
            if (thaiSpan) {
              const audioKey = 'vh25OFgw';
              const text = thaiSpan.innerText.trim();
              const audioUrl = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=th&sv=&vn=&pitch=0.5&rate=0.5&vol=1&key=${audioKey}`;
              
              rowObj[key] = {
                thai: text,
                ipa: cell.querySelector('.ipascript')?.innerText.trim() || '',
                text: cell.innerText.trim(),
                audio: audioUrl
              };
            } else {
              rowObj[key] = cell.innerText.trim();
            }
          });
          return rowObj;
        });

        if (currentSection.content.length > 0 && currentSection.content[currentSection.content.length - 1].subTitle === currentSubTitle) {
          currentSection.content[currentSection.content.length - 1].items.push(...tableData);
        } else {
          currentSection.content.push({ type: 'table', items: tableData });
        }
      } else {
        // Handle as standard Vocabulary/Dialog
        const tableData = rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length === 0) return null;
          const item = {};
          const thaiSpan = cells.find(c => c.querySelector('.thaiscript'));
          if (thaiSpan) {
            const audioKey = 'vh25OFgw';
            const text = thaiSpan.querySelector('.thaiscript').innerText.trim();
            const audioUrl = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=th&sv=&vn=&pitch=0.5&rate=0.5&vol=1&key=${audioKey}`;
            
            item.thai = text;
            const ipaSpan = thaiSpan.querySelector('.ipascript');
            if (ipaSpan) item.ipa = ipaSpan.innerText.trim();
            item.audio = audioUrl;
          }
          if (cells.length === 3) {
            const speaker = cells[0].innerText.trim();
            if (speaker.endsWith(':')) item.speaker = speaker.replace(':', '');
            item.english = cells[2].innerText.trim();
          } else if (cells.length === 2) {
            item.english = cells[1].innerText.trim();
          }
          return Object.keys(item).length > 0 ? item : null;
        }).filter(i => i !== null);

        if (currentSection.content.length > 0 && currentSubTitle && currentSection.content[currentSection.content.length - 1].subTitle === currentSubTitle) {
          currentSection.content[currentSection.content.length - 1].items.push(...tableData);
        } else {
          currentSection.content.push(...tableData);
        }
      }
    } else if (el.tagName === 'UL' && currentSection) {
       const items = Array.from(el.querySelectorAll('li')).map(li => li.innerText.trim());
       currentSection.content.push({ type: 'list', items });
    } else if (el.tagName === 'P' && currentSection) {
       const text = el.innerText.trim();
       if (text && !text.includes('NOTE:')) currentSection.content.push({ type: 'text', text });
    }
  });

  return result;
}
