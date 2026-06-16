module.exports = {
  apps: [
    {
      name: "MeanCheckService",
      script: "index.js",
      cwd: "./MeanCheckService",
      env: {
        NODE_ENV: "production",
      }
    },{
      name: "learningScheduler",
      script: "server.js",
      cwd: "./outpost/workerLearningScheduler",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
