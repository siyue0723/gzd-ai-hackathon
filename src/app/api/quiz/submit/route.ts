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
    const { answers, timeSpent = 0 } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: '请提供答案数据' }, { status: 400 });
    }

    // 验证答案格式
    for (const answer of answers) {
      if (!answer.questionId || answer.userAnswer === undefined) {
        return NextResponse.json({ error: '答案格式不正确' }, { status: 400 });
      }
    }

    // 获取题目信息
    const questionIds = answers.map(a => a.questionId);
    const questions = await prisma.quizQuestion.findMany({
      where: {
        id: { in: questionIds }
      },
      include: {
        card: true
      }
    });

    if (questions.length !== answers.length) {
      return NextResponse.json({ error: '部分题目不存在' }, { status: 404 });
    }

    // 批改答案
    const results = [];
    const wrongAnswers = [];
    let correctCount = 0;
    let totalScore = 0;

    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = answer.userAnswer.toString().toLowerCase().trim() === 
                       question.correctAnswer.toLowerCase().trim();
      
      if (isCorrect) {
        correctCount++;
        totalScore += 10; // 每题10分
      } else {
        wrongAnswers.push({
          question: question.question,
          userAnswer: answer.userAnswer,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          cardId: question.cardId
        });
      }

      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer: answer.userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      });
    }

    const accuracy = Math.round((correctCount / answers.length) * 100);
    const cardId = questions[0].cardId;

    // 保存测验结果
    const quizResult = await prisma.quizResult.create({
      data: {
        userId: payload.userId,
        cardId,
        totalQuestions: answers.length,
        correctAnswers: correctCount,
        score: totalScore,
        timeSpent,
        completedAt: new Date()
      }
    });

    // 为错题生成AI分析和迷你卡片
    const errorAnalyses = [];
    for (const wrongAnswer of wrongAnswers) {
      try {
        const analysis = await AIService.generateErrorAnalysis(
          wrongAnswer.question,
          wrongAnswer.userAnswer.toString(),
          wrongAnswer.correctAnswer,
          wrongAnswer.explanation
        );
        
        errorAnalyses.push({
          ...wrongAnswer,
          aiAnalysis: analysis.analysis,
          miniCard: analysis.miniCard
        });
      } catch (error) {
        console.error('生成错题分析失败:', error);
        errorAnalyses.push({
          ...wrongAnswer,
          aiAnalysis: '暂时无法生成AI分析',
          miniCard: '请重点复习相关知识点'
        });
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        id: quizResult.id,
        totalQuestions: answers.length,
        correctAnswers: correctCount,
        accuracy,
        score: totalScore,
        timeSpent,
        results,
        errorAnalyses,
        completedAt: quizResult.completedAt
      }
    });
  } catch (error) {
    console.error('提交测验答案失败:', error);
    
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