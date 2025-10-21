const SpacedRepetitionSystem = require('../spacedRepetition');
const FirebaseCardModel = require('../models/FirebaseCardModel');

class FirebaseReviewService {
  constructor() {
    this.srs = new SpacedRepetitionSystem();
    this.cardModel = new FirebaseCardModel();
  }

  /**
   * 处理复习会话
   */
  async processReview(userId, cardId, subjectiveScore, quizResults) {
    try {
      // 查找卡片
      const card = await this.cardModel.getCard(userId, cardId);
      if (!card) {
        throw new Error('卡片未找到');
      }

      const quizCorrect = quizResults.filter(result => result.isCorrect).length;
      const quizTotal = quizResults.length;

      // 处理复习
      const result = this.srs.processReviewSession(
        card, 
        subjectiveScore, 
        quizCorrect, 
        quizTotal
      );

      // 更新卡片
      const updatedCard = await this.cardModel.saveCard(result.card);

      return {
        success: true,
        card: updatedCard,
        reviewResult: result.reviewResult
      };

    } catch (error) {
      console.error('处理复习时出错:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户今日复习队列
   */
  async getDailyReviewQueue(userId, options = {}) {
    try {
      const { limit = 50 } = options;
      
      const userCards = await this.cardModel.getUserCards(userId);
      const cards = Object.values(userCards);
      
      const now = Date.now();
      const dueCards = cards.filter(card => 
        (card.nextReviewDate || 0) <= now
      );

      // 计算优先级并排序
      const prioritizedCards = dueCards.map(card => {
        const priority = this.calculateReviewPriority(card);
        return { ...card, priority };
      });

      prioritizedCards.sort((a, b) => b.priority - a.priority);

      return prioritizedCards.slice(0, limit);

    } catch (error) {
      console.error('获取复习队列时出错:', error);
      return [];
    }
  }

  /**
   * 计算复习优先级（优化版）
   */
  calculateReviewPriority(card) {
    const now = Date.now();
    const dueDate = card.nextReviewDate || now;
    const daysOverdue = Math.max(0, (now - dueDate) / (1000 * 60 * 60 * 24));
    
    // 优先级因子
    const overdueWeight = Math.log(1 + daysOverdue) * 10;
    const difficultyWeight = this.srs.calculateCardDifficulty(card) * 5;
    const intervalWeight = Math.log(1 + (card.interval || 0)) * 2;
    const masteryWeight = (card.averageQuality || 0) * 2; // 掌握度权重
    
    return overdueWeight + difficultyWeight + intervalWeight - masteryWeight;
  }

  /**
   * 批量处理复习结果（提高性能）
   */
  async processBatchReviews(userId, reviews) {
    try {
      const results = [];
      
      for (const review of reviews) {
        const { cardId, subjectiveScore, quizResults } = review;
        const result = await this.processReview(userId, cardId, subjectiveScore, quizResults);
        results.push(result);
      }
      
      return {
        success: true,
        results,
        processed: results.length
      };
      
    } catch (error) {
      console.error('批量处理复习错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取学习分析数据
   */
  async getLearningAnalytics(userId, days = 30) {
    try {
      const userCards = await this.cardModel.getUserCards(userId);
      const cards = Object.values(userCards);
      
      const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      
      // 收集历史数据
      const dailyStats = {};
      const cardProgress = {};
      
      cards.forEach(card => {
        // 卡片进度
        cardProgress[card.cardId] = {
          cardId: card.cardId,
          aspect: card.aspect,
          totalReviews: card.totalReviews || 0,
          averageQuality: card.averageQuality || 0,
          easeFactor: card.easeFactor || 2.5,
          nextReviewDate: card.nextReviewDate
        };
        
        // 每日统计
        if (card.history) {
          card.history.forEach(record => {
            if (record.date >= startDate) {
              const date = new Date(record.date).toISOString().split('T')[0];
              
              if (!dailyStats[date]) {
                dailyStats[date] = {
                  date,
                  reviews: 0,
                  avgQuality: 0,
                  cardsReviewed: new Set()
                };
              }
              
              dailyStats[date].reviews++;
              dailyStats[date].avgQuality += record.computedQuality;
              dailyStats[date].cardsReviewed.add(card.cardId);
            }
          });
        }
      });
      
      // 处理每日统计数据
      const dailyStatsArray = Object.values(dailyStats).map(stat => ({
        ...stat,
        avgQuality: stat.reviews > 0 ? stat.avgQuality / stat.reviews : 0,
        uniqueCards: stat.cardsReviewed.size
      }));
      
      dailyStatsArray.sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        dailyStats: dailyStatsArray,
        cardProgress: Object.values(cardProgress),
        summary: await this.cardModel.getUserStats(userId)
      };
      
    } catch (error) {
      console.error('获取学习分析错误:', error);
      throw error;
    }
  }
}

module.exports = FirebaseReviewService;