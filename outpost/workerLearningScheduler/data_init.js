const { db, initDb } = require('./db');
const fs = require('fs');
const path = require('path');

const runInit = async () => {
    await initDb();

    // 1. Add Sample Artifact (from scene.json)
    const scenePath = path.join(__dirname, '../../demoApp/scene.json');
    if (fs.existsSync(scenePath)) {
        const sceneData = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
        db.run("INSERT OR REPLACE INTO artifacts (id, title, data) VALUES (?, ?, ?)", 
            [sceneData.id, sceneData.title, JSON.stringify(sceneData)], 
            (err) => {
                if (err) console.error("Error inserting artifact:", err);
                else console.log("Sample artifact inserted.");
            }
        );
    }

    // 2. Add Sample User
    db.run("INSERT OR REPLACE INTO users (userId, username, email) VALUES (?, ?, ?)", 
        ["user_001", "Alex", "alex@example.com"], 
        (err) => {
            if (err) console.error("Error inserting user:", err);
            else console.log("Sample user inserted.");
        }
    );

    // 3. Enroll user in the artifact
    db.run("INSERT INTO enrollments (userId, artifactId) VALUES (?, ?)", 
        ["user_001", "restaurant_001"], 
        (err) => {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log("User already enrolled.");
                } else {
                    console.error("Error enrolling user:", err);
                }
            }
            else console.log("User enrolled in artifact.");
        }
    );
};

runInit();
