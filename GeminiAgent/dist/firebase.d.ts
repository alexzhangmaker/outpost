export declare const db: import("firebase-admin/lib/database/database").Database | null;
export declare const storage: import("firebase-admin/lib/storage/storage").Storage | null;
export declare function saveToRealtimeDb(path: string, data: any): Promise<void>;
export declare function uploadAudioToStorage(buffer: Buffer, fileName: string): Promise<string>;
export declare function getFromRealtimeDb(path: string): Promise<any>;
//# sourceMappingURL=firebase.d.ts.map