import type { Database as SqliteDatabase } from 'better-sqlite3';
declare const db: SqliteDatabase;
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export declare function saveMessage(sessionId: string, role: string, content: string): void;
export declare function getMessages(sessionId: string): Message[];
export declare function saveResult(sessionId: string, images: string[], extractedData: any, type?: string): void;
export declare function getResults(sessionId?: string, type?: string): unknown[];
export declare function getResultById(id: number | string): unknown;
export declare function updateResult(id: number | string, extractedData: any): void;
export declare function createSession(sessionId: string): void;
export default db;
//# sourceMappingURL=database.d.ts.map