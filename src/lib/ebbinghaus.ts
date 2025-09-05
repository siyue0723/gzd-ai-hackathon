import { prisma } from './prisma';

// 艾宾浩斯遗忘曲线时间间隔（小时）
const EBBINGHAUS_INTERVALS = [1, 8, 24, 72, 168, 336, 720]; // 1小时, 8小时, 1天, 3天, 1周, 2周, 1个月

// 学习记录状态
export enum ReviewStatus {
  NEW = 'new',
  LEARNING = 'learning', 
  REVIEW = 'review',
  MASTERED = 'mastered'
}

// 复习难度
export enum ReviewDifficulty {
  EASY = 'easy',
  NORMAL = 'normal', 
  HARD = 'hard',
  AGAIN = 'again'
}

// 学习记录数据结构
export interface LearningProgress {
  cardId: string;
  userId: string;
  viewCount: number;
  correctCount: number;
  wrongCount: number;
  lastViewedAt: Date;
  nextReviewAt: Date;
  masteryLevel: number; // 掌握程度 0-100
}

// 艾宾浩斯算法类
export class EbbinghausAlgorithm {
  /**
   * 计算下次复习时间
   */
  static calculateNextReview(
    difficulty: ReviewDifficulty,
    currentInterval: number,
    masteryLevel: number,
    viewCount: number
  ): { nextInterval: number; newMasteryLevel: number; nextReviewAt: Date } {
    let newMasteryLevel = masteryLevel;
    let nextInterval = currentInterval;

    switch (difficulty) {
      case ReviewDifficulty.AGAIN:
        // 重新开始
        nextInterval = EBBINGHAUS_INTERVALS[0]; // 1小时后
        newMasteryLevel = Math.max(0, masteryLevel - 20);
        break;
        
      case ReviewDifficulty.HARD:
        // 困难：间隔缩短，掌握度略微下降
        nextInterval = Math.max(EBBINGHAUS_INTERVALS[0], currentInterval * 1.2);
        newMasteryLevel = Math.max(0, masteryLevel - 10);
        break;
        
      case ReviewDifficulty.NORMAL:
        // 正常：按标准间隔，掌握度提升
        if (viewCount < EBBINGHAUS_INTERVALS.length) {
          nextInterval = EBBINGHAUS_INTERVALS[viewCount];
        } else {
          nextInterval = currentInterval * 1.5;
        }
        newMasteryLevel = Math.min(100, masteryLevel + 10);
        break;
        
      case ReviewDifficulty.EASY:
        // 简单：间隔延长，掌握度大幅提升
        nextInterval = currentInterval * 2;
        newMasteryLevel = Math.min(100, masteryLevel + 20);
        break;
    }

    // 计算下次复习时间
    const nextReviewAt = new Date();
    nextReviewAt.setHours(nextReviewAt.getHours() + nextInterval);

    return {
      nextInterval,
      newMasteryLevel,
      nextReviewAt
    };
  }

  /**
   * 更新学习记录
   */
  static async updateLearningRecord(
    userId: string,
    cardId: string,
    difficulty: ReviewDifficulty,
    isCorrect: boolean = true
  ): Promise<any> {
    try {
      // 获取现有学习记录
      let record = await prisma.learningRecord.findFirst({
        where: { userId, cardId }
      });

      if (!record) {
        // 创建新记录
        record = await prisma.learningRecord.create({
          data: {
            userId,
            cardId,
            viewCount: 0,
            correctCount: 0,
            wrongCount: 0,
            lastViewedAt: new Date(),
            nextReviewAt: new Date(Date.now() + EBBINGHAUS_INTERVALS[0] * 60 * 60 * 1000),
            masteryLevel: 0
          }
        });
      }

      // 计算掌握程度
      const totalAttempts = record.correctCount + record.wrongCount + 1;
      const newCorrectCount = isCorrect ? record.correctCount + 1 : record.correctCount;
      const newWrongCount = isCorrect ? record.wrongCount : record.wrongCount + 1;
      const masteryLevel = Math.min(100, Math.floor((newCorrectCount / totalAttempts) * 100));

      // 计算下次复习时间
      let nextReviewInterval = EBBINGHAUS_INTERVALS[0]; // 默认1小时
      if (masteryLevel >= 80) {
        nextReviewInterval = EBBINGHAUS_INTERVALS[Math.min(6, Math.floor(masteryLevel / 15))];
      } else if (masteryLevel >= 60) {
        nextReviewInterval = EBBINGHAUS_INTERVALS[2]; // 1天
      } else if (masteryLevel >= 40) {
        nextReviewInterval = EBBINGHAUS_INTERVALS[1]; // 8小时
      }

      const nextReviewAt = new Date(Date.now() + nextReviewInterval * 60 * 60 * 1000);

      // 更新记录
      const updatedRecord = await prisma.learningRecord.update({
        where: { id: record.id },
        data: {
          viewCount: record.viewCount + 1,
          correctCount: newCorrectCount,
          wrongCount: newWrongCount,
          lastViewedAt: new Date(),
          nextReviewAt,
          masteryLevel
        }
      });

      return updatedRecord;
    } catch (error) {
      console.error('更新学习记录失败:', error);
      throw new Error('更新学习记录失败');
    }
  }

  /**
   * 获取需要复习的卡片
   */
  static async getDueCards(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const now = new Date();
      
      const dueRecords = await prisma.learningRecord.findMany({
        where: {
          userId,
          nextReviewAt: {
            lte: now
          },
          masteryLevel: {
            lt: 100 // 掌握程度小于100的需要复习
          }
        },
        include: {
          card: true
        },
        orderBy: [
          { nextReviewAt: 'asc' }, // 优先复习过期时间最长的
          { correctCount: 'asc' }   // 其次是答对次数少的
        ],
        take: limit
      });

      return dueRecords;
    } catch (error) {
      console.error('获取待复习卡片失败:', error);
      throw new Error('获取待复习卡片失败');
    }
  }

  /**
   * 获取用户学习统计
   */
  static async getUserStats(userId: string): Promise<{
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    masteredCards: number;
    dueCards: number;
    todayReviewed: number;
  }> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const [totalCards, newCards, learningCards, reviewCards, masteredCards, dueCards, todayReviewed] = await Promise.all([
        // 总卡片数
        prisma.learningRecord.count({
          where: { userId }
        }),
        // 新卡片 (掌握程度为0)
        prisma.learningRecord.count({
          where: { userId, masteryLevel: 0 }
        }),
        // 学习中 (掌握程度1-39)
        prisma.learningRecord.count({
          where: { userId, masteryLevel: { gte: 1, lt: 40 } }
        }),
        // 复习中 (掌握程度40-79)
        prisma.learningRecord.count({
          where: { userId, masteryLevel: { gte: 40, lt: 80 } }
        }),
        // 已掌握 (掌握程度80-100)
        prisma.learningRecord.count({
          where: { userId, masteryLevel: { gte: 80 } }
        }),
        // 待复习
        prisma.learningRecord.count({
          where: {
            userId,
            nextReviewAt: { lte: now },
            masteryLevel: { lt: 100 }
          }
        }),
        // 今日已复习
        prisma.learningRecord.count({
          where: {
            userId,
            lastViewedAt: { gte: todayStart }
          }
        })
      ]);

      return {
        totalCards,
        newCards,
        learningCards,
        reviewCards,
        masteredCards,
        dueCards,
        todayReviewed
      };
    } catch (error) {
      console.error('获取用户统计失败:', error);
      throw new Error('获取用户统计失败');
    }
  }

  /**
   * 检查用户设置的碎片时间，推送复习提醒
   */
  static async checkFragmentTimeReminder(userId: string): Promise<{
    shouldRemind: boolean;
    dueCount: number;
    message?: string;
  }> {
    try {
      // 获取用户设置的碎片时间（这里简化处理，实际应该从用户设置中获取）
      const now = new Date();
      const hour = now.getHours();
      
      // 默认碎片时间段：上午10点、下午3点、晚上8点
      const fragmentTimes = [10, 15, 20];
      const isFragmentTime = fragmentTimes.includes(hour) && now.getMinutes() < 30;
      
      if (!isFragmentTime) {
        return { shouldRemind: false, dueCount: 0 };
      }

      // 检查是否有待复习的卡片
      const dueCards = await this.getDueCards(userId, 5);
      
      if (dueCards.length === 0) {
        return { shouldRemind: false, dueCount: 0 };
      }

      const message = `您有 ${dueCards.length} 张卡片需要复习，利用碎片时间巩固一下吧！`;
      
      return {
        shouldRemind: true,
        dueCount: dueCards.length,
        message
      };
    } catch (error) {
      console.error('检查碎片时间提醒失败:', error);
      return { shouldRemind: false, dueCount: 0 };
    }
  }
}

export default EbbinghausAlgorithm;