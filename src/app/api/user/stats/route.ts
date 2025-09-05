import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { EbbinghausAlgorithm } from '@/lib/ebbinghaus';

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 });
    }

    // 获取用户基本信息
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        coins: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 获取学习统计
    const learningStats = await EbbinghausAlgorithm.getUserStats(payload.userId);

    // 获取测验统计
    const quizStats = await prisma.quizResult.aggregate({
      where: { userId: payload.userId },
      _count: { id: true },
      _avg: { score: true },
      _sum: { totalQuestions: true, correctAnswers: true }
    });

    // 获取最近7天的学习活动
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivity = await prisma.studySession.findMany({
      where: {
        userId: payload.userId,
        sessionDate: { gte: sevenDaysAgo }
      },
      orderBy: { sessionDate: 'desc' },
      take: 20,
      include: {
        card: {
          select: {
            title: true,
            subject: true
          }
        }
      }
    });

    // 按日期分组统计每日学习数量
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayActivity = recentActivity.filter(activity => 
        activity.sessionDate.toISOString().split('T')[0] === dateStr
      );
      
      dailyStats.push({
        date: dateStr,
        reviewCount: dayActivity.length,
        correctCount: dayActivity.filter(a => a.isCorrect).length
      });
    }

    // 获取分享统计
    const shareStats = await prisma.sharedCard.aggregate({
      where: { createdBy: payload.userId },
      _count: { id: true },
      _sum: { purchaseCount: true }
    });

    // 获取购买统计
    const purchaseStats = await prisma.cardPurchase.aggregate({
      where: { userId: payload.userId },
      _count: { id: true },
      _sum: { price: true }
    });

    // 获取学科分布
    const subjectDistribution = await prisma.studyCard.groupBy({
      by: ['subject'],
      where: {
        learningRecords: {
          some: {
            userId: payload.userId
          }
        }
      },
      _count: { id: true }
    });

    // 计算总体准确率
    const totalQuestions = quizStats._sum.totalQuestions || 0;
    const totalCorrect = quizStats._sum.correctAnswers || 0;
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        joinedAt: user.createdAt
      },
      learning: {
        ...learningStats,
        dailyStats
      },
      quiz: {
        totalQuizzes: quizStats._count.id || 0,
        averageScore: Math.round(quizStats._avg.score || 0),
        totalQuestions,
        totalCorrect,
        overallAccuracy
      },
      community: {
        sharedCards: shareStats._count.id || 0,
        totalSales: shareStats._sum.purchaseCount || 0,
        purchasedCards: purchaseStats._count.id || 0,
        totalSpent: purchaseStats._sum.price || 0
      },
      subjects: subjectDistribution.map(item => ({
        subject: item.subject,
        cardCount: item._count.id
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        cardTitle: activity.card.title,
        subject: activity.card.subject,
        difficulty: activity.reviewDifficulty,
        isCorrect: activity.isCorrect,
        timeSpent: activity.timeSpent,
        date: activity.sessionDate
      }))
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    return NextResponse.json(
      { error: '获取用户统计失败' },
      { status: 500 }
    );
  }
}