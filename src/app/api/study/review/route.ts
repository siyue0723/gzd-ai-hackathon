import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { EbbinghausAlgorithm, ReviewDifficulty } from '@/lib/ebbinghaus';

// 获取待复习的卡片
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取待复习的卡片
    const dueCards = await EbbinghausAlgorithm.getDueCards(payload.userId, limit);

    // 获取用户学习统计
    const stats = await EbbinghausAlgorithm.getUserStats(payload.userId);

    // 格式化返回数据
    const formattedCards = dueCards.map(record => ({
      id: record.card.id,
      title: record.card.title,
      subject: record.card.subject,
      corePoint: record.card.corePoint,
      confusionPoint: record.card.confusionPoint,
      example: record.card.example,
      difficulty: record.card.difficulty,
      tags: record.card.tags ? record.card.tags.split(',') : [],
      sketchPrompt: record.card.sketchPrompt,
      learningProgress: {
        status: record.masteryLevel >= 80 ? 'MASTERED' : 
                record.masteryLevel >= 40 ? 'REVIEW' : 
                record.masteryLevel >= 1 ? 'LEARNING' : 'NEW',
        reviewCount: record.viewCount,
        correctCount: record.correctCount,
        lastReviewAt: record.lastViewedAt,
        nextReviewAt: record.nextReviewAt,
        accuracy: record.viewCount > 0 
          ? Math.round((record.correctCount / record.viewCount) * 100)
          : 0
      }
    }));

    return NextResponse.json({
      success: true,
      dueCards: formattedCards,
      stats
    });
  } catch (error) {
    console.error('获取待复习卡片失败:', error);
    return NextResponse.json(
      { error: '获取待复习卡片失败' },
      { status: 500 }
    );
  }
}

// 更新复习记录
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { cardId, difficulty, isCorrect = true } = body;

    if (!cardId) {
      return NextResponse.json({ error: '请提供卡片ID' }, { status: 400 });
    }

    if (!Object.values(ReviewDifficulty).includes(difficulty)) {
      return NextResponse.json({ error: '无效的复习难度' }, { status: 400 });
    }

    // 检查卡片是否存在
    const card = await prisma.studyCard.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return NextResponse.json({ error: '卡片不存在' }, { status: 404 });
    }

    // 更新学习记录
    const updatedRecord = await EbbinghausAlgorithm.updateLearningRecord(
      payload.userId,
      cardId,
      difficulty,
      isCorrect
    );

    // 创建学习会话记录
    await prisma.studySession.create({
      data: {
        userId: payload.userId,
        cardId,
        reviewDifficulty: difficulty,
        isCorrect,
        timeSpent: body.timeSpent || 0,
        sessionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      learningProgress: {
        status: updatedRecord.status,
        reviewCount: updatedRecord.reviewCount,
        correctCount: updatedRecord.correctCount,
        lastReviewAt: updatedRecord.lastReviewAt,
        nextReviewAt: updatedRecord.nextReviewAt,
        interval: updatedRecord.interval,
        easeFactor: updatedRecord.easeFactor,
        accuracy: updatedRecord.reviewCount > 0 
          ? Math.round((updatedRecord.correctCount / updatedRecord.reviewCount) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error('更新复习记录失败:', error);
    return NextResponse.json(
      { error: '更新复习记录失败' },
      { status: 500 }
    );
  }
}