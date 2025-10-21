const admin = require('firebase-admin');
const SpacedRepetitionSystem = require('./SpacedRepetitionSystem');

class SpacedRepetitionScheduler {
  constructor() {
    this.db = admin.database();
    this.srs = new SpacedRepetitionSystem();
    
    // 调度配置
    this.config = {
      scanInterval: 5 * 60 * 1000, // 5分钟扫描一次
      batchSize: 100
    };
  }

  /**
   * 启动调度服务
   */
  start() {
    console.log('启动间隔重复调度服务...');
    
    // 立即执行一次扫描
    this.scanAndReschedule();
    
    // 定时扫描
    setInterval(() => {
      this.scanAndReschedule();
    }, this.config.scanInterval);
  }

  /**
   * 扫描并重新调度需要处理的卡片
   */
  async scanAndReschedule() {
    try {
      console.log('开始扫描需要调度的卡片...');
      
      // 查找所有标记为需要调度的进度记录
      const progressSnapshot = await this.db.ref('user_progress')
        .orderByChild('needsReschedule')
        .equalTo(true)
        .limitToFirst(this.config.batchSize)
        .once('value');
      
      if (!progressSnapshot.exists()) {
        console.log('没有需要调度的卡片');
        return;
      }
      
      const updates = {};
      const progressUpdates = {};
      
      progressSnapshot.forEach(userProgressSnapshot => {
        const userPath = userProgressSnapshot.ref.path;
        const userId = userPath.split('/')[1];
        
        userProgressSnapshot.forEach(cardSnapshot => {
          const cardId = cardSnapshot.key;
          const progress = cardSnapshot.val();
          
          // 处理调度逻辑
          const schedulingResult = this.processRescheduling(
            userId, 
            cardId, 
            progress
          );
          
          if (schedulingResult) {
            // 更新调度队列
            const schedulePath = `scheduling_queue/${userId}/${cardId}`;
            updates[schedulePath] = schedulingResult.schedule;
            
            // 清除需要调度标志
            progressUpdates[`${userPath}/${cardId}/needsReschedule`] = false;
            progressUpdates[`${userPath}/${cardId}/lastScheduled`] = Date.now();
          }
        });
      });
      
      // 批量写入更新
      if (Object.keys(updates).length > 0) {
        await this.db.ref().update({
          ...updates,
          ...progressUpdates
        });
        console.log(`成功调度 ${Object.keys(updates).length} 张卡片`);
      }
      
    } catch (error) {
      console.error('调度扫描错误:', error);
    }
  }

  /**
   * 处理单个卡片的重新调度
   */
  processRescheduling(userId, cardId, progress) {
    try {
      // 从进度数据中提取调度参数
      const schedulingState = {
        repetition: progress.repetition || 0,
        interval: progress.interval || 0,
        easeFactor: progress.easeFactor || 2.5,
        lastReviewed: progress.lastReviewed
      };
      
      const performance = {
        subjectiveScore: progress.subjectiveScore,
        quizScore: progress.quizResults.correct / progress.quizResults.total,
        computedQuality: progress.computedQuality
      };
      
      // 使用间隔重复算法计算新调度
      const newSchedule = this.srs.calculateNextReview(
        schedulingState, 
        performance
      );
      
      // 计算优先级
      const priority = this.calculatePriority(newSchedule, performance);
      
      return {
        schedule: {
          ...newSchedule,
          priority,
          lastCalculated: Date.now()
        }
      };
      
    } catch (error) {
      console.error(`调度卡片错误 ${userId}/${cardId}:`, error);
      return null;
    }
  }

  /**
   * 计算复习优先级
   */
  calculatePriority(schedule, performance) {
    const now = Date.now();
    const daysUntilDue = Math.max(0, (schedule.nextReviewDate - now) / (1000 * 60 * 60 * 24));
    
    // 基于多种因素的优先级计算
    const factors = {
      urgency: Math.max(0, 10 - daysUntilDue) * 10,           // 紧迫性
      difficulty: (5 - performance.computedQuality) * 5,      // 难度
      stability: Math.log(1 + schedule.interval) * 3,         // 稳定性
      importance: performance.quizScore < 0.8 ? 15 : 5        // 重要性
    };
    
    return Object.values(factors).reduce((sum, factor) => sum + factor, 0);
  }

  /**
   * 手动触发用户调度（用于新用户初始化等）
   */
  async rescheduleUser(userId) {
    try {
      // 获取用户所有进度记录
      const progressSnapshot = await this.db.ref(`user_progress/${userId}`).once('value');
      
      if (!progressSnapshot.exists()) {
        return { success: false, error: '用户没有进度记录' };
      }
      
      const updates = {};
      
      progressSnapshot.forEach(cardSnapshot => {
        const cardId = cardSnapshot.key;
        const progress = cardSnapshot.val();
        
        // 标记所有卡片需要重新调度
        updates[`user_progress/${userId}/${cardId}/needsReschedule`] = true;
      });
      
      await this.db.ref().update(updates);
      
      return { 
        success: true, 
        message: `已标记 ${progressSnapshot.numChildren()} 张卡片需要重新调度` 
      };
      
    } catch (error) {
      console.error(`重新调度用户错误 ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SpacedRepetitionScheduler;