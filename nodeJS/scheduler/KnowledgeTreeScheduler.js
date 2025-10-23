const admin = require('firebase-admin');
const KnowledgeTreeScorer = require('./algorithms/KnowledgeTreeScorer');

class KnowledgeTreeScheduler {
  constructor() {
    this.db = admin.database();
    this.scorer = new KnowledgeTreeScorer();
    
    this.config = {
      scanInterval: 5 * 60 * 1000,     // 5分钟扫描一次
      batchSize: 100,                  // 每次处理的review log数量
      lookbackDays: 30                 // 只处理最近30天的记录
    };
    
    this.processedLogs = new Set();
  }

  /**
   * 启动调度服务（基于reviewLog）
   */
  start() {
    console.log('🌳 启动知识树调度服务（基于reviewLog）...');
    
    // 立即执行首次扫描
    this.scanAndScheduleFromReviewLog().catch(console.error);
    
    // 定时扫描
    this.scanInterval = setInterval(() => {
      this.scanAndScheduleFromReviewLog().catch(console.error);
    }, this.config.scanInterval);
  }

  stop(){
    console.log("will stop KnowledgeTreeScheduler") ;
  }

  /**
   * 从reviewLog扫描并调度
   */
  async scanAndScheduleFromReviewLog() {
    const startTime = Date.now();
    console.log(`\n🕐 [${new Date().toISOString()}] 扫描reviewLog...`);
    
    try {
      // 查找需要调度的review记录
      const reviewLogs = await this.findReviewLogsNeedingScheduling();
      
      if (reviewLogs.length === 0) {
        console.log('✅ 没有需要调度的review记录');
        return { processed: 0, duration: Date.now() - startTime };
      }
      
      let totalScheduled = 0;
      
      // 处理每个review记录
      for (const reviewLog of reviewLogs.slice(0, this.config.batchSize)) {
        const scheduled = await this.processReviewLogScheduling(reviewLog);
        if (scheduled) totalScheduled++;
        
        this.markLogProcessed(reviewLog.logId);
      }
      
      const duration = Date.now() - startTime;
      console.log(`🎉 调度完成: 处理了 ${reviewLogs.length} 条review记录, 调度了 ${totalScheduled} 棵知识树, 耗时 ${duration}ms`);
      
      return {
        processed: reviewLogs.length,
        scheduled: totalScheduled,
        duration
      };
      
    } catch (error) {
      console.error('❌ reviewLog调度错误:', error);
      throw error;
    }
  }

  /**
   * 查找需要调度的review记录
   */
  async findReviewLogsNeedingScheduling() {
    try {
      const snapshot = await this.db.ref('reviewLog').once('value');
      const allReviewLogs = snapshot.val() || {};
      
      const logsNeedingScheduling = [];
      const now = Date.now();
      const cutoffTime = now - (this.config.lookbackDays * 24 * 60 * 60 * 1000);
      
      // 遍历所有用户和记录
      for (const [userId, userLogs] of Object.entries(allReviewLogs)) {
        for (const [logId, logEntries] of Object.entries(userLogs)) {
          // 跳过已处理的记录
          if (this.processedLogs.has(`${userId}/${logId}`)) continue;
          
          for (const [masterId, reviewData] of Object.entries(logEntries)) {
            // 检查是否需要调度
            if (this.shouldScheduleFromReview(reviewData, cutoffTime)) {
              logsNeedingScheduling.push({
                userId,
                logId,
                masterId,
                reviewData,
                timestamp: reviewData.timestamp
              });
            }
          }
        }
      }
      
      // 按时间排序（最早的先处理）
      logsNeedingScheduling.sort((a, b) => a.timestamp - b.timestamp);
      
      console.log(`📊 找到 ${logsNeedingScheduling.length} 条需要调度的review记录`);
      
      return logsNeedingScheduling;
      
    } catch (error) {
      console.error('查找review记录错误:', error);
      return [];
    }
  }

  /**
   * 判断是否需要从review记录调度
   */
  shouldScheduleFromReview(reviewData, cutoffTime) {
    // 检查时间戳（只处理最近的数据）
    if (reviewData.timestamp < cutoffTime) {
      return false;
    }
    
    // 检查是否标记为需要调度
    if (reviewData.assessment && reviewData.assessment.needs_reschedule === true) {
      return true;
    }
    
    // 如果没有assessment字段，默认需要调度
    return !reviewData.assessment;
  }

  /**
   * 处理单条review记录的调度
   */
  async processReviewLogScheduling(reviewLog) {
    const { userId, masterId, reviewData, logId } = reviewLog;
    
    try {
      console.log(`🌳 处理review记录: ${userId}/${masterId} (${logId})`);
      
      // 获取用户当前的知识树进度
      const userProgress = await this.getUserKnowledgeTreeProgress(userId, masterId);
      
      // 从review数据计算质量分数
      const qualityScore = this.calculateQualityFromReview(reviewData);
      
      // 计算下次复习时间
      const schedulingResult = this.calculateNextReviewSchedule(userProgress, qualityScore, reviewData);
      
      // 创建更新对象 - 修复这里，传递正确的logId
      const updates = this.createScheduleUpdates(userId, masterId, schedulingResult, reviewData, logId);
      
      // 标记review记录为已处理
      const reviewLogPath = `reviewLog/${userId}/${logId}/${masterId}`;
      updates[`${reviewLogPath}/assessment/needs_reschedule`] = false;
      updates[`${reviewLogPath}/assessment/scheduled_at`] = Date.now();
      updates[`${reviewLogPath}/assessment/scheduling_result`] = schedulingResult;
      
      console.log('📝 即将写入的更新路径:', Object.keys(updates));
      
      // 调试：检查所有值是否有效
      this.validateUpdates(updates);
      
      // 使用update方法批量写入所有更新
      await this.db.ref().update(updates);
      
      console.log(`   ✅ 已调度: ${qualityScore}分 -> ${schedulingResult.interval}天后`);
      return true;
      
    } catch (error) {
      console.error(`❌ 处理review记录错误 ${userId}/${masterId}:`, error);
      return false;
    }
  }

/**
   * 验证更新对象中的所有值
   */
  validateUpdates(updates) {
    console.log('🔍 验证更新对象...');
    let hasErrors = false;
    
    Object.keys(updates).forEach(path => {
      const value = updates[path];
      
      // 检查值是否为undefined
      if (value === undefined) {
        console.error(`❌ 路径 ${path} 的值为 undefined`);
        hasErrors = true;
        return;
      }
      
      // 如果是对象，递归检查所有属性
      if (typeof value === 'object' && value !== null) {
        this.validateObjectProperties(value, path);
      }
    });
    
    if (hasErrors) {
      throw new Error('更新对象包含无效值');
    }
    
    console.log('✅ 所有更新值验证通过');
  }

  /**
   * 验证对象属性
   */
  validateObjectProperties(obj, path) {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        console.error(`❌ 对象 ${path} 的属性 ${key} 为 undefined`);
        throw new Error(`属性 ${key} 不能为 undefined`);
      }
    });
  }


  /**
   * 从review数据计算质量分数 - 添加防御性编程
   */
  calculateQualityFromReview(reviewData) {
    if (!reviewData) {
      console.warn('⚠️ reviewData为空，使用默认质量分数3.0');
      return 3.0;
    }
    
    const { core_concept_card, satellite_cards, assessment } = reviewData;
    
    // 如果已经有评估分数，直接使用
    if (assessment && assessment.overall_score !== undefined) {
      return Math.max(1, Math.min(assessment.overall_score, 5));
    }
    
    // 否则基于评分计算
    let totalScore = 0;
    let totalWeight = 0;
    
    // 主卡评分（权重0.3）
    if (core_concept_card && core_concept_card.rating !== undefined) {
      const rating = Math.max(1, Math.min(core_concept_card.rating, 5));
      totalScore += rating * 0.3;
      totalWeight += 0.3;
    }
    
    // 卫星卡平均评分（权重0.7）
    if (satellite_cards && Array.isArray(satellite_cards) && satellite_cards.length > 0) {
      let validSatellites = 0;
      let satelliteSum = 0;
      
      satellite_cards.forEach(card => {
        if (card && card.rating !== undefined) {
          const rating = Math.max(1, Math.min(card.rating, 5));
          satelliteSum += rating;
          validSatellites++;
        }
      });
      
      if (validSatellites > 0) {
        const satelliteAvg = satelliteSum / validSatellites;
        totalScore += satelliteAvg * 0.7;
        totalWeight += 0.7;
      }
    }
    
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 3.0;
    return Math.max(1, Math.min(finalScore, 5));
  }
/**
   * 计算下次复习计划 - 添加防御性编程
   */
  calculateNextReviewSchedule(userProgress, qualityScore, reviewData) {
    // 确保qualityScore在有效范围内
    const validQualityScore = Math.max(1, Math.min(qualityScore, 5));
    
    // 获取当前状态，提供默认值
    const currentState = userProgress || {
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      lastReviewed: reviewData?.timestamp || Date.now()
    };
    
    // 确保所有数值有效
    let repetition = Math.max(0, currentState.repetition || 0);
    let interval = Math.max(0, currentState.interval || 0);
    let easeFactor = Math.max(1.3, Math.min(currentState.easeFactor || 2.5, 2.5));
    
    // 基于SM-2算法计算
    if (validQualityScore < 3) {
      // 掌握不好，重置
      repetition = 0;
      interval = 1;
    } else {
      // 掌握良好，推进
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
    easeFactor = this.calculateNewEaseFactor(easeFactor, validQualityScore);
    
    const nextReviewDate = Date.now() + (interval * 24 * 60 * 60 * 1000);
    
    return {
      repetition,
      interval,
      easeFactor: Math.round(easeFactor * 100) / 100,
      nextReviewDate,
      qualityScore: validQualityScore,
      lastReviewed: currentState.lastReviewed
    };
  }


  /**
   * 计算新的简易度因子
   */
  calculateNewEaseFactor(currentEaseFactor, quality) {
    const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    const newEaseFactor = currentEaseFactor + delta;
    return Math.max(1.3, Math.min(newEaseFactor, 2.5));
  }

  /**
   * 创建调度更新 - 修复这个方法，添加logId参数
   */
  createScheduleUpdates(userId, masterId, schedulingResult, reviewData, logId) {
    const updates = {};
    const cardIds = this.extractCardIdsFromReview(reviewData);
    
    console.log(`   📋 为知识树 ${masterId} 调度 ${cardIds.length} 张卡片`);
    
    // 为知识树的所有卡片创建相同的调度
    cardIds.forEach(cardId => {
      // 更新调度队列 - 修复sourceLogId的值
      const schedulePath = `scheduling_queue/${userId}/${cardId}`;
      updates[schedulePath] = {
        repetition: schedulingResult.repetition,
        interval: schedulingResult.interval,
        easeFactor: schedulingResult.easeFactor,
        nextReviewDate: schedulingResult.nextReviewDate,
        lastQuality: schedulingResult.qualityScore,
        masterId: masterId,
        scheduledFrom: 'review_log',
        scheduledAt: Date.now(),
        sourceLogId: logId || 'unknown' // 使用参数logId，确保不为undefined
      };
      
      // 更新用户进度
      const progressPath = `user_progress/${userId}/${cardId}`;
      
      // 构建进度更新，保留现有字段
      const progressUpdate = {
        masterId: masterId,
        lastReviewed: reviewData.timestamp || Date.now(),
        repetition: schedulingResult.repetition,
        interval: schedulingResult.interval,
        easeFactor: schedulingResult.easeFactor,
        lastQuality: schedulingResult.qualityScore,
        updatedAt: Date.now()
      };
      
      // 如果卡片之前没有进度记录，添加创建时间
      if (!reviewData.existingProgress) {
        progressUpdate.createdAt = Date.now();
        progressUpdate.status = 'active';
      }
      
      updates[progressPath] = progressUpdate;
      
      console.log(`   📅 卡片 ${cardId}: ${schedulingResult.interval}天后`);
    });
    
    return updates;
  }
  

  /**
   * 从review数据提取卡片ID - 修复这个方法
   */
  extractCardIdsFromReview(reviewData) {
    const cardIds = [];
    const masterId = reviewData.master_id;
    
    if (!masterId) {
      console.warn('⚠️ review数据缺少master_id');
      return cardIds;
    }
    
    // 主卡
    if (reviewData.core_concept_card) {
      cardIds.push(`${masterId}_core`);
    }
    
    // 卫星卡
    if (reviewData.satellite_cards && Array.isArray(reviewData.satellite_cards)) {
      reviewData.satellite_cards.forEach(satellite => {
        if (satellite.card_id) {
          cardIds.push(`${masterId}_${satellite.card_id}`);
        } else {
          console.warn('⚠️ 卫星卡缺少card_id');
        }
      });
    }
    
    console.log(`   🃏 从review提取到卡片ID:`, cardIds);
    return cardIds;
  }

  /**
   * 获取用户知识树进度
   */
  async getUserKnowledgeTreeProgress(userId, masterId) {
    try {
      const snapshot = await this.db.ref(`user_progress/${userId}`)
        .orderByChild('masterId')
        .equalTo(masterId)
        .once('value');
      
      const progress = snapshot.val() || {};
      
      // 返回第一个卡片的进度作为代表（因为整棵树共享相同调度）
      const firstCard = Object.values(progress)[0];
      return firstCard || null;
      
    } catch (error) {
      console.error(`获取用户进度错误 ${userId}/${masterId}:`, error);
      return null;
    }
  }

  /**
   * 标记记录为已处理
   */
  markLogProcessed(logId) {
    this.processedLogs.add(logId);
    
    // 清理过期的记录（避免内存泄漏）
    if (this.processedLogs.size > 1000) {
      const array = Array.from(this.processedLogs);
      this.processedLogs = new Set(array.slice(-500));
    }
  }

  /**
   * 调试方法：检查updates对象的结构
   */
  debugUpdates(updates) {
    console.log('🔍 调试updates对象:');
    Object.keys(updates).forEach(path => {
      console.log(`   📍 ${path}:`, typeof updates[path]);
    });
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: !!this.scanInterval,
      processedLogs: this.processedLogs.size,
      config: this.config,
      nextScan: this.scanInterval ? Date.now() + this.config.scanInterval : null
    };
  }
}

module.exports = KnowledgeTreeScheduler;