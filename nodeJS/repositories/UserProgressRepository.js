const { db } = require('../config/firebase');
const UserProgress = require('../models/UserProgress');

class UserProgressRepository {
  constructor() {
    this.ref = db.ref('user_progress');
  }

  async findByUserAndCard(userId, cardId) {
    const snapshot = await this.ref
      .child(userId)
      .child(cardId)
      .once('value');
    
    const data = snapshot.val();
    return data ? new UserProgress(userId, cardId, data) : null;
  }

  async findByUser(userId) {
    const snapshot = await this.ref.child(userId).once('value');
    const progresses = [];
    
    snapshot.forEach(childSnapshot => {
      progresses.push(new UserProgress(
        userId, 
        childSnapshot.key, 
        childSnapshot.val()
      ));
    });
    
    return progresses;
  }

  async save(progress) {
    await this.ref
      .child(progress.userId)
      .child(progress.cardId)
      .set(progress);
    
    return progress;
  }

  async saveBatch(progresses) {
    const updates = {};
    
    progresses.forEach(progress => {
      updates[`${progress.userId}/${progress.cardId}`] = progress;
    });
    
    await this.ref.update(updates);
  }
}