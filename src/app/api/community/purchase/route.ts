import { NextRequest, NextResponse } from 'next/server';
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
    const { sharedCardId } = body;

    if (!sharedCardId) {
      return NextResponse.json({ error: '请提供分享卡片ID' }, { status: 400 });
    }

    // 获取分享卡片信息
    const sharedCard = await prisma.sharedCard.findUnique({
      where: { id: sharedCardId },
      include: {
        card: true,
        creator: true
      }
    });

    if (!sharedCard) {
      return NextResponse.json({ error: '分享卡片不存在' }, { status: 404 });
    }

    if (sharedCard.status !== 'approved') {
      return NextResponse.json({ error: '该卡片暂不可购买' }, { status: 400 });
    }

    // 检查是否是自己的卡片
    if (sharedCard.createdBy === payload.userId) {
      return NextResponse.json({ error: '不能购买自己分享的卡片' }, { status: 400 });
    }

    // 检查是否已经购买过
    const existingPurchase = await prisma.cardPurchase.findFirst({
      where: {
        userId: payload.userId,
        sharedCardId
      }
    });

    if (existingPurchase) {
      return NextResponse.json({ error: '您已经购买过这张卡片了' }, { status: 400 });
    }

    // 获取购买者信息
    const buyer = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!buyer) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 检查代币余额
    if (buyer.coins < sharedCard.price) {
      return NextResponse.json({ 
        error: '代币余额不足',
        required: sharedCard.price,
        current: buyer.coins
      }, { status: 400 });
    }

    // 开始事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 扣除购买者代币
      await tx.user.update({
        where: { id: payload.userId },
        data: {
          coins: {
            decrement: sharedCard.price
          }
        }
      });

      // 给创作者增加代币（70%）
      const creatorEarning = Math.round(sharedCard.price * 0.7 * 100) / 100;
      await tx.user.update({
        where: { id: sharedCard.createdBy },
        data: {
          coins: {
            increment: creatorEarning
          }
        }
      });

      // 创建购买记录
      const purchase = await tx.cardPurchase.create({
        data: {
          userId: payload.userId,
          sharedCardId,
          price: sharedCard.price,
          purchasedAt: new Date()
        }
      });

      // 为购买者创建学习记录
      await tx.learningRecord.create({
        data: {
          userId: payload.userId,
          cardId: sharedCard.cardId,
          status: 'new',
          reviewCount: 0,
          correctCount: 0,
          lastReviewAt: new Date(),
          nextReviewAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后复习
          interval: 1,
          easeFactor: 2.5
        }
      });

      // 更新分享卡片的购买次数
      await tx.sharedCard.update({
        where: { id: sharedCardId },
        data: {
          purchaseCount: {
            increment: 1
          }
        }
      });

      return {
        purchase,
        creatorEarning,
        card: sharedCard.card
      };
    });

    return NextResponse.json({
      success: true,
      purchase: {
        id: result.purchase.id,
        price: result.purchase.price,
        purchasedAt: result.purchase.purchasedAt
      },
      card: {
        id: result.card.id,
        title: result.card.title,
        subject: result.card.subject,
        corePoint: result.card.corePoint,
        confusionPoint: result.card.confusionPoint,
        example: result.card.example,
        difficulty: result.card.difficulty,
        tags: result.card.tags ? result.card.tags.split(',') : [],
        sketchPrompt: result.card.sketchPrompt
      },
      transaction: {
        spent: sharedCard.price,
        creatorEarned: result.creatorEarning,
        platformFee: Math.round((sharedCard.price - result.creatorEarning) * 100) / 100
      }
    });
  } catch (error) {
    console.error('购买卡片失败:', error);
    
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