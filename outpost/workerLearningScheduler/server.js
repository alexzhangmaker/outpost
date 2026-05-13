const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { db, initDb } = require('./db');
const { FixedPeriodScheduler } = require('./scheduler');

const app = express();
const port = 7001;

app.use(cors());
app.use(bodyParser.json());

const scheduler = new FixedPeriodScheduler(db);

app.use(express.static(path.join(__dirname, 'webApp')));

// --- REST API ---

/**
 * 1. Get today's pending activities for a user
 * GET /api/activities/pending?userId=...
 */
app.get('/api/activities/pending', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    try {
        const activities = await scheduler.scheduleNext(userId);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * 2. Record learning result (Check-in)
 * POST /api/activities/checkin
 */
app.post('/api/activities/checkin', (req, res) => {
    const record = req.body;
    const { userId, artifactId, partId, partType, score, durationSeconds, startTime, endTime, status, details } = record;

    const query = `INSERT INTO learning_records 
        (userId, artifactId, partId, partType, score, durationSeconds, startTime, endTime, status, details) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [
        userId, artifactId, partId, partType, score, durationSeconds, startTime, endTime, status, JSON.stringify(details || {})
    ], async function (err) {
        if (err) return res.status(500).json({ error: err.message });
        
        try {
            await scheduler.updateSchedule(userId, artifactId, partId, score);
            res.json({ success: true, recordId: this.lastID });
        } catch (updateErr) {
            console.error("Failed to update schedule:", updateErr);
            res.status(500).json({ error: "Record saved but schedule update failed: " + updateErr.message });
        }
    });
});

/**
 * 3. Management Console APIs
 */

// Get all artifacts
app.get('/api/admin/artifacts', (req, res) => {
    db.all("SELECT * FROM artifacts", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, data: JSON.parse(r.data) })));
    });
});

// Add/Update artifact
app.post('/api/admin/artifacts', (req, res) => {
    const artifact = req.body;
    db.run("INSERT OR REPLACE INTO artifacts (id, title, data) VALUES (?, ?, ?)",
        [artifact.id, artifact.title, JSON.stringify(artifact)],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Get all users
app.get('/api/admin/users', (req, res) => {
    db.all("SELECT * FROM users", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add user
app.post('/api/admin/users', (req, res) => {
    const { userId, username, email } = req.body;
    db.run("INSERT OR REPLACE INTO users (userId, username, email) VALUES (?, ?, ?)",
        [userId, username, email],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Get all enrollments
app.get('/api/admin/enrollments', (req, res) => {
    const query = `
        SELECT e.*, u.username, a.title as artifactTitle 
        FROM enrollments e
        JOIN users u ON e.userId = u.userId
        JOIN artifacts a ON e.artifactId = a.id
    `;
    db.all(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Enroll user in artifact
app.post('/api/admin/enroll', (req, res) => {
    const { userId, artifactId } = req.body;
    db.run("INSERT INTO enrollments (userId, artifactId) VALUES (?, ?)",
        [userId, artifactId],
        async (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            try {
                // Initialize the learning schedule for this enrollment
                const artifact = await scheduler.getArtifact(artifactId);
                if (artifact) {
                    await scheduler.initializeSchedule(userId, artifactId, artifact);
                }
                res.json({ success: true });
            } catch (initErr) {
                console.error("Failed to initialize schedule:", initErr);
                res.status(500).json({ error: "Enrolled but schedule init failed: " + initErr.message });
            }
        }
    );
});

// Get learning schedules (Admin)
app.get('/api/admin/schedules', (req, res) => {
    db.all("SELECT * FROM learning_schedules", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update schedule manually
app.put('/api/admin/schedules/:id', (req, res) => {
    const { id } = req.params;
    const { status, nextScheduleTime } = req.body;
    
    db.run(
        "UPDATE learning_schedules SET status = ?, nextScheduleTime = ? WHERE id = ?",
        [status, nextScheduleTime, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Get learning records
app.get('/api/admin/records', (req, res) => {
    db.all("SELECT * FROM learning_records", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Start Server
initDb().then(() => {
    app.listen(port, () => {
        console.log(`Learning Scheduler Service running at http://localhost:${port}`);
    });
}).catch(err => {
    console.error("Failed to initialize database", err);
});
