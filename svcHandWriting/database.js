const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT,
            date TEXT,
            words_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table', err.message);
            }
        });
    }
});

function insertTask(id, title, date, wordsJson) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO tasks (id, title, date, words_json) VALUES (?, ?, ?, ?)`;
        db.run(sql, [id, title, date, wordsJson], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function getTasks() {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id, title, date, created_at FROM tasks ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getTaskById(id) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM tasks WHERE id = ?`;
        db.get(sql, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

module.exports = {
    insertTask,
    getTasks,
    getTaskById
};
