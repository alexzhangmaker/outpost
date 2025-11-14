const admin = require("firebase-admin");
const schedule = require('node-schedule');

// Firebase配置
var serviceAccount = require("/Users/zhangqing/Documents/Github/serviceKeys/serviceAccountKeyFirebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/"
});

const database = admin.database();

class ThaiAnkiReviewManager {
  constructor() {
    this.isRunning = false;
    this.setupScheduler();
    this.checkAndExecuteMissedJob();
  }

  setupScheduler() {
    // 每天7AM执行，如果错过则在首次获得机会时执行
    const rule = new schedule.RecurrenceRule();
    rule.hour = 7;
    rule.minute = 0;
    rule.second = 0;

    schedule.scheduleJob(rule, () => {
      this.executeDailyReview();
    });

    console.log('Thai Anki Review Scheduler started. Will run daily at 7:00 AM.');
  }

  async checkAndExecuteMissedJob() {
    // 检查是否错过了今天的7AM执行时间
    const now = new Date();
    const today7AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);
    
    // 如果当前时间晚于今天7AM，且今天还没有生成复习记录，则立即执行
    if (now > today7AM) {
      const todayKey = this.getFormattedDate(now);
      
      try {
        // 检查是否已经存在今天的复习记录
        const existingReview = await database.ref(`thaiAnki/DailyReview/${todayKey}`).once('value');
        if (!existingReview.exists()) {
          console.log(`Missed 7AM execution time. Current time is ${now.toLocaleString()}, executing now...`);
          await this.executeDailyReview();
        } else {
          console.log(`Today's review (${todayKey}) already exists, skipping missed execution check.`);
        }
      } catch (error) {
        console.error('Error checking missed job:', error);
      }
    } else {
      console.log(`Not yet reached 7AM (current: ${now.toLocaleString()}), scheduled execution will run at 7:00 AM.`);
    }
  }

  async executeDailyReview() {
    // 防止重复执行
    if (this.isRunning) {
      console.log('Previous review task is still running, skipping...');
      return;
    }

    this.isRunning = true;
    
    try {
      console.log('Starting daily review task...');
      await this.processDailyReview();
      console.log('Daily review task completed successfully.');
    } catch (error) {
      console.error('Error executing daily review task:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async processDailyReview() {
    // 获取当前日期
    const now = new Date();
    const todayKey = this.getFormattedDate(now);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    console.log(`Processing review for date: ${todayKey}`);

    // 检查是否已经处理过今天的复习
    const existingReview = await database.ref(`thaiAnki/DailyReview/${todayKey}`).once('value');
    if (existingReview.exists()) {
      console.log(`Daily review for ${todayKey} already exists, skipping...`);
      return;
    }

    // 获取所有SM2记录
    const sm2RecordsSnapshot = await database.ref('thaiAnki/SM2Records').once('value');
    
    if (!sm2RecordsSnapshot.exists()) {
      console.log('No SM2 records found.');
      return;
    }

    const overdueWords = [];
    const sm2Records = sm2RecordsSnapshot.val();

    // 遍历所有记录，找出next_review早于今天的单词
    for (const [word, record] of Object.entries(sm2Records)) {
      if (record && record.next_review) {
        const reviewDate = new Date(record.next_review);
        
        // 如果复习日期早于今天（不包括今天）
        if (reviewDate.getTime() < todayStart) {
          overdueWords.push(word);
        }
      }
    }

    console.log(`Found ${overdueWords.length} overdue words for review.`);

    // 创建每日复习记录
    const dailyReview = {
      title: `Daily Anki.${todayKey}`,
      words: overdueWords
    };

    // 保存到数据库
    await database.ref(`thaiAnki/DailyReview/${todayKey}`).set(dailyReview);
    
    console.log(`Successfully created daily review for ${todayKey} with ${overdueWords.length} words.`);
  }

  getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  // 手动触发函数（用于测试或立即执行）
  async triggerManualReview() {
    console.log('Manual review triggered...');
    await this.executeDailyReview();
  }
}

// 创建实例并启动
const reviewManager = new ThaiAnkiReviewManager();

// 处理进程信号
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

// 导出用于PM2
module.exports = reviewManager;