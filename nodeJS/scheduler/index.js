const admin = require('firebase-admin');
const SpacedRepetitionScheduler = require('./SpacedRepetitionScheduler');

// 初始化Firebase Admin
const serviceAccount = require('/Users/zhangqing/Documents/Github/serviceKeys/serviceAccountKeyFirebase.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://outpost-otes-86b07.asia-southeast1.firebasedatabase.app/'
});

// 启动调度服务
const scheduler = new SpacedRepetitionScheduler();
scheduler.start();

console.log('间隔重复调度服务已启动');

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，关闭调度服务...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，关闭调度服务...');
  process.exit(0);
});