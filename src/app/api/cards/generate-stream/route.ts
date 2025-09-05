import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { OpenAI } from 'openai';

// 通义千问API配置
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || 'sk-04ff5aa716774dca9e0045177400cff8',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

interface StudyCard {
  title: string;
  subject: string;
  corePoint: string;
  confusionPoint?: string;
  example?: string;
  difficulty: number;
  tags: string[];
  sketchPrompt: string;
}

// 分析内容复杂度，决定生成卡片数量
function analyzeContentComplexity(content: string): number {
  const length = content.length;
  const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0).length;
  const keywords = content.match(/[一-龥]{2,}/g)?.length || 0;
  
  // 基于内容长度、句子数量和关键词数量决定卡片数量
  if (length < 200 && sentences < 5) return 1;
  if (length < 500 && sentences < 10) return 2;
  if (length < 1000 && sentences < 20) return Math.min(3, Math.ceil(keywords / 10));
  if (length < 2000) return Math.min(4, Math.ceil(keywords / 8));
  return Math.min(5, Math.ceil(keywords / 6));
}

// 生成单张卡片
async function generateSingleCard(content: string, subject: string, cardIndex: number, totalCards: number): Promise<StudyCard> {
  const prompt = `请基于以下学习内容生成第${cardIndex + 1}张学习卡片（共${totalCards}张）：

${content}

要求：
1. 提取不同的核心考点，避免与其他卡片重复
2. 如果是第${cardIndex + 1}张卡片，请聚焦于内容的第${cardIndex + 1}个重要方面
3. 生成简洁明了的标题
4. 核心考点要具体且实用
5. 易混淆点要针对性强
6. 例题要典型且有代表性
7. 标签要准确反映内容特点
8. 简笔画提示要生动有趣
9. 难度评分1-5分（1最简单，5最难）

请以JSON格式返回，包含以下字段：
{
  "title": "卡片标题",
  "subject": "${subject}",
  "corePoint": "核心考点内容",
  "confusionPoint": "易混淆点（可选）",
  "example": "典型例题（可选）",
  "difficulty": 难度数字,
  "tags": ["标签1", "标签2"],
  "sketchPrompt": "简笔画记忆提示"
}`;

  const response = await openai.chat.completions.create({
    model: 'qwen-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  const content_text = response.choices[0]?.message?.content;
  if (!content_text) {
    throw new Error('AI生成内容为空');
  }

  try {
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析AI返回的JSON格式');
    }
    
    const cardData = JSON.parse(jsonMatch[0]);
    return {
      title: cardData.title || '学习卡片',
      subject: cardData.subject || subject,
      corePoint: cardData.corePoint || '',
      confusionPoint: cardData.confusionPoint || undefined,
      example: cardData.example || undefined,
      difficulty: Math.max(1, Math.min(5, cardData.difficulty || 3)),
      tags: Array.isArray(cardData.tags) ? cardData.tags : [],
      sketchPrompt: cardData.sketchPrompt || ''
    };
  } catch (error) {
    console.error('解析AI返回内容失败:', error);
    throw new Error('AI返回内容格式错误');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return new Response('Invalid token', { status: 401 });
    }

    const { input, subject } = await request.json();
    
    if (!input || input.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: '请提供学习内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 分析内容复杂度，决定生成数量
    const targetCardCount = analyzeContentComplexity(input.trim());
    
    // 设置SSE响应头
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始信息
          const startData = {
            type: 'start',
            message: 'AI正在分析内容复杂度...',
            totalCards: targetCardCount
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(startData)}\n\n`));

          const generatedCards: any[] = [];
          
          // 逐张生成卡片
          for (let i = 0; i < targetCardCount; i++) {
            // 发送生成进度
            const progressData = {
              type: 'progress',
              message: `正在生成第 ${i + 1} 张卡片...`,
              currentCard: i + 1,
              totalCards: targetCardCount
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(progressData)}\n\n`));

            // 生成卡片
            const cardData = await generateSingleCard(input.trim(), subject || '', i, targetCardCount);
            
            // 保存到数据库
            const savedCard = await prisma.studyCard.create({
              data: {
                ...cardData,
                tags: cardData.tags.join(','), // 将数组转换为逗号分隔的字符串
                userId: decoded.userId,
              },
            });

            // 创建学习记录
            await prisma.learningRecord.create({
              data: {
                userId: decoded.userId,
                cardId: savedCard.id,
                viewCount: 0,
                correctCount: 0,
                wrongCount: 0,
                lastViewedAt: new Date(),
                nextReviewAt: new Date(Date.now() + 60 * 60 * 1000), // 1小时后复习
                masteryLevel: 0
              }
            });

            generatedCards.push(savedCard);

            // 发送新生成的卡片
            const cardData_response = {
              type: 'card',
              card: savedCard,
              currentCard: i + 1,
              totalCards: targetCardCount
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(cardData_response)}\n\n`));
          }

          // 发送完成信息
          const completeData = {
            type: 'complete',
            message: `AI智能生成并保存了 ${generatedCards.length} 张学习卡片！`,
            cards: generatedCards,
            totalCards: generatedCards.length
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeData)}\n\n`));
          
        } catch (error) {
          console.error('流式生成错误:', error);
          const errorData = {
            type: 'error',
            message: error instanceof Error ? error.message : '生成卡片失败'
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('API错误:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}