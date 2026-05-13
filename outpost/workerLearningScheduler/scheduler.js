/**
 * Base class for activity scheduling algorithms
 */
class ActivityScheduler {
    constructor(db) {
        this.db = db;
    }

    /**
     * Calculate the next activities for a user
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async scheduleNext(userId) {
        throw new Error("scheduleNext must be implemented by subclass");
    }

    /**
     * Helper to get artifact data
     */
    getArtifact(artifactId) {
        return new Promise((resolve, reject) => {
            this.db.get("SELECT data FROM artifacts WHERE id = ?", [artifactId], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.data) : null);
            });
        });
    }

    /**
     * Initialize learning schedules for a user enrolling in an artifact
     */
    async initializeSchedule(userId, artifactId, artifact) {
        if (!artifact || !artifact.parts || artifact.parts.length === 0) return;
        
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run("BEGIN TRANSACTION");
                
                const stmt = this.db.prepare(`
                    INSERT OR IGNORE INTO learning_schedules 
                    (userId, artifactId, partId, status, nextScheduleTime, sequenceIndex) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                const now = new Date().toISOString();

                artifact.parts.forEach((part, index) => {
                    const status = index === 0 ? 'due' : 'pending';
                    const scheduleTime = index === 0 ? now : null;
                    stmt.run(userId, artifactId, part.partId, status, scheduleTime, index);
                });

                stmt.finalize();
                
                this.db.run("COMMIT", (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    /**
     * Update the schedule after a part is completed
     */
    async updateSchedule(userId, artifactId, partId, score) {
        // Find the current schedule record
        const currentRecord = await new Promise((resolve, reject) => {
            this.db.get(
                "SELECT * FROM learning_schedules WHERE userId = ? AND artifactId = ? AND partId = ?",
                [userId, artifactId, partId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!currentRecord) return;

        // 1. Update current part to review state (e.g., scheduled for tomorrow)
        const nextTime = new Date();
        nextTime.setHours(nextTime.getHours() + 24); // 24 hours later for review
        
        await new Promise((resolve, reject) => {
            this.db.run(
                "UPDATE learning_schedules SET status = 'review', nextScheduleTime = ?, lastLearnedTime = CURRENT_TIMESTAMP WHERE id = ?",
                [nextTime.toISOString(), currentRecord.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // 2. Unlock the next pending part in the sequence
        const nextPending = await new Promise((resolve, reject) => {
            this.db.get(
                "SELECT id FROM learning_schedules WHERE userId = ? AND artifactId = ? AND status = 'pending' ORDER BY sequenceIndex ASC LIMIT 1",
                [userId, artifactId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (nextPending) {
            await new Promise((resolve, reject) => {
                this.db.run(
                    "UPDATE learning_schedules SET status = 'due', nextScheduleTime = CURRENT_TIMESTAMP WHERE id = ?",
                    [nextPending.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    }
}

/**
 * Persistent DB Scheduler
 * Uses learning_schedules table to quickly query tasks.
 */
class FixedPeriodScheduler extends ActivityScheduler {
    constructor(db, intervalHours = 24) {
        super(db);
        this.intervalHours = intervalHours; // Used for default scheduling behavior if needed
    }

    async scheduleNext(userId) {
        // Direct DB query for due/review items past their schedule time
        const query = `
            SELECT ls.*, a.data as artifactData 
            FROM learning_schedules ls
            JOIN artifacts a ON ls.artifactId = a.id
            WHERE ls.userId = ? 
              AND ls.status IN ('due', 'review') 
              AND (ls.nextScheduleTime IS NULL OR datetime(ls.nextScheduleTime) <= datetime('now'))
        `;

        return new Promise((resolve, reject) => {
            this.db.all(query, [userId], (err, rows) => {
                if (err) return reject(err);
                
                // Map back to the expected output format
                const activities = rows.map(row => {
                    const artifact = JSON.parse(row.artifactData);
                    const part = artifact.parts.find(p => p.partId === row.partId) || {};
                    return {
                        userId: row.userId,
                        artifactId: row.artifactId,
                        partId: row.partId,
                        part: part,
                        scheduledTime: row.nextScheduleTime,
                        status: row.status, // due or review
                        type: 'db_scheduled'
                    };
                });
                
                resolve(activities);
            });
        });
    }
}

module.exports = { ActivityScheduler, FixedPeriodScheduler };
