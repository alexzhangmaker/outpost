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
let gReviewService = null ;
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
    /*
    let snapshot = await database.ref(pathAnki).once('value');
    let jsonAnkiSets = snapshot.val();
    console.log(jsonAnkiSets) ;

    let keys = Object.keys(jsonAnkiSets) ;
    console.log(keys) ;

    gMemoCards=[] ;
    keys.forEach(key=>{
        gMemoCards.push(jsonAnkiSets[key]) ;
    }) ;
     */


    gReviewService = new ReviewService() ;
    let cueCards = await gReviewService.getDueCardsByKnowledgeTree("rayZhang") ;
    console.log(cueCards) ;
    gMemoCards=[] ;
    gMemoCards=[...cueCards] ;

}


async function saveReviewStat(classCode){
    let date = new Date() ;
    let pathLog = `/reviewLog/rayZhang/${classCode}/${date.getTime()}` ;
    await database.ref(pathLog).set(gMemoCards) ;
}


class ReviewService {
  constructor() {

    this.templatesRef = database.ref('card_templates');
    this.progressRef = database.ref('user_progress');
    this.schedulingRef = database.ref('scheduling_queue');
    this.sessionsRef = database.ref('review_sessions');
  }

  async getData(refPath){
    let ref = database.ref(refPath);
    const snapshot = await ref.once('value');
    let data = snapshot.val() || {};
    return data ;
  }
  /**
   * 获取用户今日需要复习的卡片（按知识树分组）
   */
  async getDueCardsByKnowledgeTree(userId) {
    try {
        const now = Date.now();
        
        // 直接从调度队列获取到期卡片
        const snapshot = await this.schedulingRef
            .child(userId)
            .orderByChild('nextReviewDate')
            //.endAt(now)
            .once('value');
        
        const scheduledCards = snapshot.val() || {};
        
        // 手动过滤到期卡片（因为Firebase查询限制）
        const dueCardIds = [] ;
        let cardKeys = Object.keys(scheduledCards);
        const dueCards = [] ;
        for(let i=0;i<cardKeys.length;i++){
            let key = cardKeys[i] ;
            if(scheduledCards[key].nextReviewDate <= now){
                dueCardIds.push(key) ;
                let jsonCard = await this.getData(`025231/${key}`) ;
                console.log(jsonCard) ;
                dueCards.push(jsonCard) ;
            }else{
                console.log(`${scheduledCards[key].nextReviewDate}vs ${now}`) ;
            }
        }
       
        console.log(dueCardIds) ;
        if (dueCardIds.length === 0) {
            return [];
        }
        return dueCards ;
    } catch (error) {
        console.error('获取到期卡片错误:', error);
        return [];
    }
  }

  /**
   * 获取卡片模板
   */
  async getCardTemplates(cardIds) {
    // 由于Firebase限制，需要逐个获取或使用其他策略
    const templates = {};
    
    for (const cardId of cardIds) {
        
      try {
        //getData(`card_templates/${cardId}`) 
        /*
        const snapshot = await get(ref(db, `card_templates/${cardId}`));
        if (snapshot.exists()) {
          templates[cardId] = snapshot.val();
        }
        */
       let card = getData(`card_templates/${cardId}`) ;
       if(card!={})
       templates[cardId] = card;//getData(`card_templates/${cardId}`) ;
      } catch (error) {
        console.error(`获取卡片模板错误 ${cardId}:`, error);
      }
    }
    
    return { val: () => templates };
  }

  /**
   * 计算知识树优先级
   */
  calculateTreePriority(tree) {
    const now = Date.now();
    let totalPriority = 0;
    let cardCount = 0;
    
    tree.cards.forEach(card => {
      const schedule = card.schedule || {};
      const daysOverdue = Math.max(0, (now - (schedule.nextReviewDate || now)) / (1000 * 60 * 60 * 24));
      
      const priority = Math.log(1 + daysOverdue) * 10 + // 逾期惩罚
                      (5 - (card.userProgress?.averageQuality || 3)) * 5; // 掌握度
      
      totalPriority += priority;
      cardCount++;
    });
    
    return cardCount > 0 ? totalPriority / cardCount : 0;
  }

  /**
   * 提交复习结果到reviewLog（新方法）
   */
  async submitReviewResultToLog(userId, reviewResult) {
    try {
      const timestamp = Date.now();
      const dateStr = new Date(timestamp).toISOString().split('T')[0].replace(/-/g, '');
      
      // 生成唯一ID (yyyyMMdd-xxxx)
      const uniqueId = await this.generateUniqueReviewId(userId, dateStr);
      const logPath = `reviewLog/${userId}/${dateStr}-${uniqueId}/${reviewResult.master_id}`;
      
      // 使用KnowledgeTreeAssessor计算评估结果
      const assessor = new KnowledgeTreeAssessor();
      const assessment = assessor.assessKnowledgeTree(reviewResult);
      
      // 构建review log记录
      const reviewLog = {
        timestamp: timestamp,
        master_id: reviewResult.master_id,
        master_topic: reviewResult.master_topic,
        core_concept_card: {
          rating: reviewResult.core_concept_card.rating,
          reviewed_at: timestamp
        },
        satellite_cards: reviewResult.satellite_cards.map(satellite => ({
          card_id: satellite.card_id,
          aspect: satellite.aspect,
          rating: satellite.rating,
          quizzes: satellite.quizzes ? satellite.quizzes.map(quiz => ({
            question: quiz.question,
            correct: quiz.correct || false
          })) : [],
          reviewed_at: timestamp
        })),
        assessment: {
          overall_score: assessment.overall_score,
          mastery_level: assessment.mastery_level.level,
          needs_reschedule: true, // 标记需要调度
          calculated_at: timestamp,
          details: assessment.assessment_details
        }
      };
      
      // 写入review log
      await set(ref(db, logPath), reviewLog);
      
      console.log(`✅ 复习记录已保存: ${logPath}`);
      
      return { 
        success: true, 
        logId: `${dateStr}-${uniqueId}`,
        assessment: assessment
      };
      
    } catch (error) {
      console.error('提交复习记录错误:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 生成唯一的复习记录ID
   */
  async generateUniqueReviewId(userId, dateStr) {
    try {
      // 查找当天的现有记录
      const snapshot = await get(ref(db, `reviewLog/${userId}`));
      const existingLogs = snapshot.val() || {};
      
      // 提取当天的记录并计数
      const todayLogs = Object.keys(existingLogs).filter(key => 
        key.startsWith(dateStr)
      );
      
      // 生成新的序列号 (0001, 0002, ...)
      const nextSequence = (todayLogs.length + 1).toString().padStart(4, '0');
      return nextSequence;
      
    } catch (error) {
      console.error('生成唯一ID错误:', error);
      return '0001'; // 默认值
    }
  }

  /**
   * 获取用户的复习历史
   */
  async getUserReviewHistory(userId, masterId = null, limit = 50) {
    try {
      const snapshot = await get(ref(db, `reviewLog/${userId}`));
      const reviewLogs = snapshot.val() || {};
      
      // 转换为数组并排序（最新的在前）
      const history = Object.keys(reviewLogs)
        .flatMap(logId => {
          const logEntry = reviewLogs[logId];
          return Object.keys(logEntry).map(masterId => ({
            logId,
            masterId,
            ...logEntry[masterId]
          }));
        })
        .filter(entry => masterId ? entry.master_id === masterId : true)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return history;
      
    } catch (error) {
      console.error('获取复习历史错误:', error);
      return [];
    }
  }

  /**
   * 计算基础质量分数
   */
  calculateBasicQuality(subjectiveScore, quizResults) {
    if (!quizResults || quizResults.total === 0) {
      return subjectiveScore;
    }
    
    const quizScore = quizResults.correct / quizResults.total;
    const quizMapped = 1 + (quizScore * 4);
    
    // 简单加权平均
    return (quizMapped * 0.6) + (subjectiveScore * 0.4);
  }

  /**
   * 计算会话平均质量
   */
  calculateSessionQuality(reviews) {
    const total = reviews.reduce((sum, review) => {
      const quizScore = review.quizResults.correct / review.quizResults.total;
      return sum + (review.subjectiveScore * 0.4 + quizScore * 4 * 0.6);
    }, 0);
    
    return reviews.length > 0 ? total / reviews.length : 0;
  }

  /**
   * 监听复习队列变化（实时更新）
   */
  listenToDueCards(userId, callback) {
    const userSchedulingRef = ref(db, `scheduling_queue/${userId}`);
    
    return onValue(userSchedulingRef, (snapshot) => {
      const scheduledCards = snapshot.val() || {};
      const now = Date.now();
      
      const dueCards = Object.keys(scheduledCards).filter(cardId => 
        scheduledCards[cardId].nextReviewDate <= now
      );
      
      callback({
        count: dueCards.length,
        cards: dueCards,
        timestamp: Date.now()
      });
    });
  }

  /**
   * 停止监听
   */
  stopListening(listener) {
    if (listener) {
      off(listener);
    }
  }

  /**
   * 获取知识树的详细信息
   */
  async getKnowledgeTree(userId, masterId) {
    try {
      const [treeSnapshot, progressSnapshot] = await Promise.all([
        get(ref(db, `card_templates/${masterId}`)),
        get(query(ref(db, 'user_progress'), orderByChild('masterId'), equalTo(masterId)))
      ]);
      
      const knowledgeTree = treeSnapshot.val();
      const userProgress = progressSnapshot.val() || {};
      
      if (!knowledgeTree) {
        throw new Error('知识树未找到');
      }
      
      return {
        ...knowledgeTree,
        userProgress: this.filterUserProgressByMasterId(userProgress, masterId, userId)
      };
      
    } catch (error) {
      console.error('获取知识树错误:', error);
      throw error;
    }
  }

  /**
   * 过滤用户进度数据
   */
  filterUserProgressByMasterId(userProgress, masterId, userId) {
    const filtered = {};
    
    Object.keys(userProgress).forEach(cardId => {
      const progress = userProgress[cardId];
      if (progress.masterId === masterId && cardId.startsWith(`${userId}_`)) {
        filtered[cardId] = progress;
      }
    });
    
    return filtered;
  }

  /**
   * 为用户初始化知识树
   */
  async initializeUserKnowledgeTree(userId, masterId) {
    try {
      // 获取知识树模板
      const treeSnapshot = await get(ref(db, `card_templates/${masterId}`));
      const knowledgeTree = treeSnapshot.val();
      
      if (!knowledgeTree) {
        throw new Error('知识树模板未找到');
      }
      
      // 生成卡片模板
      const templates = CardTemplateGenerator.generateCardTemplates(knowledgeTree);
      const updates = {};
      
      // 为用户创建进度记录
      Object.values(templates).forEach(template => {
        const progressPath = `user_progress/${userId}/${template.cardId}`;
        updates[progressPath] = {
          needsReschedule: true,
          cardType: template.type,
          masterId: template.masterId,
          aspect: template.metadata.aspect,
          createdAt: Date.now(),
          repetition: 0,
          interval: 0,
          easeFactor: 2.5,
          status: 'active'
        };
      });
      
      // 写入更新
      await update(ref(db), updates);
      
      return { 
        success: true, 
        cardCount: Object.keys(templates).length,
        message: `已为用户初始化 ${Object.keys(templates).length} 张卡片`
      };
      
    } catch (error) {
      console.error('初始化用户知识树错误:', error);
      return { success: false, error: error.message };
    }
  }
}


//import { db, ref, get, update } from '../config/firebase-client.js';

class UserService {
  constructor() {
    this.usersRef = ref(db, 'users');
    this.progressRef = ref(db, 'user_progress');
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId) {
    try {
      const [progressSnapshot, schedulingSnapshot] = await Promise.all([
        get(ref(db, `user_progress/${userId}`)),
        get(ref(db, `scheduling_queue/${userId}`))
      ]);
      
      const userProgress = progressSnapshot.val() || {};
      const scheduling = schedulingSnapshot.val() || {};
      
      const cards = Object.values(userProgress);
      const now = Date.now();
      
      const totalCards = cards.length;
      const dueCards = cards.filter(card => {
        const cardId = Object.keys(userProgress).find(key => userProgress[key] === card);
        const schedule = scheduling[cardId];
        return schedule && schedule.nextReviewDate <= now;
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
        masteryLevel: this.calculateMasteryLevel(avgQuality),
        updatedAt: Date.now()
      };
      
    } catch (error) {
      console.error('获取用户统计错误:', error);
      return null;
    }
  }

  /**
   * 计算掌握等级
   */
  calculateMasteryLevel(avgQuality) {
    if (avgQuality >= 4.5) return '专家';
    if (avgQuality >= 4.0) return '熟练';
    if (avgQuality >= 3.0) return '中等';
    if (avgQuality >= 2.0) return '初级';
    return '新手';
  }

  /**
   * 获取用户的学习知识树列表
   */
  async getUserKnowledgeTrees(userId) {
    try {
      const progressSnapshot = await get(ref(db, `user_progress/${userId}`));
      const userProgress = progressSnapshot.val() || {};
      
      // 提取用户学习的所有知识树ID
      const masterIds = [...new Set(
        Object.values(userProgress)
          .filter(progress => progress.masterId)
          .map(progress => progress.masterId)
      )];
      
      // 获取知识树详情
      const treePromises = masterIds.map(masterId => 
        get(ref(db, `card_templates/${masterId}`))
      );
      
      const treeSnapshots = await Promise.all(treePromises);
      
      const knowledgeTrees = masterIds.map((masterId, index) => {
        const tree = treeSnapshots[index].val();
        if (!tree) return null;
        
        // 计算知识树统计
        const treeCards = Object.values(userProgress).filter(p => p.masterId === masterId);
        const treeStats = this.calculateKnowledgeTreeStats(treeCards);
        
        return {
          masterId,
          master_topic: tree.master_topic,
          ...treeStats
        };
      }).filter(tree => tree !== null);
      
      return knowledgeTrees;
      
    } catch (error) {
      console.error('获取用户知识树列表错误:', error);
      return [];
    }
  }

  /**
   * 计算知识树统计
   */
  calculateKnowledgeTreeStats(treeCards) {
    const totalCards = treeCards.length;
    const activeCards = treeCards.filter(card => card.status === 'active').length;
    const avgQuality = totalCards > 0 ? 
      treeCards.reduce((sum, card) => sum + (card.averageQuality || 0), 0) / totalCards : 0;
    
    return {
      totalCards,
      activeCards,
      averageQuality: Math.round(avgQuality * 100) / 100,
      masteryPercentage: Math.round((activeCards / totalCards) * 100)
    };
  }

  /**
   * 更新用户偏好设置
   */
  async updateUserPreferences(userId, preferences) {
    try {
      await update(ref(db, `users/${userId}/preferences`), {
        ...preferences,
        updatedAt: Date.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error('更新用户偏好错误:', error);
      return { success: false, error: error.message };
    }
  }
}


//import { db, ref, set, get, update } from '../config/firebase-client.js';
//import { CardTemplateGenerator } from './CardTemplateGenerator.js';

class AdminService {
  constructor() {
    this.templatesRef = ref(db, 'card_templates');
  }

  /**
   * 创建或更新知识树
   */
  async createKnowledgeTree(knowledgeTree) {
    try {
      // 验证知识树结构
      CardTemplateGenerator.validateKnowledgeTree(knowledgeTree);
      
      // 生成卡片模板（用于验证）
      const templates = CardTemplateGenerator.generateCardTemplates(knowledgeTree);
      
      // 保存知识树到数据库
      await set(ref(db, `card_templates/${knowledgeTree.master_id}`), {
        ...knowledgeTree,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalCards: Object.keys(templates).length,
        isActive: true
      });
      
      return { 
        success: true, 
        cardCount: Object.keys(templates).length,
        message: `知识树创建成功，包含 ${Object.keys(templates).length} 张卡片`
      };
      
    } catch (error) {
      console.error('创建知识树错误:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取所有知识树列表
   */
  async getAllKnowledgeTrees() {
    try {
      const snapshot = await get(this.templatesRef);
      const trees = snapshot.val() || {};
      
      return Object.keys(trees).map(masterId => ({
        masterId,
        ...trees[masterId]
      }));
    } catch (error) {
      console.error('获取知识树列表错误:', error);
      return [];
    }
  }

  /**
   * 为用户分配知识树
   */
  async assignKnowledgeTreeToUser(userId, masterId) {
    try {
      const reviewService = new ReviewService();
      return await reviewService.initializeUserKnowledgeTree(userId, masterId);
    } catch (error) {
      console.error('分配知识树错误:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取系统统计信息
   */
  async getSystemStats() {
    try {
      const [usersSnapshot, templatesSnapshot, progressSnapshot] = await Promise.all([
        get(ref(db, 'users')),
        get(this.templatesRef),
        get(ref(db, 'user_progress'))
      ]);
      
      const users = usersSnapshot.val() || {};
      const templates = templatesSnapshot.val() || {};
      const progress = progressSnapshot.val() || {};
      
      return {
        totalUsers: Object.keys(users).length,
        totalKnowledgeTrees: Object.keys(templates).length,
        totalCards: this.countTotalCards(templates),
        totalReviews: this.countTotalReviews(progress),
        activeUsers: this.countActiveUsers(progress)
      };
    } catch (error) {
      console.error('获取系统统计错误:', error);
      return null;
    }
  }

  /**
   * 计算总卡片数
   */
  countTotalCards(templates) {
    return Object.values(templates).reduce((sum, tree) => {
      return sum + (tree.totalCards || 0);
    }, 0);
  }

  /**
   * 计算总复习次数
   */
  countTotalReviews(progress) {
    return Object.values(progress).reduce((userSum, userProgress) => {
      return userSum + Object.values(userProgress).reduce((cardSum, card) => {
        return cardSum + (card.history ? card.history.length : 0);
      }, 0);
    }, 0);
  }

  /**
   * 计算活跃用户数
   */
  countActiveUsers(progress) {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const activeUsers = new Set();
    
    Object.keys(progress).forEach(userId => {
      const userProgress = progress[userId];
      const hasRecentActivity = Object.values(userProgress).some(card => 
        card.lastReviewed && card.lastReviewed > thirtyDaysAgo
      );
      
      if (hasRecentActivity) {
        activeUsers.add(userId);
      }
    });
    
    return activeUsers.size;
  }
}


class CardTemplateGenerator {
  /**
   * 从知识树生成独立的卡片模板
   */
  static generateCardTemplates(knowledgeTree) {
    const { master_id, master_topic, core_concept_card, satellite_cards } = knowledgeTree;
    const templates = {};
    
    // 生成核心概念卡
    if (core_concept_card) {
      const coreCardId = `${master_id}_core`;
      templates[coreCardId] = {
        cardId: coreCardId,
        masterId: master_id,
        type: 'core_concept',
        content: {
          question: core_concept_card.question,
          answer: core_concept_card.answer,
          summary: core_concept_card.summary
        },
        metadata: {
          aspect: '核心概念',
          difficulty: 'medium',
          tags: [master_topic, '核心概念'],
          estimatedStudyTime: 8
        }
      };
    }
    
    // 生成卫星卡
    satellite_cards.forEach(satellite => {
      const satelliteCardId = `${master_id}_${satellite.card_id}`;
      templates[satelliteCardId] = {
        cardId: satelliteCardId,
        masterId: master_id,
        type: 'satellite',
        content: {
          question: satellite.question,
          answer: satellite.answer,
          aspect: satellite.aspect,
          examples: satellite.examples,
          quizzes: satellite.quizzes
        },
        metadata: {
          aspect: satellite.aspect,
          difficulty: this.calculateDifficulty(satellite),
          tags: [master_topic, satellite.aspect],
          estimatedStudyTime: 5
        }
      };
    });
    
    return templates;
  }
  
  /**
   * 计算卡片难度
   */
  static calculateDifficulty(satellite) {
    const quizCount = satellite.quizzes ? satellite.quizzes.length : 0;
    const exampleCount = satellite.examples ? satellite.examples.length : 0;
    
    if (quizCount >= 3 && exampleCount >= 3) return 'hard';
    if (quizCount >= 2 || exampleCount >= 2) return 'medium';
    return 'easy';
  }

  /**
   * 验证知识树结构的完整性
   */
  static validateKnowledgeTree(knowledgeTree) {
    const required = ['master_id', 'master_topic', 'satellite_cards'];
    const missing = required.filter(field => !knowledgeTree[field]);
    
    if (missing.length > 0) {
      throw new Error(`知识树缺少必要字段: ${missing.join(', ')}`);
    }
    
    if (!Array.isArray(knowledgeTree.satellite_cards)) {
      throw new Error('satellite_cards 必须是数组');
    }
    
    // 验证卫星卡结构
    knowledgeTree.satellite_cards.forEach((satellite, index) => {
      if (!satellite.card_id) {
        throw new Error(`卫星卡 ${index} 缺少 card_id`);
      }
      if (!satellite.question || !satellite.answer) {
        throw new Error(`卫星卡 ${satellite.card_id} 缺少 question 或 answer`);
      }
    });
    
    return true;
  }

  /**
   * 为Web App生成学习视图所需的数据结构
   */
  static generateLearningView(knowledgeTree, userProgress = {}) {
    const templates = this.generateCardTemplates(knowledgeTree);
    const learningData = {
      master_id: knowledgeTree.master_id,
      master_topic: knowledgeTree.master_topic,
      core_concept_card: knowledgeTree.core_concept_card,
      satellite_cards: knowledgeTree.satellite_cards,
      cards: []
    };
    
    Object.values(templates).forEach(template => {
      learningData.cards.push({
        ...template,
        userProgress: userProgress[template.cardId] || null
      });
    });
    
    return learningData;
  }
}