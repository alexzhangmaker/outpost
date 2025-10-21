// Firebase配置（实际使用时替换为你的配置）
// 在实际应用中，您可以使用以下代码从Firebase获取数据
// 模拟Firebase配置 - 在实际应用中替换为您的配置
const firebaseConfig = {
    apiKey: "AIzaSyA6MZ_p5lVuy8TMAqiuV6IRx9fggV44lQs",
    authDomain: "outpost-8d74e.firebaseapp.com",
    databaseURL: "https://outpost-otes-86b07.asia-southeast1.firebasedatabase.app/",
    projectId: "outpost-8d74e",
    storageBucket: "outpost-8d74e.firebasestorage.app",
    messagingSenderId: "724993324937",
    appId: "1:724993324937:web:ce6c7e6b06489331c79358",
    measurementId: "G-QPHWRTH6BH"
};

const path025231="025231" ;
// 初始化Firebase
// Correct v8 code
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // Correct: auth() is the function
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();
const gReviewService = new ReviewService() ;
/*
function fetchDataFromFirebase(path) {
    return new Promise((resolve, reject) => {
        const ref = database.ref(path);
        ref.on('value', (snapshot) => {
            const data = snapshot.val();
            //resolve(data ? Object.values(data) : []);
            resolve(data);
        }, (error) => {
            reject(error);
        });
    });
}
*/

// The correct way to call the function in V8
function signInWithGoogle(callAuthed,callFailAuth) {
    auth.signInWithPopup(provider).then((result) => {
        // User signed in successfully.
        const user = result.user;
        console.log("User:", user);
        callAuthed() ;
    }).catch((error) => {
        // Handle Errors here.
        console.error("Sign-in error:", error);
        callFailAuth() ;
    });
}

async function loadAnki(pathAnki){
    let snapshot = await database.ref(pathAnki).once('value');
    let jsonAnkiSets = snapshot.val();
    console.log(jsonAnkiSets) ;

    let keys = Object.keys(jsonAnkiSets) ;
    console.log(keys) ;

    gMemoCards=[] ;
    keys.forEach(key=>{
        gMemoCards.push(jsonAnkiSets[key]) ;
    }) ;

    let cueCards = await gReviewService.getDueCards("rayZhang") ;
    console.log(cueCards) ;
}


async function saveReviewStat(classCode){
    let date = new Date() ;
    let pathLog = `/reviewLog/${classCode}/${date.getTime()}` ;
    await database.ref(pathLog).set(gMemoCards) ;
}


//import { db } from '../config/firebase-client';

class ReviewService {
  constructor() {
    this.templatesRef = database.ref('card_templates');
    this.progressRef = database.ref('user_progress');
    this.schedulingRef = database.ref('scheduling_queue');
    this.sessionsRef = database.ref('review_sessions');
  }

  /**
   * 获取用户今日需要复习的卡片
   */
  async getDueCards(userId) {
    try {
      const now = Date.now();
      
      // 直接从调度队列获取到期卡片
      const snapshot = await this.schedulingRef
        .child(userId)
        .orderByChild('nextReviewDate')
        .endAt(now)
        .once('value');
      
      const scheduledCards = snapshot.val() || {};
      const cardIds = Object.keys(scheduledCards);
      
      // 并行获取卡片内容
      const cardPromises = cardIds.map(cardId => 
        this.templatesRef.child(cardId).once('value')
      );
      
      const cardSnapshots = await Promise.all(cardPromises);
      
      // 合并数据
      const dueCards = cardIds.map((cardId, index) => ({
        ...scheduledCards[cardId],
        ...cardSnapshots[index].val(),
        cardId
      }));
      
      // 按优先级排序
      return dueCards.sort((a, b) => b.priority - a.priority);
      
    } catch (error) {
      console.error('获取到期卡片错误:', error);
      return [];
    }
  }

  /**
   * 提交复习结果（Web App调用）
   */
  async submitReviewResult(userId, session) {
    try {
      const sessionId = `sess_${Date.now()}`;
      const updates = {};
      
      // 为每个复习的卡片创建进度记录
      session.reviews.forEach(review => {
        const progressPath = `user_progress/${userId}/${review.cardId}`;
        updates[progressPath] = {
          lastReviewed: Date.now(),
          subjectiveScore: review.subjectiveScore,
          quizResults: review.quizResults,
          computedQuality: review.computedQuality, // Web App可以计算基础质量分数
          needsReschedule: true  // 标记需要重新调度
        };
      });
      
      // 创建会话记录
      const sessionPath = `review_sessions/${userId}/${sessionId}`;
      updates[sessionPath] = {
        timestamp: Date.now(),
        cardsReviewed: session.reviews.map(r => r.cardId),
        duration: session.duration,
        averageQuality: this.calculateSessionQuality(session.reviews)
      };
      
      // 原子性写入所有更新
      await database.ref().update(updates);
      
      return { success: true, sessionId };
      
    } catch (error) {
      console.error('提交复习结果错误:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 计算会话平均质量（简化版，供Web App使用）
   */
  calculateSessionQuality(reviews) {
    const total = reviews.reduce((sum, review) => {
      const quizScore = review.quizResults.correct / review.quizResults.total;
      // 简单加权平均
      return sum + (review.subjectiveScore * 0.4 + quizScore * 4 * 0.6);
    }, 0);
    
    return total / reviews.length;
  }

  /**
   * 监听复习队列变化（实时更新）
   */
  listenToDueCards(userId, callback) {
    const now = Date.now();
    
    return this.schedulingRef
      .child(userId)
      .orderByChild('nextReviewDate')
      .endAt(now)
      .on('value', (snapshot) => {
        const dueCards = snapshot.val() || {};
        callback({
          count: Object.keys(dueCards).length,
          cards: dueCards
        });
      });
  }
}

//export default ReviewService;