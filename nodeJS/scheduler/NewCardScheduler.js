const admin = require('firebase-admin');

class NewCardScheduler {
  constructor() {
    this.db = admin.database();
    
    this.config = {
      scanInterval: 2 * 60 * 1000,     // 2分钟扫描一次新卡片
      batchSize: 50,
      initialInterval: 1,              // 新卡片首次复习间隔1天
      initialEaseFactor: 2.5
    };
  }

  /**
   * 启动新卡片调度服务
   */
  start() {
    console.log('🆕 启动新卡片调度服务...');
    
    // 立即执行首次扫描
    this.scanAndScheduleNewCards().catch(console.error);
    
    // 定时扫描新卡片
    this.scanInterval = setInterval(() => {
      this.scanAndScheduleNewCards().catch(console.error);
    }, this.config.scanInterval);
  }

  /**
   * 停止服务
   */
  stop() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    console.log('🛑 新卡片调度服务已停止');
  }

  /**
   * 扫描并调度新卡片 - 这就是 scheduleNewCards() 函数
   */
  async scanAndScheduleNewCards() {
    const startTime = Date.now();
    console.log(`\n🕐 [${new Date().toISOString()}] 开始扫描新卡片...`);
    
    try {
      // 使用修复的查询方法
      const newCards = await this.findNewCardsNeedingScheduling();
      
      if (newCards.length === 0) {
        console.log('✅ 没有需要首次调度的新卡片');
        return { scheduled: 0, duration: Date.now() - startTime };
      }
      
      const updates = {};
      let scheduledCount = 0;
      
      // 为每张新卡片创建初始调度
      for (const card of newCards) {
        const scheduleResult = this.createInitialSchedule(card);
        
        if (scheduleResult) {
          scheduledCount++;
          
          // 更新调度队列
          const schedulePath = `scheduling_queue/${card.userId}/${card.cardId}`;
          updates[schedulePath] = scheduleResult.schedule;
          
          // 更新进度记录
          const progressPath = `user_progress/${card.userId}/${card.cardId}`;
          updates[`${progressPath}/needsReschedule`] = false;
          updates[`${progressPath}/repetition`] = 0;
          updates[`${progressPath}/interval`] = 0;
          updates[`${progressPath}/easeFactor`] = this.config.initialEaseFactor;
          updates[`${progressPath}/lastScheduled`] = Date.now();
          updates[`${progressPath}/scheduledBy`] = 'new_card_scheduler_v1';
          updates[`${progressPath}/status`] = 'active';
          
          console.log(`🎯 调度新卡片: ${card.userId}/${card.cardId}`);
        }
      }
      
      // 批量写入更新
      if (Object.keys(updates).length > 0) {
        await this.db.ref().update(updates);
        
        const duration = Date.now() - startTime;
        console.log(`🎉 新卡片调度完成: 成功调度 ${scheduledCount} 张新卡片, 耗时 ${duration}ms`);
        
        return { 
          scheduled: scheduledCount, 
          duration,
          timestamp: Date.now()
        };
      }
      
      return { scheduled: 0, duration: Date.now() - startTime };
      
    } catch (error) {
      console.error('❌ 新卡片调度错误:', error);
      throw error;
    }
  }

  /**
   * 查找需要首次调度的新卡片
   */
  async findNewCardsNeedingScheduling() {
    try {
      console.log('🔍 开始查询需要调度的卡片...');
      
      // 获取整个user_progress节点
      const allProgressSnapshot = await this.db.ref('user_progress').once('value');
      
      console.log('📊 查询结果:', {
        exists: allProgressSnapshot.exists(),
        numChildren: allProgressSnapshot.numChildren()
      });
      
      if (!allProgressSnapshot.exists()) {
        console.log('❌ user_progress节点没有任何数据');
        return [];
      }
      
      const newCards = [];
      
      // 手动遍历所有用户
      allProgressSnapshot.forEach(userSnapshot => {
        const userId = userSnapshot.key;
        console.log(`👤 检查用户: ${userId}`);
        
        // 遍历用户的所有卡片
        userSnapshot.forEach(cardSnapshot => {
          const cardId = cardSnapshot.key;
          const progress = cardSnapshot.val();
          
          console.log(`   📄 卡片 ${cardId}:`, {
            needsReschedule: progress.needsReschedule,
            isNewCard: this.isNewCard(progress)
          });
          
          // 手动检查needsReschedule字段
          if (progress.needsReschedule === true && this.isNewCard(progress)) {
            console.log(`   ✅ 发现需要调度的新卡片: ${userId}/${cardId}`);
            newCards.push({
              userId,
              cardId, 
              progress
            });
          }
        });
      });
      
      console.log(`🎯 总共找到 ${newCards.length} 张需要调度的卡片`);
      return newCards;
      
    } catch (error) {
      console.error('💥 查询错误:', error);
      return [];
    }
  }

  /**
   * 判断是否为真正的新卡片
   */
  isNewCard(progress) {
    const isNew = (
      progress.needsReschedule === true &&
      (!progress.repetition || progress.repetition === 0) &&
      (!progress.interval || progress.interval === 0) &&
      (!progress.easeFactor || progress.easeFactor === 2.5) &&
      (!progress.history || progress.history.length === 0)
    );
    
    console.log(`   🔍 检查是否新卡片: ${isNew}`, {
      needsReschedule: progress.needsReschedule,
      repetition: progress.repetition,
      interval: progress.interval,
      easeFactor: progress.easeFactor,
      historyLength: progress.history ? progress.history.length : 0
    });
    
    return isNew;
  }

  /**
   * 为新卡片创建初始调度
   */
  createInitialSchedule(card) {
    try {
      const now = Date.now();
      const nextReviewDate = now + (this.config.initialInterval * 24 * 60 * 60 * 1000);
      
      // 计算初始优先级（新卡片优先级较高）
      const priority = this.calculateInitialPriority(card);
      
      return {
        schedule: {
          repetition: 0,
          interval: this.config.initialInterval,
          easeFactor: this.config.initialEaseFactor,
          nextReviewDate,
          priority,
          lastCalculated: now,
          algorithmVersion: 'initial_v1',
          isNewCard: true
        }
      };
      
    } catch (error) {
      console.error(`创建初始调度错误 ${card.userId}/${card.cardId}:`, error);
      return null;
    }
  }

  /**
   * 计算新卡片的初始优先级
   */
  calculateInitialPriority(card) {
    // 新卡片应该具有较高优先级，让用户尽快开始学习
    const basePriority = 80;
    
    // 可以根据卡片的元数据调整优先级
    // 比如：难度高的卡片优先级稍低，重要的卡片优先级高
    
    return Math.min(Math.max(basePriority, 60), 95);
  }

  /**
   * 手动触发用户的新卡片调度
   */
  async scheduleUserNewCards(userId) {
    try {
      console.log(`🔧 手动触发用户新卡片调度: ${userId}`);
      
      // 获取用户所有进度记录
      const progressSnapshot = await this.db.ref(`user_progress/${userId}`).once('value');
      
      if (!progressSnapshot.exists()) {
        return { success: false, error: '用户没有进度记录' };
      }
      
      const newCards = [];
      
      progressSnapshot.forEach(cardSnapshot => {
        const cardId = cardSnapshot.key;
        const progress = cardSnapshot.val();
        
        if (this.isNewCard(progress)) {
          newCards.push({ userId, cardId, progress });
        }
      });
      
      if (newCards.length === 0) {
        return { success: true, message: '用户没有需要调度的新卡片' };
      }
      
      // 调度这些新卡片
      const updates = {};
      
      newCards.forEach(card => {
        const scheduleResult = this.createInitialSchedule(card);
        
        if (scheduleResult) {
          const schedulePath = `scheduling_queue/${card.userId}/${card.cardId}`;
          updates[schedulePath] = scheduleResult.schedule;
          
          const progressPath = `user_progress/${card.userId}/${card.cardId}`;
          updates[`${progressPath}/needsReschedule`] = false;
          updates[`${progressPath}/repetition`] = 0;
          updates[`${progressPath}/interval`] = 0;
          updates[`${progressPath}/easeFactor`] = this.config.initialEaseFactor;
        }
      });
      
      await this.db.ref().update(updates);
      
      console.log(`✅ 已调度 ${newCards.length} 张新卡片`);
      
      return { 
        success: true, 
        scheduledCount: newCards.length,
        message: `已调度 ${newCards.length} 张新卡片` 
      };
      
    } catch (error) {
      console.error(`❌ 手动调度用户新卡片错误 ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: !!this.scanInterval,
      config: this.config,
      nextScan: this.scanInterval ? Date.now() + this.config.scanInterval : null
    };
  }
}

module.exports = NewCardScheduler;