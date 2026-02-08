import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import short from 'short-uuid';
import { geminiAgent, mastra, imageExtractionSchema, MARKDOWN_EXTRACTION_PROMPT } from './agent.js';
import { saveMessage, getMessages, createSession, saveResult, getResults, updateResult, getResultById } from './database.js';
import { generateThaiAudio } from './tts.js';
import { uploadAudioToStorage, saveToRealtimeDb, getFromRealtimeDb } from './firebase.js';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json());
// Setup multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });
const port = process.env.PORT || 3000;
app.get('/api/firebase/results', async (req, res) => {
    try {
        const data = await getFromRealtimeDb('sentencePatterns');
        res.json({ results: data || {} });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Gemini Agent Console</title>
      <style>
        :root {
          --primary: #2c3e50;
          --secondary: #34495e;
          --accent: #3498db;
          --light: #ecf0f1;
          --border: #ddd;
          --success: #27ae60;
        }
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        
        /* Layout */
        .toolbar { background: var(--primary); color: white; padding: 0 20px; height: 60px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 100; }
        .main-container { display: flex; flex: 1; overflow: hidden; }
        .sidebar { width: 320px; background: var(--light); border-right: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; }
        .content-area { flex: 1; display: flex; flex-direction: column; background: white; overflow: hidden; }

        /* Sidebar Sections */
        .sidebar-section { padding: 15px; border-bottom: 1px solid var(--border); }
        .sidebar-section h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #7f8c8d; }
        
        /* Nav Items */
        .nav-list { flex: 1; overflow-y: auto; }
        .nav-item { padding: 12px 15px; border-bottom: 1px solid #e0e0e0; cursor: pointer; transition: background 0.2s; border-left: 4px solid transparent; }
        .nav-item:hover { background: #e8ecef; }
        .nav-item.active { background: white; border-left-color: var(--accent); }
        .nav-item strong { display: block; font-size: 14px; color: var(--primary); margin-bottom: 4px; }
        .nav-item small { color: #95a5a6; font-size: 11px; }

        /* Content Area */
        .editor-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .editor-container { flex: 1; padding: 20px; display: flex; flex-direction: column; }
        textarea { flex: 1; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; padding: 15px; border: 1px solid var(--border); border-radius: 4px; font-size: 14px; line-height: 1.6; resize: none; background: #fafafa; }
        
        .actions { padding: 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; }

        /* Buttons */
        button { padding: 10px 18px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; }
        button:active { transform: translateY(1px); }
        .btn-primary { background: var(--accent); color: white; }
        .btn-success { background: var(--success); color: white; }
        .btn-secondary { background: #95a5a6; color: white; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Status & UI Info */
        #status-bar { padding: 8px 20px; font-size: 12px; border-top: 1px solid var(--border); background: #f8f9fa; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #95a5a6; }
        
        /* Form Styling */
        .upload-form input { margin-bottom: 10px; width: 100%; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <h2 style="margin: 0; font-size: 1.3rem; letter-spacing: -0.5px;">Gemini Agent <span style="font-weight: 300; opacity: 0.8;">| Console</span></h2>
        <div id="connection-status" style="font-size: 12px; opacity: 0.8;">● Connected</div>
      </div>
      
      <div class="main-container">
        <div class="sidebar">
          <div class="sidebar-section">
            <h3>Extraction Stage 1 (Images)</h3>
            <form action="/api/process-images" method="post" enctype="multipart/form-data" class="upload-form">
              <input type="file" name="images" multiple>
              <button type="submit" class="btn-primary" style="width: 100%">Run Vision Analyzer</button>
            </form>
          </div>

          <div class="sidebar-section">
            <h3>Extraction Stage 1 (Text)</h3>
            <div class="upload-form">
              <textarea id="markdown-input" placeholder="Paste Markdown document here..." style="width: 100%; height: 100px; padding: 10px; font-size: 11px; margin-bottom: 8px; box-sizing: border-box;"></textarea>
              <button onclick="processMarkdown()" class="btn-primary" style="width: 100%">Run Text Analyzer</button>
            </div>
          </div>
          
          <div class="sidebar-section" style="background: #fff; padding: 10px;">
            <button onclick="loadSidebar()" class="btn-secondary" style="width: 100%; font-size: 11px; padding: 6px;">Refresh Firebase List</button>
          </div>

          <div class="nav-list" id="sidebar-list">
            <!-- Sidebar items will load here -->
          </div>
        </div>
        
        <div class="content-area">
          <div id="editor-view" style="display:none; flex: 1; flex-direction: column;">
            <div class="editor-header">
              <h2 id="view-title" style="margin: 0; font-size: 1.1rem;">Edit Record</h2>
              <div id="record-meta" style="font-size: 12px; color: #7f8c8d;"></div>
            </div>
            
            <div class="editor-container">
              <textarea id="json-editor" spellcheck="false"></textarea>
            </div>
            
            <div class="actions">
              <button id="btn-save" onclick="saveChanges()" class="btn-primary">Save Local Changes</button>
              <button id="btn-finalize" onclick="finalizeRecord()" class="btn-success">Finalize & Generate Audio</button>
            </div>
          </div>
          
          <div id="empty-view" class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <p>Select a record to start editing</p>
            <button onclick="loadLocalList()" class="btn-secondary" style="margin-top: 10px;">View Local Extraction Queue</button>
          </div>
        </div>
      </div>

      <div id="status-bar">Ready</div>

      <script>
        let currentRecordId = null;
        let isFirebase = false;

        function logStatus(msg, type = 'info') {
          const bar = document.getElementById('status-bar');
          bar.innerText = msg;
          bar.style.color = type === 'error' ? '#e74c3c' : (type === 'success' ? '#27ae60' : '#2c3e50');
        }

        async function loadSidebar() {
          const list = document.getElementById('sidebar-list');
          list.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Fetching Firebase...</div>';
          try {
            const res = await fetch('/api/firebase/results');
            const { results } = await res.json();
            
            if (Object.keys(results).length === 0) {
              list.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No cloud records found</div>';
              return;
            }

            list.innerHTML = Object.keys(results).map(key => {
              const item = results[key];
              return \`
                <div class="nav-item" onclick="selectRecord('\${key}', true, \${JSON.stringify(item).replace(/"/g, '&quot;')})">
                  <strong>\${item.topic || 'Untitiled'}</strong>
                  <small>FB: \${key}</small>
                </div>
              \`;
            }).join('');
          } catch (err) {
            logStatus('Firebase load error: ' + err.message, 'error');
            list.innerHTML = '<div style="padding: 20px; color: #e74c3c;">Failed to load Firebase list</div>';
          }
        }

        async function loadLocalList() {
          const list = document.getElementById('sidebar-list');
          list.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Fetching Local...</div>';
          try {
            const res = await fetch('/api/results');
            const { results } = await res.json();
            
            list.innerHTML = '<h3>Local Queue</h3>' + results.map(r => {
              const data = JSON.parse(r.extractedData);
              return \`
                <div class="nav-item" onclick="selectRecord('\${r.id}', false, \${r.extractedData.replace(/"/g, '&quot;')}, '\${r.createdAt}')">
                  <strong>\${data.topic || 'Untitled'}</strong>
                  <small>Local ID: \${r.id} | \${new Date(r.createdAt).toLocaleTimeString()}</small>
                </div>
              \`;
            }).join('');
          } catch (err) {
            logStatus('Local load error: ' + err.message, 'error');
          }
        }

        function selectRecord(id, fromFirebase, data, timestamp = '') {
          currentRecordId = id;
          isFirebase = fromFirebase;
          
          document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
          event.currentTarget.classList.add('active');

          document.getElementById('empty-view').style.display = 'none';
          document.getElementById('editor-view').style.display = 'flex';
          
          document.getElementById('view-title').innerText = fromFirebase ? 'Cloud Record' : 'Local Draft';
          document.getElementById('record-meta').innerText = (fromFirebase ? 'Firebase Key: ' : 'Local ID: ') + id + (timestamp ? ' | ' + timestamp : '');
          
          document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
          
          // Disable cloud editing for now as requested (Phase 2 flow focus)
          document.getElementById('btn-finalize').style.display = fromFirebase ? 'none' : 'inline-flex';
          document.getElementById('btn-save').disabled = fromFirebase;
          
          logStatus('Loaded ' + (fromFirebase ? 'Cloud' : 'Local') + ' record: ' + id);
        }

        async function saveChanges() {
          if (isFirebase) return;
          
          const saveBtn = document.getElementById('btn-save');
          saveBtn.disabled = true;
          logStatus('Saving...');
          
          try {
            const data = JSON.parse(document.getElementById('json-editor').value);
            const res = await fetch('/api/results/' + currentRecordId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ extractedData: data })
            });
            const result = await res.json();
            if (result.success) {
              logStatus('Successfully saved to SQLite', 'success');
            }
          } catch (err) {
            logStatus('Save error: ' + err.message, 'error');
          } finally {
            saveBtn.disabled = false;
          }
        }

        async function finalizeRecord() {
          if (isFirebase) return;
          
          const finalizeBtn = document.getElementById('btn-finalize');
          finalizeBtn.disabled = true;
          logStatus('Finalizing... (Generating Audio & Syncing to Firebase)');
          
          try {
            const res = await fetch('/api/finalize-audio/' + currentRecordId, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
              logStatus('Finalized! Synced to Firebase.', 'success');
              document.getElementById('json-editor').value = JSON.stringify(result.data, null, 2);
              loadSidebar();
            } else {
              logStatus('Finalization failed: ' + result.error, 'error');
            }
          } catch (err) {
            logStatus('System error: ' + err.message, 'error');
          } finally {
            finalizeBtn.disabled = false;
          }
        }

        async function processMarkdown() {
          const content = document.getElementById('markdown-input').value;
          if (!content) return logStatus('Please paste some content first', 'error');

          logStatus('Processing Markdown...');
          try {
            const res = await fetch('/api/extract/markdown', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
            });
            const result = await res.json();
            if (result.success) {
              logStatus('Markdown processed successfully!', 'success');
              document.getElementById('markdown-input').value = '';
              loadLocalList();
            } else {
              logStatus('Extraction failed: ' + result.error, 'error');
            }
          } catch (err) {
            logStatus('Network error: ' + err.message, 'error');
          }
        }

        // Init
        loadSidebar();
      </script>
    </body>
    </html>
  `);
});
app.post('/api/process-images', upload.array('images'), async (req, res) => {
    const files = req.files;
    const sessionId = req.body.sessionId || 'default';
    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No images uploaded' });
    }
    try {
        createSession(sessionId);
        const messageParts = [
            { type: 'text', text: 'Analyze these images and extract the content into the required JSON format.' },
            ...files.map(file => ({
                type: 'image',
                image: fs.readFileSync(file.path).toString('base64'),
                mimeType: file.mimetype,
            }))
        ];
        const result = await geminiAgent.generate([
            {
                role: 'user',
                content: messageParts,
            },
        ], {
            structuredOutput: {
                schema: imageExtractionSchema,
            },
        });
        const extractedData = result.object;
        const imagePaths = files.map(f => f.path);
        // Phase 1: Save to local SQLite only
        saveResult(sessionId, imagePaths, extractedData);
        res.json({
            success: true,
            sessionId,
            data: extractedData,
        });
    }
    catch (error) {
        console.error('Error processing images:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
app.post('/api/extract/markdown', async (req, res) => {
    const { content, sessionId = 'default' } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    try {
        createSession(sessionId);
        const result = await geminiAgent.generate([
            {
                role: 'user',
                content: [
                    { type: 'text', text: MARKDOWN_EXTRACTION_PROMPT },
                    { type: 'text', text: content }
                ],
            },
        ], {
            structuredOutput: {
                schema: imageExtractionSchema,
            },
        });
        const extractedData = result.object;
        // Phase 1: Save to local SQLite only (same as images)
        saveResult(sessionId, ['text-source'], extractedData);
        res.json({
            success: true,
            sessionId,
            data: extractedData,
        });
    }
    catch (error) {
        console.error('Error extracting markdown:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
app.put('/api/results/:id', async (req, res) => {
    const { id } = req.params;
    const { extractedData } = req.body;
    if (!extractedData) {
        return res.status(400).json({ error: 'extractedData is required' });
    }
    try {
        updateResult(id, extractedData);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/finalize-audio/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const record = getResultById(id);
        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }
        let extractedData = JSON.parse(record.extractedData);
        // 2. Generate audio for each example
        if (extractedData.patterns) {
            for (const pattern of extractedData.patterns) {
                if (pattern.examples) {
                    for (const example of pattern.examples) {
                        if (example.thai && !example.audioThai) {
                            console.log(`Generating audio for: ${example.thai}`);
                            try {
                                const audioBuffer = await generateThaiAudio(example.thai);
                                const audioId = short.generate();
                                const fileName = `${audioId}.mp3`;
                                const audioUrl = await uploadAudioToStorage(audioBuffer, fileName);
                                example.audioThai = audioUrl;
                            }
                            catch (ttsError) {
                                console.error(`TTS Error for "${example.thai}":`, ttsError);
                            }
                        }
                    }
                }
            }
        }
        // 3. Update local SQLite with enhanced data
        updateResult(id, extractedData);
        // 4. Save to Firebase Realtime Database
        await saveToRealtimeDb('sentencePatterns', {
            sessionId: record.sessionId,
            ...extractedData,
            createdAt: new Date().toISOString()
        });
        res.json({
            success: true,
            data: extractedData,
        });
    }
    catch (error) {
        console.error('Error finalizing audio:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});
app.post('/api/chat', async (req, res) => {
    const { message, sessionId = 'default' } = req.body;
    if (!message)
        return res.status(400).json({ error: 'Message is required' });
    try {
        createSession(sessionId);
        const result = await geminiAgent.generate(message);
        saveMessage(sessionId, 'user', message);
        saveMessage(sessionId, 'assistant', result.text);
        res.json({ reply: result.text, sessionId });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/results', (req, res) => {
    const sessionId = req.query.sessionId;
    const results = getResults(sessionId);
    res.json({ results });
});
app.get('/api/history/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const history = getMessages(sessionId);
    res.json({ history });
});
app.listen(port, () => {
    console.log(`Gemini Agent service running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map