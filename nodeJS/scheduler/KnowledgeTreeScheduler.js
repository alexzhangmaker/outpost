const admin = require('firebase-admin');
const KnowledgeTreeScorer = require('./algorithms/KnowledgeTreeScorer');
const EnhancedSpacedRepetition = require('./algorithms/EnhancedSpacedRepetition');

class KnowledgeTreeScheduler {
  constructor() {
    this.db = admin.database();
    this.scorer = new KnowledgeTreeScorer();
    this.algorithm = new EnhancedSpacedRepetition();
    
    this.config = {
      scanInterval: 5 * 60 * 1000,     // 5分钟扫描一次
      batchSize: 50,                   // 每次处理的知识树数量
      enableAdaptiveStrategy: true     // 启用自适应评分策略
    };
    
    this.processedTrees = new Map();
  }

  /**
   * 启动知识树调度服务
   */
  start() {
    console.log('🌳 启动知识树调度服务...');
    console.log('📊 配置:', {
      scanInterval: `${this.config.scanInterval/1000}秒`,
      batchSize: this.config.batchSize,
      adaptiveStrategy: this.config.enableAdaptiveStrategy
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
    console.log('🛑 知识树调度服务已停止');
  }

  /**
   * 扫描并调度知识树
   */
  async scanAndScheduleKnowledgeTrees() {
    const startTime = Date.now();
    console.log(`\n🕐 [${new Date().toISOString()}] 扫描知识树...`);
    
    try {
      // 查找需要调度的知识树
      const knowledgeTrees = await this.findKnowledgeTreesNeedingScheduling();
      
      if (knowledgeTrees.length === 0) {
        console.log('✅ 没有需要调度的知识树');
        return { processed: 0, duration: Date.now() - startTime };
      }
      
      let totalScheduled = 0;
      
      // 处理每棵知识树
      for (const tree of knowledgeTrees.slice(0, this.config.batchSize)) {
        const scheduled = await this.processKnowledgeTreeScheduling(tree);
        if (scheduled) totalScheduled++;
        
        this.markTreeProcessed(tree.userId, tree.masterId);
      }
      
      const duration = Date.now() - startTime;
      console.log(`🎉 知识树调度完成: 处理了 ${knowledgeTrees.length} 棵知识树, 耗时 ${duration}ms`);
      
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
      console.log(`🌳 处理知识树: ${userId}/${masterId}`);
      
      // 分离主卡和卫星卡
      const { masterCard, satelliteCards } = this.separateCards(cards);
      
      // 计算知识树整体掌握分数
      const masteryResult = this.scorer.calculateMasteryScore({
        masterCard,
        satelliteCards
      });
      
      console.log(`   📊 知识树掌握分数: ${masteryResult.score} (策略: ${masteryResult.strategy})`);
      
      // 使用整体分数计算下次复习时间
      const schedulingResult = this.algorithm.calculateNextReview(
        this.getTreeCurrentState(masterCard, satelliteCards),
        { 
          type: 'knowledge_tree',
          overallScore: masteryResult.score,
          recommendation: masteryResult.recommendation
        }
      );
      
      // 为知识树的所有卡片创建相同的调度
      const updates = this.createTreeWideSchedule(
        userId, 
        masterId, 
        cards, 
        schedulingResult,
        masteryResult
      );
      
      // 批量写入更新
      if (Object.keys(updates).length > 0) {
        await this.db.ref().update(updates);
        console.log(`   ✅ 已调度知识树: ${masteryResult.recommendation.message}`);
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error(`❌ 处理知识树调度错误 ${userId}/${masterId}:`, error);
      return false;
    }
  }

  /**
   * 分离主卡和卫星卡
   */
  separateCards(cards) {
    const masterCard = cards.find(card => 
      card.cardId.endsWith('_core') || card.progress.cardType === 'core_concept'
    );
    
    const satelliteCards = cards.filter(card => 
      !card.cardId.endsWith('_core') && card.progress.cardType !== 'core_concept'
    );
    
    return { masterCard, satelliteCards };
  }

  /**
   * 获取知识树当前状态（用于调度算法）
   */
  getTreeCurrentState(masterCard, satelliteCards) {
    // 使用主卡的状态代表整棵树，或者计算平均状态
    if (masterCard) {
      return masterCard.progress;
    } else if (satelliteCards.length > 0) {
      // 如果没有主卡，使用第一个卫星卡的状态
      return satelliteCards[0].progress;
    }
    
    // 默认状态
    return {
      repetition: 0,
      interval: 0,
      easeFactor: 2.5
    };
  }

  /**
   * 为整棵知识树创建统一的调度
   */
  createTreeWideSchedule(userId, masterId, cards, schedulingResult, masteryResult) {
    const updates = {};
    
    cards.forEach(({ cardId, progress }) => {
      if (progress.needsReschedule !== true) return;
      
      // 更新调度队列
      const schedulePath = `scheduling_queue/${userId}/${cardId}`;
      updates[schedulePath] = {
        ...schedulingResult.schedule,
        knowledgeTreeMasterId: masterId,
        treeOverallScore: masteryResult.score,
        scheduledBy: 'knowledge_tree_scheduler'
      };
      
      // 更新进度记录
      const progressPath = `user_progress/${userId}/${cardId}`;
      updates[`${progressPath}/needsReschedule`] = false;
      updates[`${progressPath}/lastScheduled`] = Date.now();
      updates[`${progressPath}/scheduledBy`] = 'knowledge_tree_scheduler';
      updates[`${progressPath}/treeOverallScore`] = masteryResult.score;
      
      console.log(`   📅 卡片 ${cardId} -> ${schedulingResult.schedule.interval}天后`);
    });
    
    return updates;
  }

  /**
   * 检查是否应该跳过知识树
   */
  shouldSkipKnowledgeTree(userId, masterId) {
    const key = `${userId}_${masterId}`;
    const lastProcessed = this.processedTrees.get(key);
    
    if (!lastProcessed) return false;
    
    // 30分钟内不重复处理同一知识树
    return (Date.now() - lastProcessed) < (30 * 60 * 1000);
  }

  /**
   * 标记知识树已处理
   */
  markTreeProcessed(userId, masterId) {
    const key = `${userId}_${masterId}`;
    this.processedTrees.set(key, Date.now());
  }

  /**
   * 动态更新评分策略
   */
  setScoringStrategy(strategyName) {
    return this.scorer.setScoringStrategy(strategyName);
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      isRunning: !!this.scanInterval,
      processedTrees: this.processedTrees.size,
      scorerConfig: this.scorer.getConfig(),
      config: this.config,
      nextScan: this.scanInterval ? Date.now() + this.config.scanInterval : null
    };
  }
}

module.exports = KnowledgeTreeScheduler;