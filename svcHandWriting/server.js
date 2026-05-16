const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const { insertTask, getTasks, getTaskById } = require('./database');
const { initGemini, gradeHandwriting } = require('./gemini');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6606;

// Configure Gemini
initGemini(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve PWA

// Multer for memory storage (we just need the buffer to send to Gemini)
const upload = multer({ storage: multer.memoryStorage() });

// --- API Routes ---

// Create a new task
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, date, words } = req.body;
        if (!title || !words || !Array.isArray(words)) {
            return res.status(400).json({ error: 'Missing title or invalid words array' });
        }
        
        const id = crypto.randomUUID();
        const wordsJson = JSON.stringify(words);
        await insertTask(id, title, date || new Date().toISOString(), wordsJson);
        
        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// List all tasks
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await getTasks();
        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get task details
app.get('/api/tasks/:id', async (req, res) => {
    try {
        const task = await getTaskById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        
        // Parse words_json before sending
        task.words = JSON.parse(task.words_json);
        delete task.words_json;
        res.json({ success: true, task });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Grade handwriting image
app.post('/api/grade/:id', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const task = await getTaskById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;

        const result = await gradeHandwriting(base64Image, mimeType, task.words_json);
        
        res.json({ success: true, assessment: result });
    } catch (err) {
        console.error("Grading error:", err);
        res.status(500).json({ error: err.message || 'Error grading handwriting' });
    }
});

// --- HTTPS Server Setup ---

const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost.pem'))
};

https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`[svcHandWriting] HTTPS Server running on https://0.0.0.0:${PORT}`);
});
