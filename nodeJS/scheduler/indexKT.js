// scheduler/index.js
const admin = require('firebase-admin');
const NewCardScheduler = require('./NewCardScheduler');
const KnowledgeTreeScheduler = require('./KnowledgeTreeScheduler'); // 替换为知识树调度器

// 环境变量配置
const config = {
  firebase: {
    credential: process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : require('/Users/zhangqing/Documents/Github/serviceKeys/serviceAccountKeyFirebase.json'),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://outpost-otes-86b07.asia-southeast1.firebasedatabase.app/'
  },
  scheduler: {
    scanInterval: process.env.SCHEDULER_SCAN_INTERVAL 
      ? parseInt(process.env.SCHEDULER_SCAN_INTERVAL) 
      : 5 * 60 * 1000, // 5分钟
    batchSize: process.env.SCHEDULER_BATCH_SIZE 
      ? parseInt(process.env.SCHEDULER_BATCH_SIZE) 
      : 100
  }
};


console.log(config) ;
// 初始化Firebase Admin
console.log('🔧 初始化Firebase Admin...');
try {
  admin.initializeApp({
    credential: admin.credential.cert(config.firebase.credential),
    databaseURL: config.firebase.databaseURL
  });
  console.log('✅ Firebase Admin初始化成功');
} catch (error) {
  console.error('❌ Firebase Admin初始化失败:', error);
  process.exit(1);
}

// 只启动两个调度器
const newCardScheduler = new NewCardScheduler();
const knowledgeTreeScheduler = new KnowledgeTreeScheduler();

newCardScheduler.start();
knowledgeTreeScheduler.start();

console.log('✅ 基于reviewLog的调度架构运行中:');
console.log('   - NewCardScheduler: 处理新卡片初始调度');
console.log('   - KnowledgeTreeScheduler: 基于reviewLog的智能调度');


// 健康检查端点
if (process.env.ENABLE_HEALTH_CHECK) {
  const http = require('http');
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'enhanced-spaced-repetition-scheduler',
        timestamp: new Date().toISOString(),
        services: {
          repetition: knowledgeTreeScheduler.getStatus(),
          newCards: newCardScheduler.getStatus()
          
        }
      }));
    } else if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        repetition: knowledgeTreeScheduler.getStatus(),
        newCards: newCardScheduler.getStatus()
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  const port = process.env.HEALTH_CHECK_PORT || 8080;
  server.listen(port, () => {
    console.log(`🏥 健康检查服务运行在端口 ${port}`);
  });
}

// 优雅关闭处理
function gracefulShutdown(signal) {
  return () => {
    console.log(`\n📩 收到 ${signal} 信号，开始优雅关闭...`);
    
    // 停止所有调度服务
    knowledgeTreeScheduler.stop();
    newCardScheduler.stop();
    
    
    // 关闭Firebase连接
    admin.app().delete().then(() => {
      console.log('✅ Firebase连接已关闭');
      console.log('👋 所有调度服务已安全退出');
      process.exit(0);
    }).catch(error => {
      console.error('❌ 关闭Firebase连接时出错:', error);
      process.exit(1);
    });
  };
}

// 注册信号处理器
process.on('SIGTERM', gracefulShutdown('SIGTERM'));
process.on('SIGINT', gracefulShutdown('SIGINT'));

console.log('✅ 所有调度服务已启动并运行');
console.log('💡 使用 Ctrl+C 来停止服务');

