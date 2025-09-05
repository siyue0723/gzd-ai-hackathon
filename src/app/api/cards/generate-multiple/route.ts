import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json()
    const { input, subject } = body

    // 验证输入
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: '请提供有效的学习内容' }, { status: 400 })
    }

    if (input.length > 5000) {
      return NextResponse.json({ error: '内容过长，请控制在5000字符以内' }, { status: 400 })
    }

    // 使用AI服务批量生成多张卡片
    const cardsData = await AIService.generateMultipleCards(input, subject)

    if (!cardsData || cardsData.length === 0) {
      return NextResponse.json({ error: 'AI生成失败，请重试' }, { status: 500 })
    }

    // 为每张卡片生成草图提示并保存到数据库
    const savedCards = []
    
    for (const cardData of cardsData) {
      try {
        // 生成草图提示
        const sketchPrompt = await AIService.generateSketchPrompt(cardData.corePoint)
        
        // 保存卡片到数据库
        const savedCard = await prisma.studyCard.create({
          data: {
            title: cardData.title,
            subject: cardData.subject,
            corePoint: cardData.corePoint,
            confusionPoint: cardData.confusionPoint || null,
            example: cardData.example || null,
            difficulty: cardData.difficulty,
            tags: cardData.tags || [],
            sketchPrompt: sketchPrompt,
            userId: session.user.id,
          },
        })

        // 创建学习记录
        await prisma.learningRecord.create({
          data: {
            cardId: savedCard.id,
            userId: session.user.id,
            status: 'new',
            nextReviewAt: new Date(),
          },
        })

        savedCards.push(savedCard)
      } catch (error) {
        console.error('保存卡片失败:', error)
        // 继续处理其他卡片，不中断整个流程
      }
    }

    if (savedCards.length === 0) {
      return NextResponse.json({ error: '保存卡片失败，请重试' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cards: savedCards,
      message: `成功生成并保存了 ${savedCards.length} 张学习卡片`
    })

  } catch (error) {
    console.error('批量生成卡片失败:', error)
    return NextResponse.json(
      { error: 'AI服务暂时不可用，请稍后重试' },
      { status: 500 }
    )
  }
}