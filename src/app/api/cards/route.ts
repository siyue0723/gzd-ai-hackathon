import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { EbbinghausAlgorithm } from '@/lib/ebbinghaus';

// 获取用户的学习卡片列表
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const subject = searchParams.get('subject');
    const status = searchParams.get('status'); // new, learning, review, mastered
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      learningRecords: {
        some: {
          userId: payload.userId
        }
      }
    };

    if (subject) {
      where.subject = subject;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { corePoint: { contains: search } },
        { tags: { contains: search } }
      ];
    }

    // 如果按状态筛选，需要联合查询学习记录
    let learningRecordWhere: any = {
      userId: payload.userId
    };

    if (status) {
      learningRecordWhere.status = status;
    }

    // 获取卡片列表
    const cards = await prisma.studyCard.findMany({
      where,
      include: {
        learningRecords: {
          where: learningRecordWhere,
          take: 1
        },
        _count: {
          select: {
            learningRecords: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // 获取总数
    const total = await prisma.studyCard.count({ where });

    // 格式化返回数据
    const formattedCards = cards.map(card => {
      const learningRecord = card.learningRecords[0];
      return {
        id: card.id,
        title: card.title,
        subject: card.subject,
        corePoint: card.corePoint,
        confusionPoint: card.confusionPoint,
        example: card.example,
        difficulty: card.difficulty,
        tags: card.tags ? card.tags.split(',') : [],
        sketchPrompt: card.sketchPrompt,
        createdAt: card.createdAt,
        learningProgress: learningRecord ? {
          status: learningRecord.status,
          reviewCount: learningRecord.reviewCount,
          correctCount: learningRecord.correctCount,
          lastReviewAt: learningRecord.lastReviewAt,
          nextReviewAt: learningRecord.nextReviewAt,
          accuracy: learningRecord.reviewCount > 0 
            ? Math.round((learningRecord.correctCount / learningRecord.reviewCount) * 100)
            : 0
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      cards: formattedCards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取学习卡片失败:', error);
    return NextResponse.json(
      { error: '获取学习卡片失败' },
      { status: 500 }
    );
  }
}

// 删除学习卡片
export async function DELETE(request: NextRequest) {
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
    const cardId = searchParams.get('id');

    if (!cardId) {
      return NextResponse.json({ error: '请提供卡片ID' }, { status: 400 });
    }

    // 检查卡片是否属于当前用户
    const card = await prisma.studyCard.findFirst({
      where: {
        id: cardId,
        createdBy: payload.userId
      }
    });

    if (!card) {
      return NextResponse.json({ error: '卡片不存在或无权限删除' }, { status: 404 });
    }

    // 删除相关的学习记录
    await prisma.learningRecord.deleteMany({
      where: {
        cardId,
        userId: payload.userId
      }
    });

    // 删除卡片
    await prisma.studyCard.delete({
      where: { id: cardId }
    });

    return NextResponse.json({
      success: true,
      message: '卡片删除成功'
    });
  } catch (error) {
    console.error('删除学习卡片失败:', error);
    return NextResponse.json(
      { error: '删除学习卡片失败' },
      { status: 500 }
    );
  }
}