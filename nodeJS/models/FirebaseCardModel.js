const { db } = require('../config/firebase');

class FirebaseCardModel {
  constructor() {
    this.cardsRef = db.ref('cards');
    this.usersRef = db.ref('users');
  }

  /**
   * 获取用户卡片
   */
  async getUserCards(userId) {
    try {
      const snapshot = await this.cardsRef
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      
      return snapshot.val() || {};
    } catch (error) {
      console.error('获取用户卡片错误:', error);
      throw error;
    }
  }

  /**
   * 获取单个卡片
   */
  async getCard(userId, cardId) {
    try {
      const snapshot = await this.cardsRef
        .child(cardId)
        .once('value');
      
      const card = snapshot.val();
      return card && card.userId === userId ? card : null;
    } catch (error) {
      console.error('获取卡片错误:', error);
      throw error;
    }
  }

  /**
   * 创建或更新卡片
   */
  async saveCard(cardData) {
    try {
      const { cardId } = cardData;
      const cardRef = this.cardsRef.child(cardId);
      
      await cardRef.set({
        ...cardData,
        updatedAt: Date.now()
      });
      
      return cardData;
    } catch (error) {
      console.error('保存卡片错误:', error);
      throw error;
    }
  }

  /**
   * 批量更新卡片
   */
  async updateCards(cards) {
    try {
      const updates = {};
      const now = Date.now();
      
      cards.forEach(card => {
        updates[`${card.cardId}`] = {
          ...card,
          updatedAt: now
        };
      });
      
      await this.cardsRef.update(updates);
      return true;
    } catch (error) {
      console.error('批量更新卡片错误:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId) {
    try {
      const userCards = await this.getUserCards(userId);
      const cards = Object.values(userCards);
      
      return this.calculateUserStats(cards);
    } catch (error) {
      console.error('获取用户统计错误:', error);
      throw error;
    }
  }

  /**
   * 计算用户统计
   */
  calculateUserStats(cards) {
    const totalCards = cards.length;
    const now = Date.now();
    
    const dueCards = cards.filter(card => {
      const nextReviewDate = card.nextReviewDate || 0;
      return nextReviewDate <= now;
    }).length;
    
    const totalReviews = cards.reduce((sum, card) => 
      sum + (card.history ? card.history.length : 0), 0
    );
    
    const avgQuality = totalCards > 0 ? 
      cards.reduce((sum, card) => sum + (card.averageQuality || 0), 0) / totalCards : 0;

    return {
      totalCards,
      dueCards,
      totalReviews,
      averageQuality: Math.round(avgQuality * 100) / 100,
      updatedAt: Date.now()
    };
  }

  /**
   * 初始化用户卡片（从知识树导入）
   */
  async initializeUserCards(userId, knowledgeTrees) {
    try {
      const cards = [];
      
      // 从知识树结构中提取所有卡片
      knowledgeTrees.forEach(tree => {
        const { master_id, master_topic, satellite_cards } = tree;
        
        // 核心概念卡
        cards.push({
          cardId: `${master_id}_core`,
          masterId: master_id,
          userId: userId,
          question: tree.core_concept_card?.question,
          answer: tree.core_concept_card?.answer,
          aspect: '核心概念',
          type: 'core',
          repetition: 0,
          interval: 0,
          easeFactor: 2.5,
          nextReviewDate: Date.now(),
          lastReviewed: Date.now(),
          totalReviews: 0,
          averageQuality: 0,
          history: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        
        // 卫星卡
        satellite_cards?.forEach((satellite, index) => {
          cards.push({
            cardId: `${master_id}_satellite_${index}`,
            masterId: master_id,
            userId: userId,
            question: satellite.question,
            answer: satellite.answer,
            aspect: satellite.aspect,
            type: 'satellite',
            examples: satellite.examples,
            quizzes: satellite.quizzes,
            repetition: 0,
            interval: 0,
            easeFactor: 2.5,
            nextReviewDate: Date.now(),
            lastReviewed: Date.now(),
            totalReviews: 0,
            averageQuality: 0,
            history: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        });
      });
      
      // 批量保存卡片
      await this.updateCards(cards);
      return cards;
      
    } catch (error) {
      console.error('初始化用户卡片错误:', error);
      throw error;
    }
  }
}

module.exports = FirebaseCardModel;