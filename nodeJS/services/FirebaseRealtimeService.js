const { db } = require('../config/firebase');

class FirebaseRealtimeService {
  constructor() {
    this.activeListeners = new Map();
  }

  /**
   * 监听用户卡片变化
   */
  listenToUserCards(userId, callback) {
    try {
      const listenerRef = db.ref('cards')
        .orderByChild('userId')
        .equalTo(userId);
      
      const listener = listenerRef.on('value', (snapshot) => {
        const cards = snapshot.val() || {};
        callback({
          type: 'cards_updated',
          data: Object.values(cards),
          timestamp: Date.now()
        });
      });
      
      this.activeListeners.set(`cards_${userId}`, {
        ref: listenerRef,
        listener: listener
      });
      
      return () => this.stopListening(`cards_${userId}`);
      
    } catch (error) {
      console.error('监听用户卡片错误:', error);
      throw error;
    }
  }

  /**
   * 监听复习队列变化
   */
  listenToReviewQueue(userId, callback) {
    try {
      const now = Date.now();
      const listenerRef = db.ref('cards')
        .orderByChild('userId')
        .equalTo(userId);
      
      const listener = listenerRef.on('value', (snapshot) => {
        const cards = snapshot.val() || {};
        const dueCards = Object.values(cards).filter(card => 
          (card.nextReviewDate || 0) <= now
        );
        
        callback({
          type: 'queue_updated',
          data: dueCards,
          count: dueCards.length,
          timestamp: Date.now()
        });
      });
      
      this.activeListeners.set(`queue_${userId}`, {
        ref: listenerRef,
        listener: listener
      });
      
      return () => this.stopListening(`queue_${userId}`);
      
    } catch (error) {
      console.error('监听复习队列错误:', error);
      throw error;
    }
  }

  /**
   * 停止监听
   */
  stopListening(key) {
    const listenerInfo = this.activeListeners.get(key);
    if (listenerInfo) {
      listenerInfo.ref.off('value', listenerInfo.listener);
      this.activeListeners.delete(key);
    }
  }

  /**
   * 停止所有监听
   */
  stopAllListeners() {
    this.activeListeners.forEach((listenerInfo, key) => {
      listenerInfo.ref.off('value', listenerInfo.listener);
    });
    this.activeListeners.clear();
  }

  /**
   * 实时推送复习提醒
   */
  async sendReviewNotification(userId, cardId, message) {
    try {
      const notificationRef = db.ref(`notifications/${userId}`).push();
      
      await notificationRef.set({
        userId,
        cardId,
        message,
        type: 'review_reminder',
        read: false,
        createdAt: Date.now()
      });
      
      return notificationRef.key;
    } catch (error) {
      console.error('发送通知错误:', error);
      throw error;
    }
  }

  /**
   * 获取未读通知
   */
  async getUnreadNotifications(userId) {
    try {
      const snapshot = await db.ref(`notifications/${userId}`)
        .orderByChild('read')
        .equalTo(false)
        .once('value');
      
      return snapshot.val() || {};
    } catch (error) {
      console.error('获取通知错误:', error);
      throw error;
    }
  }
}

module.exports = FirebaseRealtimeService;