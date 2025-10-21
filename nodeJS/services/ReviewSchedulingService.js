const SpacedRepetitionSystem = require('./SpacedRepetitionSystem');
const CardTemplateRepository = require('../repositories/CardTemplateRepository');
const UserProgressRepository = require('../repositories/UserProgressRepository');

class ReviewSchedulingService {
  constructor() {
    this.srs = new SpacedRepetitionSystem();
    this.templateRepo = new CardTemplateRepository();
    this.progressRepo = new UserProgressRepository();
  }

  async processReviewSession(userId, session) {
    const results = [];
    
    for (const review of session.reviews) {
      // 获取卡片模板和用户进度
      const [template, progress] = await Promise.all([
        this.templateRepo.findById(review.cardId),
        this.progressRepo.findByUserAndCard(userId, review.cardId)
      ]);

      if (!template) {
        throw new Error(`Card template not found: ${review.cardId}`);
      }

      // 处理复习逻辑
      const result = await this.processSingleReview(
        userId, 
        template, 
        progress, 
        review,
        session.id
      );
      
      results.push(result);
    }
    
    // 批量保存进度更新
    const progressesToUpdate = results.map(r => r.progress);
    await this.progressRepo.saveBatch(progressesToUpdate);
    
    return results;
  }

  async processSingleReview(userId, template, progress, review, sessionId) {
    // 如果没有进度记录，创建默认进度
    if (!progress) {
      progress = new UserProgress(userId, template.cardId);
    }

    // 计算Quiz分数
    const quizScore = review.quizResults.correct / review.quizResults.total;
    
    // 使用调度算法
    const schedulingResult = this.srs.processReview({
      scheduling: progress.scheduling,
      performance: progress.performance,
      subjectiveScore: review.subjectiveScore,
      quizScore: quizScore
    });

    // 更新进度
    progress.scheduling = schedulingResult.newScheduling;
    progress.addReviewRecord({
      sessionId,
      subjectiveScore: review.subjectiveScore,
      quizResults: review.quizResults,
      computedQuality: schedulingResult.quality,
      scheduledInterval: schedulingResult.interval,
      easeFactorChange: schedulingResult.easeFactorChange
    });

    return {
      cardId: template.cardId,
      progress: progress,
      reviewResult: schedulingResult
    };
  }
}