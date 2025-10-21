class SpacedRepetitionSystem {
    constructor() {
        // 默认配置
        this.config = {
            weightQuiz: 0.6,      // Quiz结果权重
            weightSubjective: 0.4, // 主观评分权重
            defaultEaseFactor: 2.5, // 默认简易度因子
            minEaseFactor: 1.3,    // 最小简易度因子
            maxInterval: 36500     // 最大间隔天数（约100年）
        };
    }

    /**
     * 计算融合后的复习质量分数
     * @param {number} subjectiveScore - 主观评分 (1-5)
     * @param {number} quizScore - Quiz正确率 (0.0-1.0)
     * @returns {number} 融合质量分数 (0-5)
     */
    calculateReviewQuality(subjectiveScore, quizScore) {
        // 输入验证
        if (subjectiveScore < 1 || subjectiveScore > 5) {
            throw new Error('主观评分必须在1-5之间');
        }
        if (quizScore < 0 || quizScore > 1) {
            throw new Error('Quiz正确率必须在0-1之间');
        }

        const { weightQuiz, weightSubjective } = this.config;

        // 将正确率映射到 1-5 分范围
        const quizMapped = 1 + (quizScore * 4);

        // 计算加权平均
        let quality = (quizMapped * weightQuiz) + (subjectiveScore * weightSubjective);

        // 处理矛盾情况
        // 主观高分但客观低分：以客观结果为准进行惩罚
        if (subjectiveScore >= 4 && quizScore < 0.8) {
            quality = Math.min(quality, 3.0);
        }
        // 主观低分但客观高分：可能低估了自己，给予鼓励
        else if (subjectiveScore <= 2 && quizScore > 0.9) {
            quality = Math.max(quality, 4.0);
        }

        return Math.round(quality * 100) / 100; // 保留两位小数
    }

    /**
     * 调度算法：计算下一次复习时间
     * @param {Object} cardState - 卡片当前状态
     * @param {number} quality - 融合质量分数
     * @returns {Object} 更新后的卡片状态
     */
    scheduleCard(cardState, quality) {
        let { repetition, interval, easeFactor } = cardState;
        
        // 确保有默认值
        repetition = repetition || 0;
        interval = interval || 0;
        easeFactor = easeFactor || this.config.defaultEaseFactor;

        if (quality < 3) {
            // 答得不好，重置重复次数，缩短间隔
            repetition = 0;
            interval = 1; // 明天再复习
        } else {
            // 答得好，增加重复次数，延长间隔
            repetition += 1;
            
            if (repetition === 1) {
                interval = 1;
            } else if (repetition === 2) {
                interval = 6;
            } else {
                // 使用简易度因子计算新间隔
                interval = Math.round(interval * easeFactor);
            }
        }

        // 限制最大间隔
        interval = Math.min(interval, this.config.maxInterval);

        // 更新简易度因子
        easeFactor = this.calculateNewEaseFactor(easeFactor, quality);

        return {
            repetition,
            interval,
            easeFactor: Math.round(easeFactor * 100) / 100
        };
    }

    /**
     * 计算新的简易度因子
     * @param {number} currentEaseFactor - 当前简易度因子
     * @param {number} quality - 融合质量分数
     * @returns {number} 新的简易度因子
     */
    calculateNewEaseFactor(currentEaseFactor, quality) {
        const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        const newEaseFactor = currentEaseFactor + delta;
        
        return Math.max(this.config.minEaseFactor, newEaseFactor);
    }

    /**
     * 处理完整的复习会话
     * @param {Object} card - 卡片对象
     * @param {number} subjectiveScore - 主观评分
     * @param {number} quizCorrect - Quiz答对题数
     * @param {number} quizTotal - Quiz总题数
     * @returns {Object} 更新后的卡片和复习结果
     */
    processReviewSession(card, subjectiveScore, quizCorrect, quizTotal) {
        const quizScore = quizCorrect / quizTotal;
        
        // 计算融合质量分数
        const quality = this.calculateReviewQuality(subjectiveScore, quizScore);
        
        // 获取当前卡片状态
        const currentState = {
            repetition: card.repetition || 0,
            interval: card.interval || 0,
            easeFactor: card.easeFactor || this.config.defaultEaseFactor
        };

        // 计算新的调度状态
        const newState = this.scheduleCard(currentState, quality);
        
        // 计算下次复习日期
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + newState.interval);

        // 创建复习记录
        const reviewRecord = {
            date: new Date().toISOString(),
            subjectiveScore,
            quizScore,
            quizCorrect,
            quizTotal,
            computedQuality: quality,
            scheduledInterval: newState.interval,
            previousState: currentState,
            newState: { ...newState }
        };

        return {
            card: {
                ...card,
                ...newState,
                nextReviewDate: nextReviewDate.toISOString(),
                lastReviewed: new Date().toISOString(),
                history: [...(card.history || []), reviewRecord]
            },
            reviewResult: {
                quality,
                nextReviewDate: nextReviewDate.toISOString(),
                interval: newState.interval,
                recommendation: this.getRecommendation(quality)
            }
        };
    }

    /**
     * 根据质量分数获取学习建议
     * @param {number} quality - 融合质量分数
     * @returns {string} 学习建议
     */
    getRecommendation(quality) {
        if (quality >= 4.5) {
            return "掌握得很好！可以长时间间隔后复习。";
        } else if (quality >= 3.5) {
            return "掌握良好，按计划复习即可。";
        } else if (quality >= 3) {
            return "基本掌握，建议缩短复习间隔。";
        } else if (quality >= 2) {
            return "掌握不牢，需要重点复习。";
        } else {
            return "未掌握，建议立即重新学习。";
        }
    }

    /**
     * 获取今日需要复习的卡片
     * @param {Array} cards - 所有卡片数组
     * @returns {Array} 需要今日复习的卡片
     */
    getDueCards(cards) {
        const today = new Date().toISOString().split('T')[0];
        
        return cards.filter(card => {
            if (!card.nextReviewDate) return true; // 从未复习过的卡片
            
            const reviewDate = card.nextReviewDate.split('T')[0];
            return reviewDate <= today;
        });
    }

    /**
     * 根据历史表现计算卡片难度
     * @param {Object} card - 卡片对象
     * @returns {number} 难度系数 (1.0-3.0)
     */
    calculateCardDifficulty(card) {
        if (!card.history || card.history.length === 0) {
            return 1.5; // 默认中等难度
        }

        const totalReviews = card.history.length;
        const avgQuality = card.history.reduce((sum, record) => 
            sum + record.computedQuality, 0) / totalReviews;

        // 质量分数越低，难度越高
        if (avgQuality >= 4.0) return 1.0;    // 简单
        if (avgQuality >= 3.0) return 1.5;    // 中等
        if (avgQuality >= 2.0) return 2.0;    // 困难
        return 3.0;                           // 极难
    }
}

module.exports = SpacedRepetitionSystem;