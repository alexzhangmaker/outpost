const { db } = require('../config/firebase');
const CardTemplate = require('../models/CardTemplate');

class CardTemplateRepository {
  constructor() {
    this.ref = db.ref('card_templates');
  }

  async findById(cardId) {
    const snapshot = await this.ref.child(cardId).once('value');
    const data = snapshot.val();
    return data ? new CardTemplate(data) : null;
  }

  async findByMasterId(masterId) {
    const snapshot = await this.ref
      .orderByChild('masterId')
      .equalTo(masterId)
      .once('value');
    
    const templates = [];
    snapshot.forEach(childSnapshot => {
      templates.push(new CardTemplate(childSnapshot.val()));
    });
    
    return templates;
  }

  async save(template) {
    template.validate();
    
    await this.ref.child(template.cardId).set({
      ...template,
      system: {
        ...template.system,
        updatedAt: Date.now()
      }
    });
    
    return template;
  }

  async deactivate(cardId) {
    await this.ref.child(cardId).update({
      'system.isActive': false,
      'system.updatedAt': Date.now()
    });
  }
}