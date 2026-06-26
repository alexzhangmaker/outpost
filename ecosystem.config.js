module.exports = {
  apps: [
    {
      name: "MeanCheckService",
      script: "index.js",
      cwd: "./MeanCheckService",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "learningScheduler",
      script: "server.js",
      cwd: "./outpost/workerLearningScheduler",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "GeminiAgent",
      script: "dist/index.js",
      cwd: "./GeminiAgent",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "VoiceAssist",
      script: "main.py",
      cwd: "./VoiceAssist",
      interpreter: "python3",
      env: {
        PYTHONUNBUFFERED: "1"
      }
    },
    {
      name: "svcHandWriting",
      script: "server.js",
      cwd: "./svcHandWriting",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "outpostWebServer",
      script: "outpost_WebServer.js",
      cwd: "./nodeJS",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "webServer",
      script: "webServer.js",
      cwd: "./",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "spacedRepetitionScheduler",
      script: "scheduler/index.js",
      cwd: "./nodeJS",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "knowledgeTreeScheduler",
      script: "scheduler/indexKT.js",
      cwd: "./nodeJS",
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "svcAnkiV2",
      script: "svcAnkiV2.js",
      cwd: "./nodeJS",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
