class CardTemplate {
  constructor(data) {
    this.cardId = data.cardId;
    this.masterId = data.masterId;
    this.version = data.version;
    this.content = data.content;        // 学习内容
    this.metadata = data.metadata;      // 元数据
    this.system = data.system;          // 系统字段
  }

  // 验证卡片内容完整性
  validate() {
    const required = ['cardId', 'masterId', 'content.question', 'content.answer'];
    const missing = required.filter(field => !this.getField(field));
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    return true;
  }

  // 创建新版本
  createNewVersion(updates) {
    return new CardTemplate({
      ...this,
      ...updates,
      version: this.incrementVersion(this.version),
      system: {
        ...this.system,
        updatedAt: Date.now()
      }
    });
  }

  incrementVersion(version) {
    const [major, minor, patch] = version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }
}