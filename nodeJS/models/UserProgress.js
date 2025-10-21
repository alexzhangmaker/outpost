class UserProgress {
  constructor(userId, cardId, data = {}) {
    this.userId = userId;
    this.cardId = cardId;
    this.scheduling = data.scheduling || this.getDefaultScheduling();
    this.performance = data.performance || this.getDefaultPerformance();
    this.history = data.history || [];
    this.preferences = data.preferences || {};
  }

  getDefaultScheduling() {
    return {
      repetition: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReviewDate: Date.now(),
      lastReviewed: Date.now(),
      status: 'active'
    };
  }

  getDefaultPerformance() {
    return {
      totalReviews: 0,
      averageQuality: 0,
      streak: 0,
      lastQuality: 0
    };
  }

  // 添加复习记录
  addReviewRecord(reviewData) {
    const record = {
      sessionId: reviewData.sessionId,
      timestamp: Date.now(),
      subjectiveScore: reviewData.subjectiveScore,
      quizResults: reviewData.quizResults,
      computedQuality: reviewData.computedQuality,
      scheduledInterval: reviewData.scheduledInterval,
      easeFactorChange: reviewData.easeFactorChange
    };

    this.history.push(record);
    
    // 更新性能指标
    this.updatePerformanceMetrics(record);
    
    // 限制历史记录数量
    if (this.history.length > 100) {
      this.history = this.history.slice(-50); // 保留最近50条
    }
  }

  updatePerformanceMetrics(latestRecord) {
    this.performance.totalReviews++;
    this.performance.lastQuality = latestRecord.computedQuality;
    
    // 更新平均质量（移动平均）
    const currentTotal = this.performance.averageQuality * (this.performance.totalReviews - 1);
    this.performance.averageQuality = (currentTotal + latestRecord.computedQuality) / this.performance.totalReviews;
    
    // 更新连续正确次数
    if (latestRecord.computedQuality >= 3) {
      this.performance.streak++;
    } else {
      this.performance.streak = 0;
    }
  }
}