import Database from 'better-sqlite3';
import type { Database as SqliteDatabase } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../agent.db');
const db: SqliteDatabase = new Database(dbPath);

// Initialize tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId TEXT NOT NULL,
    images TEXT, -- JSON array of image paths
    extractedData TEXT, -- JSON response
    type TEXT DEFAULT 'pattern', -- 'pattern' or 'common'
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- The full JSON article
    status TEXT DEFAULT 'pending_verification', -- pending_verification, completed
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add type column if it doesn't exist
try {
  db.exec("ALTER TABLE results ADD COLUMN type TEXT DEFAULT 'pattern'");
} catch (e) {
  // Column likely already exists
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function saveMessage(sessionId: string, role: string, content: string) {
  const stmt = db.prepare('INSERT INTO messages (sessionId, role, content) VALUES (?, ?, ?)');
  stmt.run(sessionId, role, content);
}

export function getMessages(sessionId: string): Message[] {
  const stmt = db.prepare('SELECT role, content FROM messages WHERE sessionId = ? ORDER BY createdAt ASC');
  return stmt.all(sessionId) as Message[];
}

export function saveResult(sessionId: string, images: string[], extractedData: any, type: string = 'pattern') {
  const stmt = db.prepare('INSERT INTO results (sessionId, images, extractedData, status, type) VALUES (?, ?, ?, ?, ?)');
  stmt.run(sessionId, JSON.stringify(images), JSON.stringify(extractedData), 'completed', type);
}

export function getResults(sessionId?: string, type?: string) {
  let query = 'SELECT * FROM results';
  const params: any[] = [];

  if (sessionId || type) {
    query += ' WHERE';
    if (sessionId) {
      query += ' sessionId = ?';
      params.push(sessionId);
    }
    if (type) {
      if (sessionId) query += ' AND';
      query += ' type = ?';
      params.push(type);
    }
  }

  query += ' ORDER BY createdAt DESC';
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getResultById(id: number | string) {
  const stmt = db.prepare('SELECT * FROM results WHERE id = ?');
  return stmt.get(id);
}

export function updateResult(id: number | string, extractedData: any) {
  const stmt = db.prepare('UPDATE results SET extractedData = ? WHERE id = ?');
  stmt.run(JSON.stringify(extractedData), id);
}

export function createSession(sessionId: string) {
  const stmt = db.prepare('INSERT OR IGNORE INTO sessions (id) VALUES (?)');
  stmt.run(sessionId);
}

// Article Helpers
export function saveArticle(article: any) {
  const stmt = db.prepare('INSERT OR REPLACE INTO articles (id, title, content, status) VALUES (?, ?, ?, ?)');
  stmt.run(article.id, article.title, JSON.stringify(article), article.status || 'pending_verification');
}

export function getArticles(status?: string) {
  let query = 'SELECT * FROM articles';
  const params: any[] = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY createdAt DESC';
  return db.prepare(query).all(...params);
}

export function getArticleById(id: string) {
  return db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
}

export function updateArticle(id: string, article: any, status?: string) {
  if (status) {
    const stmt = db.prepare('UPDATE articles SET content = ?, status = ? WHERE id = ?');
    stmt.run(JSON.stringify(article), status, id);
  } else {
    const stmt = db.prepare('UPDATE articles SET content = ? WHERE id = ?');
    stmt.run(JSON.stringify(article), id);
  }
}

export default db;
