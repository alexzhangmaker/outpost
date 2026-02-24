export declare const db: import("firebase-admin/lib/database/database").Database | null;
export declare const storage: import("firebase-admin/lib/storage/storage").Storage | null;
/**
 * Get a specific database instance by URL.
 * If no URL is provided, returns the default database instance.
 */
export declare function getDatabase(url?: string): import("firebase-admin/lib/database/database").Database;
export declare function saveToRealtimeDb(path: string, data: any): Promise<void>;
export declare function updateRealtimeDb(path: string, data: any): Promise<void>;
export declare function uploadAudioToStorage(buffer: Buffer, fileName: string, directory?: string): Promise<string>;
export declare function saveArticleToFirebase(article: any): Promise<void>;
export declare function getFromRealtimeDb(path: string): Promise<any>;
//# sourceMappingURL=firebase.d.ts.map