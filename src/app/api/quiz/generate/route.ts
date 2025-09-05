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
    const { cardId, questionCount = 3 } = body;

    if (!cardId) {
      return NextResponse.json({ error: '请提供卡片ID' }, { status: 400 });
    }

    if (questionCount < 1 || questionCount > 10) {
      return NextResponse.json({ error: '题目数量应在1-10之间' }, { status: 400 });
    }

    // 获取卡片信息
    const card = await prisma.studyCard.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      return NextResponse.json({ error: '卡片不存在' }, { status: 404 });
    }

    // 构造卡片数据
    const cardData = {
      title: card.title,
      subject: card.subject,
      corePoint: card.corePoint,
      confusionPoint: card.confusionPoint,
      example: card.example,
      difficulty: card.difficulty,
      tags: card.tags ? card.tags.split(',') : []
    };

    // 使用AI生成测验题目
    const questions = await AIService.generateQuizQuestions(cardData, questionCount);

    // 保存题目到数据库
    const savedQuestions = await Promise.all(
      questions.map(async (question) => {
        const savedQuestion = await prisma.quizQuestion.create({
          data: {
            cardId,
            question: question.question,
            options: question.options ? question.options.join('|||') : null,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            questionType: question.questionType,
            createdBy: payload.userId
          }
        });

        return {
          id: savedQuestion.id,
          question: savedQuestion.question,
          options: savedQuestion.options ? savedQuestion.options.split('|||') : null,
          questionType: savedQuestion.questionType,
          // 不返回正确答案和解析，防止作弊
        };
      })
    );

    return NextResponse.json({
      success: true,
      quiz: {
        cardId,
        cardTitle: card.title,
        questions: savedQuestions
      }
    });
  } catch (error) {
    console.error('生成测验题目失败:', error);
    
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