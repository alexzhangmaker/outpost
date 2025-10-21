// 使用示例
const FirebaseReviewService = require('./services/FirebaseReviewService');
const FirebaseRealtimeService = require('./services/FirebaseRealtimeService');

const reviewService = new FirebaseReviewService();
const realtimeService = new FirebaseRealtimeService();

// 实时监听复习队列
const unsubscribe = realtimeService.listenToReviewQueue('user123', (update) => {
  console.log('复习队列更新:', {
    dueCards: update.count,
    timestamp: new Date(update.timestamp).toLocaleString()
  });
});

// 处理复习
async function handleReview() {
  const result = await reviewService.processReview(
    'user123',
    'thai_grammar_001_satellite_0',
    4, // 主观评分
    [
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: true },
      { questionId: 'q3', isCorrect: false }
    ]
  );
  
  console.log('复习结果:', result.reviewResult);
}

// 获取学习分析
async function getAnalytics() {
  const analytics = await reviewService.getLearningAnalytics('user123', 7);
  console.log('7天学习分析:', analytics.summary);
}