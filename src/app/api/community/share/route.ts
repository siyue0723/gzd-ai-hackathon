import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai-service';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// 分享卡片到社群
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
    const { cardId, price = 0.5, description } = body;

    if (!cardId) {
      return NextResponse.json({ error: '请提供卡片ID' }, { status: 400 });
    }

    if (price < 0.1 || price > 10) {
      return NextResponse.json({ error: '价格应在0.1-10代币之间' }, { status: 400 });
    }

    // 检查卡片是否存在且属于当前用户
    const card = await prisma.studyCard.findFirst({
      where: {
        id: cardId,
        createdBy: payload.userId
      }
    });

    if (!card) {
      return NextResponse.json({ error: '卡片不存在或无权限分享' }, { status: 404 });
    }

    // 检查是否已经分享过
    const existingShare = await prisma.sharedCard.findFirst({
      where: {
        cardId,
        createdBy: payload.userId
      }
    });

    if (existingShare) {
      return NextResponse.json({ error: '该卡片已经分享过了' }, { status: 400 });
    }

    // 构造卡片数据用于AI审核
    const cardData = {
      title: card.title,
      subject: card.subject,
      corePoint: card.corePoint,
      confusionPoint: card.confusionPoint,
      example: card.example,
      difficulty: card.difficulty,
      tags: card.tags ? card.tags.split(',') : []
    };

    // AI审核卡片内容
    const reviewResult = await AIService.reviewCardContent(cardData);

    if (!reviewResult.approved) {
      return NextResponse.json({
        error: '卡片内容审核未通过',
        reason: reviewResult.reason,
        suggestions: reviewResult.suggestions
      }, { status: 400 });
    }

    // 创建分享记录
    const sharedCard = await prisma.sharedCard.create({
      data: {
        cardId,
        createdBy: payload.userId,
        price,
        description: description || '',
        status: 'approved', // AI审核通过直接上架
        approvedAt: new Date()
      }
    });

    // 更新原卡片为公开状态
    await prisma.studyCard.update({
      where: { id: cardId },
      data: { isPublic: true }
    });

    return NextResponse.json({
      success: true,
      sharedCard: {
        id: sharedCard.id,
        cardId: sharedCard.cardId,
        price: sharedCard.price,
        description: sharedCard.description,
        status: sharedCard.status,
        createdAt: sharedCard.createdAt
      },
      reviewResult
    });
  } catch (error) {
    console.error('分享卡片失败:', error);
    
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

// 获取社群分享的卡片列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const subject = searchParams.get('subject');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'latest'; // latest, popular, price

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      status: 'approved'
    };

    if (subject) {
      where.card = {
        subject
      };
    }

    if (search) {
      where.OR = [
        {
          card: {
            title: { contains: search }
          }
        },
        {
          card: {
            corePoint: { contains: search }
          }
        },
        {
          description: { contains: search }
        }
      ];
    }

    // 排序条件
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'popular') {
      orderBy = { purchaseCount: 'desc' };
    } else if (sortBy === 'price') {
      orderBy = { price: 'asc' };
    }

    // 获取分享卡片列表
    const sharedCards = await prisma.sharedCard.findMany({
      where,
      include: {
        card: {
          select: {
            id: true,
            title: true,
            subject: true,
            corePoint: true,
            difficulty: true,
            tags: true,
            createdAt: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        _count: {
          select: {
            purchases: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // 获取总数
    const total = await prisma.sharedCard.count({ where });

    // 格式化返回数据
    const formattedCards = sharedCards.map(sharedCard => ({
      id: sharedCard.id,
      price: sharedCard.price,
      description: sharedCard.description,
      purchaseCount: sharedCard._count.purchases,
      createdAt: sharedCard.createdAt,
      card: {
        id: sharedCard.card.id,
        title: sharedCard.card.title,
        subject: sharedCard.card.subject,
        corePoint: sharedCard.card.corePoint.substring(0, 100) + '...', // 只显示前100字符
        difficulty: sharedCard.card.difficulty,
        tags: sharedCard.card.tags ? sharedCard.card.tags.split(',') : [],
        createdAt: sharedCard.card.createdAt
      },
      creator: {
        id: sharedCard.creator.id,
        username: sharedCard.creator.username
      }
    }));

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
    console.error('获取社群卡片失败:', error);
    return NextResponse.json(
      { error: '获取社群卡片失败' },
      { status: 500 }
    );
  }
}