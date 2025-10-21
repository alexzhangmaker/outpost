const admin = require('firebase-admin');

class SpacedRepetitionScheduler {
  constructor() {
    this.db = admin.database();
    
    // 调度配置
    this.config = {
      scanInterval: 5 * 60 * 1000,     // 5分钟扫描一次
      rescanInterval: 30 * 60 * 1000,  // 30分钟重新扫描用户
      batchSize: 100,                  // 每次处理批次大小
      maxRetries: 3                    // 最大重试次数
    };
    
    // 缓存已处理的用户，避免重复处理
    this.processedUsers = new Map();
    this.retryCounts = new Map();
  }

  /**
   * 启动调度服务
   */
  start() {
    console.log('🚀 启动间隔重复调度服务...');
    console.log(`📊 配置: 扫描间隔 ${this.config.scanInterval/1000}秒, 批次大小 ${this.config.batchSize}`);
    
    // 立即执行首次扫描
    this.scanAndReschedule().catch(console.error);
    
    // 定时扫描需要调度的卡片
    this.scanInterval = setInterval(() => {
      this.scanAndReschedule().catch(console.error);
    }, this.config.scanInterval);
    
    // 定期清理缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanupProcessedUsers();
    }, this.config.rescanInterval);
  }

  /**
   * 停止调度服务
   */
  stop() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    console.log('🛑 间隔重复调度服务已停止');
  }

  /**
   * 扫描并重新调度需要处理的卡片
   */
  async scanAndReschedule() {
    const startTime = Date.now();
    console.log(`🕐 [${new Date().toISOString()}] 开始扫描需要调度的卡片...`);
    
    try {
      // 查找所有标记为需要调度的进度记录
      const progressSnapshot = await this.db.ref('user_progress')
        .orderByChild('needsReschedule')
        .equalTo(true)
        .limitToFirst(this.config.batchSize)
        .once('value');
      
      if (!progressSnapshot.exists()) {
        console.log('✅ 没有需要调度的卡片');
        return { processed: 0, duration: Date.now() - startTime };
      }
      
      const updates = {};
      const progressUpdates = {};
      let processedCount = 0;
      
      // 处理每个用户的卡片
      progressSnapshot.forEach(userProgressSnapshot => {
        const userPath = userProgressSnapshot.ref.path;
        const userId = userPath.split('/')[1];
        
        // 检查是否最近处理过该用户（避免频繁处理）
        if (this.shouldSkipUser(userId)) {
          return;
        }
        
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
            processedCount++;
            
            // 更新调度队列
            const schedulePath = `scheduling_queue/${userId}/${cardId}`;
            updates[schedulePath] = schedulingResult.schedule;
            
            // 清除需要调度标志并更新元数据
            progressUpdates[`${userPath}/${cardId}/needsReschedule`] = false;
            progressUpdates[`${userPath}/${cardId}/lastScheduled`] = Date.now();
            progressUpdates[`${userPath}/${cardId}/scheduledBy`] = 'scheduler_v1';
            
            console.log(`📅 调度卡片: ${userId}/${cardId} -> ${schedulingResult.schedule.interval}天后`);
          }
        });
        
        // 标记用户已处理
        this.markUserProcessed(userId);
      });
      
      // 批量写入更新
      if (Object.keys(updates).length > 0) {
        await this.db.ref().update({
          ...updates,
          ...progressUpdates
        });
        
        const duration = Date.now() - startTime;
        console.log(`🎉 调度完成: 成功调度 ${processedCount} 张卡片, 耗时 ${duration}ms`);
        
        return { 
          processed: processedCount, 
          duration,
          timestamp: Date.now()
        };
      } else {
        console.log('ℹ️ 没有卡片需要更新调度');
        return { processed: 0, duration: Date.now() - startTime };
      }
      
    } catch (error) {
      console.error('❌ 调度扫描错误:', error);
      throw error;
    }
  }

  /**
   * 处理单个卡片的重新调度
   */
  processRescheduling(userId, cardId, progress) {
    try {
      // 检查必要的数据完整性
      if (!progress.lastReviewed) {
        console.warn(`⚠️ 卡片缺少lastReviewed: ${userId}/${cardId}`);
        return null;
      }

      // 从进度数据中提取调度参数
      const currentState = {
        repetition: progress.repetition || 0,
        interval: progress.interval || 0,
        easeFactor: progress.easeFactor || 2.5,
        lastReviewed: progress.lastReviewed
      };

      // 计算质量分数（基于主观评分和Quiz结果）
      const quality = this.calculateQualityScore(progress);
      
      if (quality === null) {
        console.warn(`⚠️ 无法计算质量分数: ${userId}/${cardId}`);
        return null;
      }

      // 使用间隔重复算法计算新调度
      const newSchedule = this.calculateNextReview(currentState, quality);
      
      // 计算优先级
      const priority = this.calculatePriority(newSchedule, quality, progress);
      
      return {
        schedule: {
          ...newSchedule,
          priority,
          lastCalculated: Date.now(),
          algorithmVersion: 'sm2_v1'
        }
      };
      
    } catch (error) {
      console.error(`❌ 调度卡片错误 ${userId}/${cardId}:`, error);
      return null;
    }
  }

  /**
   * 计算质量分数（基于主观评分和Quiz结果）
   */
  calculateQualityScore(progress) {
    const subjectiveScore = progress.subjectiveScore;
    const quizResults = progress.quizResults;
    
    // 验证数据完整性
    if (subjectiveScore === undefined || subjectiveScore === null) {
      return null;
    }
    
    if (!quizResults || quizResults.total === 0) {
      return subjectiveScore; // 只有主观评分
    }
    
    const quizScore = quizResults.correct / quizResults.total;
    
    // 融合算法：主观评分权重0.4，Quiz结果权重0.6
    const quizMapped = 1 + (quizScore * 4); // 映射到1-5分
    const quality = (quizMapped * 0.6) + (subjectiveScore * 0.4);
    
    // 处理矛盾情况
    if (subjectiveScore >= 4 && quizScore < 0.8) {
      return Math.min(quality, 3.0); // 惩罚主观高估
    }
    
    if (subjectiveScore <= 2 && quizScore > 0.9) {
      return Math.max(quality, 4.0); // 鼓励主观低估
    }
    
    return Math.round(quality * 100) / 100; // 保留两位小数
  }

  /**
   * 基于SM-2算法计算下次复习
   */
  calculateNextReview(currentState, quality) {
    let { repetition, interval, easeFactor } = currentState;
    
    // SM-2算法核心逻辑
    if (quality < 3) {
      // 答得不好，重置
      repetition = 0;
      interval = 1;
    } else {
      // 答得好，推进
      repetition += 1;
      
      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }
    
    // 更新简易度因子
    easeFactor = this.calculateNewEaseFactor(easeFactor, quality);
    
    // 计算下次复习日期
    const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);
    
    return {
      repetition,
      interval,
      easeFactor: Math.round(easeFactor * 100) / 100,
      nextReviewDate,
      lastQuality: quality
    };
  }

  /**
   * 计算新的简易度因子
   */
  calculateNewEaseFactor(currentEaseFactor, quality) {
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    const newEaseFactor = currentEaseFactor + delta;
    
    // 限制简易度因子范围
    return Math.max(1.3, Math.min(newEaseFactor, 2.5));
  }

  /**
   * 计算复习优先级
   */
  calculatePriority(schedule, quality, progress) {
    const now = Date.now();
    const daysUntilDue = Math.max(0, (schedule.nextReviewDate - now) / (1000 * 60 * 60 * 24));
    
    // 基于多种因素的优先级计算
    const factors = {
      urgency: Math.max(0, 10 - daysUntilDue) * 10,           // 紧迫性（0-100）
      difficulty: (5 - quality) * 8,                          // 难度（0-40）
      stability: Math.log(1 + schedule.interval) * 5,         // 稳定性（0-∞）
      importance: progress.quizResults?.correct < progress.quizResults?.total * 0.8 ? 20 : 5 // 重要性
    };
    
    const priority = Object.values(factors).reduce((sum, factor) => sum + factor, 0);
    
    // 限制优先级范围
    return Math.min(Math.max(priority, 0), 100);
  }

  /**
   * 检查是否应该跳过用户（避免频繁处理）
   */
  shouldSkipUser(userId) {
    const lastProcessed = this.processedUsers.get(userId);
    if (!lastProcessed) return false;
    
    // 30分钟内不重复处理同一用户
    return (Date.now() - lastProcessed) < (30 * 60 * 1000);
  }

  /**
   * 标记用户已处理
   */
  markUserProcessed(userId) {
    this.processedUsers.set(userId, Date.now());
  }

  /**
   * 清理过期的用户缓存
   */
  cleanupProcessedUsers() {
    const now = Date.now();
    const expirationTime = 60 * 60 * 1000; // 1小时过期
    
    for (const [userId, timestamp] of this.processedUsers.entries()) {
      if (now - timestamp > expirationTime) {
        this.processedUsers.delete(userId);
      }
    }
    
    console.log(`🧹 清理缓存后剩余用户: ${this.processedUsers.size}`);
  }

  /**
   * 手动触发用户调度（用于新用户初始化等）
   */
  async rescheduleUser(userId) {
    try {
      console.log(`🔧 手动触发用户调度: ${userId}`);
      
      // 获取用户所有进度记录
      const progressSnapshot = await this.db.ref(`user_progress/${userId}`).once('value');
      
      if (!progressSnapshot.exists()) {
        return { success: false, error: '用户没有进度记录' };
      }
      
      const updates = {};
      let markedCount = 0;
      
      progressSnapshot.forEach(cardSnapshot => {
        const cardId = cardSnapshot.key;
        
        // 标记所有卡片需要重新调度
        updates[`user_progress/${userId}/${cardId}/needsReschedule`] = true;
        markedCount++;
      });
      
      await this.db.ref().update(updates);
      
      console.log(`✅ 已标记 ${markedCount} 张卡片需要重新调度`);
      
      return { 
        success: true, 
        markedCount,
        message: `已标记 ${markedCount} 张卡片需要重新调度` 
      };
      
    } catch (error) {
      console.error(`❌ 重新调度用户错误 ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取调度服务状态
   */
  getStatus() {
    return {
      isRunning: !!this.scanInterval,
      processedUsers: this.processedUsers.size,
      config: this.config,
      nextScan: this.scanInterval ? Date.now() + this.config.scanInterval : null
    };
  }
}


class EnhancedSpacedRepetitionScheduler {
  /**
   * 增强的调度算法 - 考虑卡片类型和难度
   */
  calculateNextReview(currentState, quality, cardMetadata) {
    let { repetition, interval, easeFactor } = currentState;
    const { type, difficulty } = cardMetadata;
    
    // 基础SM-2算法
    if (quality < 3) {
      repetition = 0;
      interval = 1;
    } else {
      repetition += 1;
      
      if (repetition === 1) {
        interval = 1;
      } else if (repetition === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    }
    
    // 根据卡片类型和难度调整间隔
    interval = this.adjustIntervalByCardType(interval, type, difficulty, quality);
    
    // 更新简易度因子（考虑难度）
    easeFactor = this.calculateNewEaseFactor(easeFactor, quality, difficulty);
    
    const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);
    
    return {
      repetition,
      interval,
      easeFactor: Math.round(easeFactor * 100) / 100,
      nextReviewDate,
      lastQuality: quality
    };
  }
  
  /**
   * 根据卡片类型调整间隔
   */
  adjustIntervalByCardType(interval, type, difficulty, quality) {
    let multiplier = 1.0;
    
    // 核心概念卡需要更频繁的复习
    if (type === 'core_concept') {
      multiplier = 0.8; // 缩短20%间隔
    }
    
    // 难度高的卡片需要更频繁的复习
    if (difficulty === 'hard') {
      multiplier *= 0.9;
    } else if (difficulty === 'easy') {
      multiplier *= 1.1;
    }
    
    // 质量低的卡片需要更频繁的复习
    if (quality < 4) {
      multiplier *= 0.9;
    }
    
    return Math.max(1, Math.round(interval * multiplier));
  }
  
  /**
   * 增强的简易度因子计算
   */
  calculateNewEaseFactor(currentEaseFactor, quality, difficulty) {
    let delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    
    // 难度高的卡片简易度因子增长更慢
    if (difficulty === 'hard') {
      delta *= 0.8;
    } else if (difficulty === 'easy') {
      delta *= 1.2;
    }
    
    const newEaseFactor = currentEaseFactor + delta;
    return Math.max(1.3, Math.min(newEaseFactor, 2.5));
  }
  
  /**
   * 知识树级别的优先级计算
   */
  calculateKnowledgeTreePriority(userId, masterId, cardProgress) {
    const progressArray = Object.values(cardProgress);
    
    // 计算知识树的整体掌握度
    const totalCards = progressArray.length;
    const dueCards = progressArray.filter(p => 
      (p.nextReviewDate || 0) <= Date.now()
    ).length;
    
    const avgQuality = progressArray.reduce((sum, p) => 
      sum + (p.averageQuality || 0), 0
    ) / totalCards;
    
    // 基于整体掌握度计算优先级
    const masteryFactor = (5 - avgQuality) * 10; // 掌握度越低，优先级越高
    const urgencyFactor = dueCards * 5; // 到期卡片越多，优先级越高
    
    return masteryFactor + urgencyFactor;
  }
}


//module.exports = { SpacedRepetitionScheduler,EnhancedSpacedRepetitionScheduler} 
module.exports = SpacedRepetitionScheduler;