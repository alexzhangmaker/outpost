class KnowledgeTreeScorer {
  constructor() {
    this.config = {
      // 权重配置（可轻松调整）
      weights: {
        masterCard: 0.3,      // 主卡权重
        satelliteCards: 0.7,   // 卫星卡总权重
        subjectiveScore: 0.4,  // 主观评分权重
        quizScore: 0.6         // 客观Quiz权重
      },
      // 评分策略
      strategies: {
        conservative: {        // 保守策略：取最低分
          type: 'min',
          description: '任一卡片掌握不好就整体重学'
        },
        balanced: {            // 平衡策略：加权平均
          type: 'weighted',
          description: '综合考虑所有卡片表现'
        },
        progressive: {         // 渐进策略：取最高分  
          type: 'max',
          description: '主要看掌握最好的卡片'
        }
      },
      currentStrategy: 'balanced'
    };
  }

  /**
   * 计算知识树整体掌握分数 (0-5分)
   */
  calculateMasteryScore(knowledgeTreeProgress) {
    const { masterCard, satelliteCards } = knowledgeTreeProgress;
    
    if (!masterCard && (!satelliteCards || satelliteCards.length === 0)) {
      throw new Error('知识树进度数据为空');
    }

    // 选择评分策略
    const strategy = this.config.strategies[this.config.currentStrategy];
    
    let overallScore;
    switch (strategy.type) {
      case 'min':
        overallScore = this.calculateMinScore(masterCard, satelliteCards);
        break;
      case 'max':
        overallScore = this.calculateMaxScore(masterCard, satelliteCards);
        break;
      case 'weighted':
      default:
        overallScore = this.calculateWeightedScore(masterCard, satelliteCards);
        break;
    }

    return {
      score: Math.round(overallScore * 100) / 100, // 保留两位小数
      strategy: strategy.type,
      components: this.getScoreComponents(masterCard, satelliteCards),
      recommendation: this.getLearningRecommendation(overallScore)
    };
  }

  /**
   * 保守策略：取所有卡片中的最低分
   */
  calculateMinScore(masterCard, satelliteCards) {
    const allScores = [];
    
    if (masterCard) {
      allScores.push(this.calculateCardScore(masterCard));
    }
    
    if (satelliteCards && satelliteCards.length > 0) {
      satelliteCards.forEach(card => {
        allScores.push(this.calculateCardScore(card));
      });
    }
    
    return Math.min(...allScores);
  }

  /**
   * 渐进策略：取所有卡片中的最高分
   */
  calculateMaxScore(masterCard, satelliteCards) {
    const allScores = [];
    
    if (masterCard) {
      allScores.push(this.calculateCardScore(masterCard));
    }
    
    if (satelliteCards && satelliteCards.length > 0) {
      satelliteCards.forEach(card => {
        allScores.push(this.calculateCardScore(card));
      });
    }
    
    return Math.max(...allScores);
  }

  /**
   * 平衡策略：加权平均（主卡 + 卫星卡）
   */
  calculateWeightedScore(masterCard, satelliteCards) {
    let totalScore = 0;
    let totalWeight = 0;

    // 主卡评分（如果有）
    if (masterCard) {
      const masterScore = this.calculateCardScore(masterCard);
      totalScore += masterScore * this.config.weights.masterCard;
      totalWeight += this.config.weights.masterCard;
    }

    // 卫星卡平均评分
    if (satelliteCards && satelliteCards.length > 0) {
      const satelliteAvgScore = this.calculateSatelliteAverageScore(satelliteCards);
      totalScore += satelliteAvgScore * this.config.weights.satelliteCards;
      totalWeight += this.config.weights.satelliteCards;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * 计算单张卡片的综合分数
   */
  calculateCardScore(cardProgress) {
    const { subjectiveScore, quizResults, computedQuality } = cardProgress;

    // 如果已经有计算好的质量分数，优先使用
    if (computedQuality !== undefined && computedQuality !== null) {
      return Math.min(Math.max(computedQuality, 0), 5);
    }

    let score;

    if (!quizResults || quizResults.total === 0) {
      // 只有主观评分
      score = subjectiveScore;
    } else {
      // 融合主观评分和Quiz结果
      const quizScore = quizResults.correct / quizResults.total;
      const quizMapped = 1 + (quizScore * 4); // 映射到1-5分
      
      score = (quizMapped * this.config.weights.quizScore) + 
              (subjectiveScore * this.config.weights.subjectiveScore);
    }

    // 处理极端情况
    if (subjectiveScore >= 4 && quizResults && quizResults.correct / quizResults.total < 0.6) {
      score = Math.min(score, 2.5); // 严重高估，大幅惩罚
    }

    return Math.round(score * 100) / 100;
  }

  /**
   * 计算卫星卡平均分数（可考虑难度加权）
   */
  calculateSatelliteAverageScore(satelliteCards) {
    if (!satelliteCards || satelliteCards.length === 0) return 0;

    const total = satelliteCards.reduce((sum, card) => {
      return sum + this.calculateCardScore(card);
    }, 0);

    return total / satelliteCards.length;
  }

  /**
   * 获取评分组件详情（用于调试和展示）
   */
  getScoreComponents(masterCard, satelliteCards) {
    const components = {
      strategy: this.config.currentStrategy,
      masterCard: null,
      satelliteCards: {
        count: 0,
        average: 0,
        individual: []
      }
    };

    if (masterCard) {
      components.masterCard = {
        score: this.calculateCardScore(masterCard),
        subjectiveScore: masterCard.subjectiveScore,
        quizScore: masterCard.quizResults ? 
          masterCard.quizResults.correct / masterCard.quizResults.total : null
      };
    }

    if (satelliteCards && satelliteCards.length > 0) {
      components.satelliteCards.count = satelliteCards.length;
      components.satelliteCards.individual = satelliteCards.map(card => ({
        cardId: card.cardId,
        score: this.calculateCardScore(card),
        subjectiveScore: card.subjectiveScore,
        quizScore: card.quizResults ? 
          card.quizResults.correct / card.quizResults.total : null
      }));
      
      components.satelliteCards.average = components.satelliteCards.individual
        .reduce((sum, card) => sum + card.score, 0) / satelliteCards.length;
    }

    return components;
  }

  /**
   * 根据整体分数给出学习建议
   */
  getLearningRecommendation(overallScore) {
    if (overallScore >= 4.5) {
      return {
        level: 'excellent',
        message: '掌握优秀！可大幅延长复习间隔',
        suggestedIntervalMultiplier: 1.5,
        focus: '巩固保持'
      };
    } else if (overallScore >= 4.0) {
      return {
        level: 'good', 
        message: '掌握良好，按计划复习即可',
        suggestedIntervalMultiplier: 1.2,
        focus: '稳步提升'
      };
    } else if (overallScore >= 3.0) {
      return {
        level: 'fair',
        message: '基本掌握，建议适当缩短复习间隔',
        suggestedIntervalMultiplier: 0.9,
        focus: '加强薄弱环节'
      };
    } else if (overallScore >= 2.0) {
      return {
        level: 'poor',
        message: '掌握不牢，需要重点复习',
        suggestedIntervalMultiplier: 0.6,
        focus: '重新学习核心概念'
      };
    } else {
      return {
        level: 'very_poor',
        message: '未掌握，建议立即重新学习',
        suggestedIntervalMultiplier: 0.3,
        focus: '全面重新学习'
      };
    }
  }

  /**
   * 动态更新评分策略（可在运行时调整）
   */
  setScoringStrategy(strategyName) {
    if (this.config.strategies[strategyName]) {
      this.config.currentStrategy = strategyName;
      console.log(`✅ 评分策略已更新为: ${strategyName}`);
      return true;
    } else {
      console.error(`❌ 未知的评分策略: ${strategyName}`);
      return false;
    }
  }

  /**
   * 动态更新权重配置
   */
  updateWeights(newWeights) {
    this.config.weights = { ...this.config.weights, ...newWeights };
    console.log('✅ 评分权重已更新:', this.config.weights);
  }

  /**
   * 获取当前配置（用于调试）
   */
  getConfig() {
    return {
      ...this.config,
      availableStrategies: Object.keys(this.config.strategies)
    };
  }
}

module.exports = KnowledgeTreeScorer;