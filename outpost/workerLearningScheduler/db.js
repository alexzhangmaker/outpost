const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'scheduler.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Artifacts Table
            db.run(`CREATE TABLE IF NOT EXISTS artifacts (
                id TEXT PRIMARY KEY,
                title TEXT,
                data TEXT
            )`);

            // Users Table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                userId TEXT PRIMARY KEY,
                username TEXT,
                email TEXT
            )`);

            // Enrollments Table
            db.run(`CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                artifactId TEXT,
                status TEXT DEFAULT 'active',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(userId) REFERENCES users(userId),
                FOREIGN KEY(artifactId) REFERENCES artifacts(id)
            )`);

            // Learning Schedules Table
            db.run(`CREATE TABLE IF NOT EXISTS learning_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                artifactId TEXT,
                partId TEXT,
                status TEXT,
                nextScheduleTime DATETIME,
                lastLearnedTime DATETIME,
                repetitionCount INTEGER DEFAULT 0,
                intervalHours REAL DEFAULT 0,
                easeFactor REAL DEFAULT 2.5,
                sequenceIndex INTEGER,
                FOREIGN KEY(userId) REFERENCES users(userId),
                FOREIGN KEY(artifactId) REFERENCES artifacts(id),
                UNIQUE(userId, artifactId, partId)
            )`);

            // Learning Records Table
            db.run(`CREATE TABLE IF NOT EXISTS learning_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                artifactId TEXT,
                partId TEXT,
                partType TEXT,
                score INTEGER,
                durationSeconds INTEGER,
                startTime DATETIME,
                endTime DATETIME,
                status TEXT,
                details TEXT,
                FOREIGN KEY(userId) REFERENCES users(userId),
                FOREIGN KEY(artifactId) REFERENCES artifacts(id)
            )`, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};

module.exports = { db, initDb };
