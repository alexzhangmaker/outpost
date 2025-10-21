class EnhancedSpacedRepetition {
  constructor() {
    this.config = {
      // 基础SM-2参数
      defaultEaseFactor: 2.5,
      minEaseFactor: 1.3,
      maxEaseFactor: 2.5,
      
      // 增强参数
      difficultyMultipliers: {
        easy: 1.2,
        medium: 1.0,
        hard: 0.8
      },
      typeMultipliers: {
        core_concept: 0.9,    // 核心概念卡更频繁复习
        satellite: 1.0,       // 卫星卡标准频率
        unknown: 1.0
      },
      importanceMultipliers: {
        high: 0.85,           // 重要卡片更频繁复习
        medium: 1.0,
        low: 1.15
      },
      
      // 跨卡片优化参数
      groupScheduling: {
        maxCardsPerDay: 10,   // 每天最多复习的同知识树卡片
        minIntervalBetweenRelated: 2, // 相关卡片最小间隔天数
        preferredStudySessionSize: 5  // 推荐的学习会话大小
      }
    };
  }

  /**
   * 计算下次复习时间（增强版）
   */
  calculateNextReview(currentProgress, cardMetadata) {
    const { repetition = 0, interval = 0, easeFactor = this.config.defaultEaseFactor } = currentProgress;
    const { type = 'unknown', difficulty = 'medium', importance = 'medium' } = cardMetadata;
    
    // 计算质量分数（基于主观评分和Quiz结果）
    const quality = this.calculateQualityScore(currentProgress);
    
    if (quality === null) {
      console.warn('⚠️ 无法计算质量分数，使用默认调度');
      return this.getDefaultSchedule();
    }

    // 基础SM-2算法
    let newRepetition, newInterval;
    
    if (quality < 3) {
      // 答得不好，重置
      newRepetition = 0;
      newInterval = 1;
    } else {
      // 答得好，推进
      newRepetition = repetition + 1;
      
      if (newRepetition === 1) {
        newInterval = 1;
      } else if (newRepetition === 2) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * easeFactor);
      }
    }
    
    // 应用增强调整
    newInterval = this.applyEnhancementAdjustments(
      newInterval, 
      quality, 
      type, 
      difficulty, 
      importance
    );
    
    // 更新简易度因子（考虑难度）
    const newEaseFactor = this.calculateEnhancedEaseFactor(
      easeFactor, 
      quality, 
      difficulty
    );
    
    const nextReviewDate = Date.now() + (newInterval * 24 * 60 * 60 * 1000);
    
    return {
      schedule: {
        repetition: newRepetition,
        interval: newInterval,
        easeFactor: Math.round(newEaseFactor * 100) / 100,
        nextReviewDate,
        lastQuality: quality,
        calculatedAt: Date.now(),
        algorithm: 'enhanced_sm2_v1'
      },
      metadata: {
        quality,
        adjustedBy: {
          type: this.config.typeMultipliers[type],
          difficulty: this.config.difficultyMultipliers[difficulty],
          importance: this.config.importanceMultipliers[importance]
        }
      }
    };
  }

  /**
   * 计算质量分数
   */
  calculateQualityScore(progress) {
    const { subjectiveScore, quizResults, computedQuality } = progress;
    
    // 如果已经有计算好的质量分数，直接使用
    if (computedQuality !== undefined && computedQuality !== null) {
      return Math.min(Math.max(computedQuality, 0), 5);
    }
    
    // 基于主观评分和Quiz结果计算
    if (subjectiveScore === undefined || subjectiveScore === null) {
      return null;
    }
    
    let quality;
    
    if (!quizResults || quizResults.total === 0) {
      // 只有主观评分
      quality = subjectiveScore;
    } else {
      // 融合主观评分和Quiz结果
      const quizScore = quizResults.correct / quizResults.total;
      const quizMapped = 1 + (quizScore * 4); // 映射到1-5分
      
      // 权重：主观40%，Quiz60%
      quality = (quizMapped * 0.6) + (subjectiveScore * 0.4);
      
      // 处理矛盾情况
      if (subjectiveScore >= 4 && quizScore < 0.8) {
        quality = Math.min(quality, 3.0); // 惩罚主观高估
      }
      
      if (subjectiveScore <= 2 && quizScore > 0.9) {
        quality = Math.max(quality, 4.0); // 鼓励主观低估
      }
    }
    
    return Math.round(quality * 100) / 100;
  }

  /**
   * 应用增强调整
   */
  applyEnhancementAdjustments(interval, quality, type, difficulty, importance) {
    let adjustedInterval = interval;
    
    // 应用类型调整
    adjustedInterval *= this.config.typeMultipliers[type] || 1.0;
    
    // 应用难度调整
    adjustedInterval *= this.config.difficultyMultipliers[difficulty] || 1.0;
    
    // 应用重要性调整
    adjustedInterval *= this.config.importanceMultipliers[importance] || 1.0;
    
    // 质量调整：质量越低，间隔越短
    if (quality < 4) {
      adjustedInterval *= (0.8 + (quality * 0.05)); // 质量3→0.95, 质量2→0.9
    }
    
    // 确保最小间隔为1天
    adjustedInterval = Math.max(1, Math.round(adjustedInterval));
    
    // 限制最大间隔为365天
    adjustedInterval = Math.min(adjustedInterval, 365);
    
    return adjustedInterval;
  }

  /**
   * 计算增强的简易度因子
   */
  calculateEnhancedEaseFactor(currentEaseFactor, quality, difficulty) {
    // 基础SM-2的简易度因子变化
    let delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    
    // 难度调整：难度高的卡片简易度因子变化更小
    if (difficulty === 'hard') {
      delta *= 0.7;
    } else if (difficulty === 'easy') {
      delta *= 1.3;
    }
    
    // 质量特别高或特别低时的额外调整
    if (quality >= 4.5) {
      delta += 0.05; // 奖励优秀表现
    } else if (quality <= 2) {
      delta -= 0.03; // 惩罚差劲表现
    }
    
    const newEaseFactor = currentEaseFactor + delta;
    
    return Math.max(
      this.config.minEaseFactor, 
      Math.min(newEaseFactor, this.config.maxEaseFactor)
    );
  }

  /**
   * 优化卡片组调度（跨卡片优化）
   */
  optimizeCardGroupScheduling(scheduledCards, knowledgeTree) {
    if (!scheduledCards || scheduledCards.length <= 1) {
      return scheduledCards;
    }
    
    console.log(`   🔄 优化 ${scheduledCards.length} 张卡片的组调度`);
    
    const optimized = [...scheduledCards];
    const { core_concept_card, satellite_cards } = knowledgeTree;
    
    // 识别卡片关系
    const cardRelations = this.analyzeCardRelationships(optimized, knowledgeTree);
    
    // 应用优化策略
    this.applySpacingOptimization(optimized, cardRelations);
    this.applySessionOptimization(optimized);
    this.applyDependencyOptimization(optimized, knowledgeTree);
    
    return optimized.map((card, index) => ({
      cardId: card.cardId,
      optimizedSchedule: {
        ...card.schedule,
        optimized: true,
        optimizationRound: index + 1,
        groupSize: optimized.length
      }
    }));
  }

  /**
   * 分析卡片关系
   */
  analyzeCardRelationships(cards, knowledgeTree) {
    const relationships = {
      coreToSatellite: [],
      relatedAspects: [],
      difficultyGroups: {
        easy: [],
        medium: [],
        hard: []
      }
    };
    
    cards.forEach(card => {
      const metadata = this.extractCardMetadataFromId(card.cardId, knowledgeTree);
      
      // 按难度分组
      relationships.difficultyGroups[metadata.difficulty].push(card.cardId);
      
      // 识别核心概念卡与卫星卡的关系
      if (metadata.type === 'core_concept') {
        relationships.coreCard = card.cardId;
      } else if (metadata.type === 'satellite' && relationships.coreCard) {
        relationships.coreToSatellite.push({
          core: relationships.coreCard,
          satellite: card.cardId
        });
      }
      
      // 识别相关方面的卡片（基于aspect关键词）
      if (metadata.aspect) {
        const keyWords = this.extractKeyWords(metadata.aspect);
        keyWords.forEach(word => {
          if (!relationships.relatedAspects[word]) {
            relationships.relatedAspects[word] = [];
          }
          relationships.relatedAspects[word].push(card.cardId);
        });
      }
    });
    
    return relationships;
  }

  /**
   * 应用间隔优化
   */
  applySpacingOptimization(optimized, relationships) {
    const { maxCardsPerDay, minIntervalBetweenRelated } = this.config.groupScheduling;
    
    // 确保同一天不会安排太多相关卡片
    const cardsByDay = new Map();
    
    optimized.forEach(card => {
      const day = Math.floor(card.schedule.nextReviewDate / (24 * 60 * 60 * 1000));
      
      if (!cardsByDay.has(day)) {
        cardsByDay.set(day, []);
      }
      cardsByDay.get(day).push(card.cardId);
    });
    
    // 重新分配超出的卡片
    cardsByDay.forEach((cardIds, day) => {
      if (cardIds.length > maxCardsPerDay) {
        const excess = cardIds.length - maxCardsPerDay;
        const toReschedule = cardIds.slice(-excess);
        
        toReschedule.forEach(cardId => {
          const card = optimized.find(c => c.cardId === cardId);
          if (card) {
            // 推迟一天
            card.schedule.nextReviewDate += 24 * 60 * 60 * 1000;
            card.schedule.interval += 1;
            console.log(`     📅 推迟卡片 ${cardId} 到第二天（避免超限）`);
          }
        });
      }
    });
  }

  /**
   * 应用会话优化
   */
  applySessionOptimization(optimized) {
    const { preferredStudySessionSize } = this.config.groupScheduling;
    
    // 按复习日期分组
    const sessions = new Map();
    optimized.forEach(card => {
      const dateKey = new Date(card.schedule.nextReviewDate).toDateString();
      if (!sessions.has(dateKey)) {
        sessions.set(dateKey, []);
      }
      sessions.get(dateKey).push(card);
    });
    
    // 优化会话大小
    sessions.forEach((cards, date) => {
      if (cards.length < 3) {
        // 会话太小，尝试合并
        this.mergeSmallSessions(cards, sessions, optimized);
      } else if (cards.length > preferredStudySessionSize) {
        // 会话太大，尝试拆分
        this.splitLargeSessions(cards, sessions, optimized);
      }
    });
  }

  /**
   * 应用依赖关系优化
   */
  applyDependencyOptimization(optimized, knowledgeTree) {
    const { satellite_cards } = knowledgeTree;
    
    // 确保先复习核心概念卡，再复习依赖的卫星卡
    const coreCard = optimized.find(card => 
      card.cardId === `${knowledgeTree.master_id}_core`
    );
    
    if (!coreCard) return;
    
    satellite_cards.forEach(satellite => {
      const satelliteCard = optimized.find(card => 
        card.cardId === `${knowledgeTree.master_id}_${satellite.card_id}`
      );
      
      if (satelliteCard && satelliteCard.schedule.nextReviewDate < coreCard.schedule.nextReviewDate) {
        // 卫星卡安排在核心概念卡之前，调整顺序
        satelliteCard.schedule.nextReviewDate = coreCard.schedule.nextReviewDate + (24 * 60 * 60 * 1000);
        satelliteCard.schedule.interval = coreCard.schedule.interval + 1;
        console.log(`     🔄 调整依赖顺序: ${satelliteCard.cardId} 在 ${coreCard.cardId} 之后`);
      }
    });
  }

  /**
   * 合并小会话
   */
  mergeSmallSessions(smallSessionCards, allSessions, optimized) {
    if (smallSessionCards.length >= 3) return;
    
    // 找到最近的其他会话
    const otherDates = Array.from(allSessions.keys())
      .filter(date => allSessions.get(date).length > 0)
      .sort((a, b) => new Date(a) - new Date(b));
    
    if (otherDates.length <= 1) return;
    
    const targetDate = otherDates[1]; // 第二近的日期
    
    smallSessionCards.forEach(card => {
      const targetSession = allSessions.get(targetDate);
      if (targetSession && targetSession.length < this.config.groupScheduling.preferredStudySessionSize) {
        // 移动到目标会话
        const oldDate = new Date(card.schedule.nextReviewDate).toDateString();
        card.schedule.nextReviewDate = new Date(targetDate).getTime();
        
        // 更新会话映射
        allSessions.get(oldDate) = allSessions.get(oldDate).filter(c => c.cardId !== card.cardId);
        targetSession.push(card);
        
        console.log(`     🔀 合并卡片 ${card.cardId} 到 ${targetDate}`);
      }
    });
  }

  /**
   * 拆分大会话
   */
  splitLargeSessions(largeSessionCards, allSessions, optimized) {
    const excess = largeSessionCards.length - this.config.groupScheduling.preferredStudySessionSize;
    if (excess <= 0) return;
    
    // 按优先级排序，低优先级的卡片推迟
    const sortedCards = [...largeSessionCards].sort((a, b) => 
      (a.schedule.priority || 0) - (b.schedule.priority || 0)
    );
    
    const toPostpone = sortedCards.slice(0, excess);
    
    toPostpone.forEach(card => {
      // 推迟到第二天
      card.schedule.nextReviewDate += 24 * 60 * 60 * 1000;
      card.schedule.interval += 1;
      
      console.log(`     📅 拆分会话: 推迟卡片 ${card.cardId} 到第二天`);
    });
  }

  /**
   * 从卡片ID提取元数据
   */
  extractCardMetadataFromId(cardId, knowledgeTree) {
    const { master_id, core_concept_card, satellite_cards } = knowledgeTree;
    
    if (cardId === `${master_id}_core`) {
      return {
        type: 'core_concept',
        aspect: '核心概念',
        difficulty: 'medium',
        importance: 'high'
      };
    }
    
    const satelliteId = cardId.replace(`${master_id}_`, '');
    const satellite = satellite_cards.find(s => s.card_id === satelliteId);
    
    if (satellite) {
      return {
        type: 'satellite',
        aspect: satellite.aspect,
        difficulty: this.estimateDifficultyFromContent(satellite),
        importance: this.estimateImportanceFromAspect(satellite.aspect)
      };
    }
    
    return {
      type: 'unknown',
      aspect: '未知',
      difficulty: 'medium',
      importance: 'medium'
    };
  }

  /**
   * 从内容估计难度
   */
  estimateDifficultyFromContent(satellite) {
    const quizCount = satellite.quizzes ? satellite.quizzes.length : 0;
    const exampleCount = satellite.examples ? satellite.examples.length : 0;
    const answerLength = satellite.answer ? satellite.answer.length : 0;
    
    let score = 0;
    if (quizCount >= 3) score += 2;
    else if (quizCount >= 2) score += 1;
    
    if (exampleCount >= 3) score += 2;
    else if (exampleCount >= 2) score += 1;
    
    if (answerLength > 500) score += 1;
    else if (answerLength > 300) score += 0.5;
    
    if (score >= 4) return 'hard';
    if (score >= 2) return 'medium';
    return 'easy';
  }

  /**
   * 从方面估计重要性
   */
  estimateImportanceFromAspect(aspect) {
    const highImportanceKeywords = ['核心', '基础', '基本', '主要', '常用'];
    const lowImportanceKeywords = ['进阶', '扩展', '特殊', '少见'];
    
    if (highImportanceKeywords.some(keyword => aspect.includes(keyword))) {
      return 'high';
    }
    if (lowImportanceKeywords.some(keyword => aspect.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  /**
   * 提取关键词
   */
  extractKeyWords(aspect) {
    // 简单的中文分词（按常见分隔符）
    return aspect.split(/[，。、；：\s]/)
      .filter(word => word.length > 1)
      .map(word => word.trim());
  }

  /**
   * 获取默认调度（回退方案）
   */
  getDefaultSchedule() {
    return {
      schedule: {
        repetition: 0,
        interval: 1,
        easeFactor: this.config.defaultEaseFactor,
        nextReviewDate: Date.now() + (24 * 60 * 60 * 1000),
        lastQuality: 3,
        calculatedAt: Date.now(),
        algorithm: 'default_fallback'
      },
      metadata: {
        quality: 3,
        adjustedBy: {}
      }
    };
  }

  /**
   * 获取算法配置（用于调试）
   */
  getConfig() {
    return this.config;
  }
}

module.exports = EnhancedSpacedRepetition;