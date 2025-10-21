// scheduler/services/UserProgressManager.js
const admin = require('firebase-admin');

class UserProgressManager {
  constructor() {
    this.db = admin.database();
  }

  /**
   * 初始化用户的知识树进度（调度服务调用）
   */
  async initializeUserKnowledgeTree(userId, knowledgeTree) {
    const templates = this.generateCardTemplates(knowledgeTree);
    const progressUpdates = {};
    
    Object.values(templates).forEach(template => {
      const progressPath = `user_progress/${userId}/${template.cardId}`;
      progressUpdates[progressPath] = {
        needsReschedule: true,
        cardType: template.type,
        masterId: template.masterId,
        aspect: template.metadata.aspect,
        createdAt: Date.now(),
        repetition: 0,
        interval: 0,
        easeFactor: 2.5,
        status: 'active',
        scheduledBy: 'progress_manager_v1'
      };
    });
    
    await this.db.ref().update(progressUpdates);
    
    // 记录初始化日志
    console.log(`✅ 为用户 ${userId} 初始化知识树 ${knowledgeTree.master_id}: ${Object.keys(templates).length} 张卡片`);
    
    return Object.keys(templates);
  }
  
  /**
   * 获取知识树的所有卡片ID（供调度服务使用）
   */
  extractCardIdsFromKnowledgeTree(knowledgeTree) {
    const cardIds = [];
    const { master_id, core_concept_card, satellite_cards } = knowledgeTree;
    
    if (core_concept_card) {
      cardIds.push(`${master_id}_core`);
    }
    
    satellite_cards.forEach(satellite => {
      cardIds.push(`${master_id}_${satellite.card_id}`);
    });
    
    return cardIds;
  }
  
  /**
   * 批量更新用户进度（调度算法调用）
   */
  async batchUpdateUserProgress(progressUpdates) {
    const updates = {};
    
    progressUpdates.forEach(({ userId, cardId, progressData }) => {
      const path = `user_progress/${userId}/${cardId}`;
      updates[path] = {
        ...progressData,
        updatedAt: Date.now()
      };
    });
    
    await this.db.ref().update(updates);
    return progressUpdates.length;
  }
  
  /**
   * 获取用户的知识树统计（供调度优先级计算）
   */
  async getUserKnowledgeTreeStats(userId, masterId) {
    const progressSnapshot = await this.db.ref(`user_progress/${userId}`)
      .orderByChild('masterId')
      .equalTo(masterId)
      .once('value');
    
    const progressData = progressSnapshot.val() || {};
    const cards = Object.values(progressData);
    
    const totalCards = cards.length;
    const activeCards = cards.filter(card => card.status === 'active').length;
    const dueCards = cards.filter(card => 
      (card.nextReviewDate || 0) <= Date.now()
    ).length;
    
    const avgQuality = totalCards > 0 ? 
      cards.reduce((sum, card) => sum + (card.averageQuality || 0), 0) / totalCards : 0;
    
    return {
      totalCards,
      activeCards,
      dueCards,
      averageQuality: Math.round(avgQuality * 100) / 100,
      masteryPercentage: totalCards > 0 ? (activeCards / totalCards) * 100 : 0
    };
  }

  /**
   * 内部方法：生成卡片模板（与Web App侧逻辑一致）
   */
  generateCardTemplates(knowledgeTree) {
    // 实现与Web App侧相同的逻辑，确保一致性
    const { master_id, core_concept_card, satellite_cards } = knowledgeTree;
    const templates = {};
    
    if (core_concept_card) {
      const coreCardId = `${master_id}_core`;
      templates[coreCardId] = {
        cardId: coreCardId,
        masterId: master_id,
        type: 'core_concept',
        metadata: {
          aspect: '核心概念',
          difficulty: 'medium'
        }
      };
    }
    
    satellite_cards.forEach(satellite => {
      const satelliteCardId = `${master_id}_${satellite.card_id}`;
      templates[satelliteCardId] = {
        cardId: satelliteCardId,
        masterId: master_id,
        type: 'satellite', 
        metadata: {
          aspect: satellite.aspect,
          difficulty: 'medium'
        }
      };
    });
    
    return templates;
  }
}

module.exports = UserProgressManager;