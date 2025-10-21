// scheduler/EnhancedScheduler.js
const admin = require('firebase-admin');
const UserProgressManager = require('./services/UserProgressManager');
const EnhancedSpacedRepetition = require('./algorithms/EnhancedSpacedRepetition');

class EnhancedScheduler {
  constructor() {
    this.db = admin.database();
    this.progressManager = new UserProgressManager();
    this.algorithm = new EnhancedSpacedRepetition();
    
    this.config = {
      scanInterval: 10 * 60 * 1000,     // 10分钟扫描一次
      knowledgeTreeBatchSize: 20,       // 每次处理的知识树数量
      cardBatchSize: 100,               // 每棵知识树的卡片批次大小
      enableKnowledgeTreeAware: true,   // 启用知识树感知调度
      enableCrossCardOptimization: true // 启用跨卡片优化
    };
    
    this.processedKnowledgeTrees = new Map();
  }

  /**
   * 启动增强调度服务
   */
  start() {
    console.log('🚀 启动增强调度服务（知识树感知）...');
    console.log('📊 增强功能:', {
      knowledgeTreeAware: this.config.enableKnowledgeTreeAware,
      crossCardOptimization: this.config.enableCrossCardOptimization
    });
    
    // 立即执行首次扫描
    this.scanAndScheduleKnowledgeTrees().catch(console.error);
    
    // 定时扫描
    this.scanInterval = setInterval(() => {
      this.scanAndScheduleKnowledgeTrees().catch(console.error);
    }, this.config.scanInterval);
  }

  /**
   * 停止服务
   */
  stop() {
    if (this.scanInterval) clearInterval(this.scanInterval);
    console.log('🛑 增强调度服务已停止');
  }

  /**
   * 扫描并调度知识树级别的复习
   */
  async scanAndScheduleKnowledgeTrees() {
    const startTime = Date.now();
    console.log(`\n🌳 [${new Date().toISOString()}] 开始扫描知识树调度...`);
    
    try {
      // 获取所有活跃用户的知识树进度
      const knowledgeTrees = await this.findKnowledgeTreesNeedingScheduling();
      
      if (knowledgeTrees.length === 0) {
        console.log('✅ 没有需要调度的知识树');
        return { processed: 0, duration: Date.now() - startTime };
      }
      
      let totalScheduled = 0;
      
      // 处理每棵知识树
      for (const tree of knowledgeTrees.slice(0, this.config.knowledgeTreeBatchSize)) {
        const scheduledCount = await this.processKnowledgeTreeScheduling(tree);
        totalScheduled += scheduledCount;
        
        // 标记为已处理
        this.markKnowledgeTreeProcessed(tree.userId, tree.masterId);
      }
      
      const duration = Date.now() - startTime;
      console.log(`🎉 知识树调度完成: 处理了 ${knowledgeTrees.length} 棵知识树, 调度了 ${totalScheduled} 张卡片, 耗时 ${duration}ms`);
      
      return {
        processed: knowledgeTrees.length,
        scheduled: totalScheduled,
        duration
      };
      
    } catch (error) {
      console.error('❌ 知识树调度错误:', error);
      throw error;
    }
  }

  /**
   * 查找需要调度的知识树
   */
  async findKnowledgeTreesNeedingScheduling() {
    try {
      console.log('🔍 查找需要调度的知识树...');
      
      // 获取所有用户进度
      const allProgressSnapshot = await this.db.ref('user_progress').once('value');
      
      if (!allProgressSnapshot.exists()) {
        return [];
      }
      
      const knowledgeTreeMap = new Map();
      
      // 按用户和知识树分组
      allProgressSnapshot.forEach(userSnapshot => {
        const userId = userSnapshot.key;
        
        userSnapshot.forEach(cardSnapshot => {
          const cardId = cardSnapshot.key;
          const progress = cardSnapshot.val();
          
          if (!progress.masterId) return;
          
          const treeKey = `${userId}_${progress.masterId}`;
          
          if (!knowledgeTreeMap.has(treeKey)) {
            knowledgeTreeMap.set(treeKey, {
              userId,
              masterId: progress.masterId,
              cards: [],
              needsScheduling: false
            });
          }
          
          const tree = knowledgeTreeMap.get(treeKey);
          tree.cards.push({ cardId, progress });
          
          // 如果任何卡片需要调度，整棵知识树都需要调度
          if (progress.needsReschedule === true) {
            tree.needsScheduling = true;
          }
        });
      });
      
      // 过滤出需要调度的知识树
      const treesNeedingScheduling = Array.from(knowledgeTreeMap.values())
        .filter(tree => tree.needsScheduling)
        .filter(tree => !this.shouldSkipKnowledgeTree(tree.userId, tree.masterId));
      
      console.log(`📊 找到 ${treesNeedingScheduling.length} 棵需要调度的知识树`);
      
      return treesNeedingScheduling;
      
    } catch (error) {
      console.error('查找知识树错误:', error);
      return [];
    }
  }

  /**
   * 处理单棵知识树的调度
   */
  async processKnowledgeTreeScheduling(knowledgeTree) {
    const { userId, masterId, cards } = knowledgeTree;
    
    try {
      console.log(`🌳 处理知识树: ${userId}/${masterId} (${cards.length} 张卡片)`);
      
      // 获取知识树模板以了解卡片关系
      const treeTemplate = await this.getKnowledgeTreeTemplate(masterId);
      if (!treeTemplate) {
        console.warn(`⚠️ 找不到知识树模板: ${masterId}`);
        return 0;
      }
      
      const updates = {};
      let scheduledCount = 0;
      
      // 处理每张卡片
      for (const { cardId, progress } of cards) {
        if (progress.needsReschedule !== true) continue;
        
        // 获取卡片元数据
        const cardMetadata = this.extractCardMetadata(cardId, treeTemplate);
        
        // 使用增强算法计算调度
        const schedulingResult = this.algorithm.calculateNextReview(
          progress, 
          cardMetadata
        );
        
        if (schedulingResult) {
          scheduledCount++;
          
          // 更新调度队列
          const schedulePath = `scheduling_queue/${userId}/${cardId}`;
          updates[schedulePath] = {
            ...schedulingResult.schedule,
            knowledgeTreeAware: true,
            scheduledBy: 'enhanced_scheduler_v1'
          };
          
          // 更新进度记录
          const progressPath = `user_progress/${userId}/${cardId}`;
          updates[`${progressPath}/needsReschedule`] = false;
          updates[`${progressPath}/lastScheduled`] = Date.now();
          updates[`${progressPath}/scheduledBy`] = 'enhanced_scheduler_v1';
          
          console.log(`   📅 增强调度: ${cardId} -> ${schedulingResult.schedule.interval}天后`);
        }
      }
      
      // 应用跨卡片优化（如果启用）
      if (this.config.enableCrossCardOptimization && scheduledCount > 0) {
        await this.applyCrossCardOptimization(userId, masterId, updates, treeTemplate);
      }
      
      // 批量写入更新
      if (Object.keys(updates).length > 0) {
        await this.db.ref().update(updates);
      }
      
      return scheduledCount;
      
    } catch (error) {
      console.error(`❌ 处理知识树调度错误 ${userId}/${masterId}:`, error);
      return 0;
    }
  }

  /**
   * 应用跨卡片优化
   */
  async applyCrossCardOptimization(userId, masterId, updates, treeTemplate) {
    try {
      console.log(`   🔄 应用跨卡片优化 for ${userId}/${masterId}`);
      
      // 获取知识树的所有调度卡片
      const scheduledCards = Object.keys(updates)
        .filter(path => path.startsWith(`scheduling_queue/${userId}/`))
        .map(path => {
          const cardId = path.split('/').pop();
          return { cardId, schedule: updates[path] };
        });
      
      if (scheduledCards.length <= 1) return;
      
      // 基于卡片关系调整调度
      const optimizedSchedules = this.algorithm.optimizeCardGroupScheduling(
        scheduledCards,
        treeTemplate
      );
      
      // 应用优化后的调度
      optimizedSchedules.forEach(({ cardId, optimizedSchedule }) => {
        const path = `scheduling_queue/${userId}/${cardId}`;
        updates[path] = { ...updates[path], ...optimizedSchedule };
      });
      
    } catch (error) {
      console.error('跨卡片优化错误:', error);
      // 不抛出错误，优化失败不影响基本功能
    }
  }

  /**
   * 从知识树模板提取卡片元数据
   */
  extractCardMetadata(cardId, treeTemplate) {
    const { master_id, core_concept_card, satellite_cards } = treeTemplate;
    
    // 检查是否是核心概念卡
    if (cardId === `${master_id}_core` && core_concept_card) {
      return {
        type: 'core_concept',
        aspect: '核心概念',
        difficulty: 'medium',
        importance: 'high'
      };
    }
    
    // 检查是否是卫星卡
    const satelliteId = cardId.replace(`${master_id}_`, '');
    const satellite = satellite_cards.find(s => s.card_id === satelliteId);
    
    if (satellite) {
      return {
        type: 'satellite', 
        aspect: satellite.aspect,
        difficulty: this.estimateDifficulty(satellite),
        importance: this.estimateImportance(satellite)
      };
    }
    
    // 默认元数据
    return {
      type: 'unknown',
      aspect: '未知',
      difficulty: 'medium',
      importance: 'medium'
    };
  }

  /**
   * 估计卡片难度
   */
  estimateDifficulty(satellite) {
    const quizCount = satellite.quizzes ? satellite.quizzes.length : 0;
    const exampleCount = satellite.examples ? satellite.examples.length : 0;
    
    if (quizCount >= 3 && exampleCount >= 3) return 'hard';
    if (quizCount >= 2 || exampleCount >= 2) return 'medium';
    return 'easy';
  }

  /**
   * 估计卡片重要性
   */
  estimateImportance(satellite) {
    // 可以根据aspect判断重要性
    const importantAspects = ['核心概念', '基本用法', '基础'];
    if (importantAspects.some(aspect => satellite.aspect.includes(aspect))) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * 获取知识树模板
   */
  async getKnowledgeTreeTemplate(masterId) {
    const snapshot = await this.db.ref(`card_templates/${masterId}`).once('value');
    return snapshot.val();
  }

  /**
   * 检查是否应该跳过知识树
   */
  shouldSkipKnowledgeTree(userId, masterId) {
    const key = `${userId}_${masterId}`;
    const lastProcessed = this.processedKnowledgeTrees.get(key);
    
    if (!lastProcessed) return false;
    
    // 30分钟内不重复处理同一知识树
    return (Date.now() - lastProcessed) < (30 * 60 * 1000);
  }

  /**
   * 标记知识树已处理
   */
  markKnowledgeTreeProcessed(userId, masterId) {
    const key = `${userId}_${masterId}`;
    this.processedKnowledgeTrees.set(key, Date.now());
  }

  /**
   * 手动触发知识树调度
   */
  async scheduleUserKnowledgeTree(userId, masterId) {
    try {
      console.log(`🔧 手动触发知识树调度: ${userId}/${masterId}`);
      
      // 标记该知识树的所有卡片需要调度
      const progressSnapshot = await this.db.ref(`user_progress/${userId}`)
        .orderByChild('masterId')
        .equalTo(masterId)
        .once('value');
      
      if (!progressSnapshot.exists()) {
        return { success: false, error: '用户没有该知识树的进度记录' };
      }
      
      const updates = {};
      let markedCount = 0;
      
      progressSnapshot.forEach(cardSnapshot => {
        const cardId = cardSnapshot.key;
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
      console.error(`❌ 手动调度知识树错误 ${userId}/${masterId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: !!this.scanInterval,
      processedKnowledgeTrees: this.processedKnowledgeTrees.size,
      config: this.config,
      nextScan: this.scanInterval ? Date.now() + this.config.scanInterval : null
    };
  }
}

module.exports = EnhancedScheduler;