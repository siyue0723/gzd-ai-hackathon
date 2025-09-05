import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

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
    const { input, subject } = body;

    if (!input || input.trim().length === 0) {
      return NextResponse.json({ error: '请提供学习内容' }, { status: 400 });
    }

    if (input.length > 5000) {
      return NextResponse.json({ error: '输入内容过长，请控制在5000字符以内' }, { status: 400 });
    }

    // 使用AI生成学习卡片
    const cardData = await AIService.generateStudyCard(input, subject);

    // 生成简笔画提示词
    const sketchPrompt = await AIService.generateSketchPrompt(cardData.corePoint);

    // 保存到数据库
    const savedCard = await prisma.studyCard.create({
      data: {
        title: cardData.title,
        subject: cardData.subject,
        corePoint: cardData.corePoint,
        confusionPoint: cardData.confusionPoint,
        example: cardData.example,
        difficulty: cardData.difficulty,
        tags: cardData.tags.join(','),
        sketchPrompt,
        userId: payload.userId,
        isPublic: false
      }
    });

    // 创建学习记录
    await prisma.learningRecord.create({
      data: {
        userId: payload.userId,
        cardId: savedCard.id,
        viewCount: 0,
        correctCount: 0,
        wrongCount: 0,
        lastViewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后复习
        masteryLevel: 0
      }
    });

    return NextResponse.json({
      success: true,
      card: {
        id: savedCard.id,
        title: savedCard.title,
        subject: savedCard.subject,
        corePoint: savedCard.corePoint,
        confusionPoint: savedCard.confusionPoint,
        example: savedCard.example,
        difficulty: savedCard.difficulty,
        tags: cardData.tags,
        sketchPrompt,
        createdAt: savedCard.createdAt
      }
    });
  } catch (error) {
    console.error('生成学习卡片失败:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}