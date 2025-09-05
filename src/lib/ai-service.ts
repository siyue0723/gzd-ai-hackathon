import { OpenAI } from 'openai';

// 通义千问API配置
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || 'sk-04ff5aa716774dca9e0045177400cff8',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
});

// 考点卡片数据结构
export interface StudyCardData {
  title: string;
  subject: string;
  corePoint: string;
  confusionPoint?: string;
  example?: string;
  difficulty: number;
  tags: string[];
}

// 测验题目数据结构
export interface QuizQuestionData {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  questionType: 'choice' | 'fill' | 'judge';
}

// AI服务类
export class AIService {
  /**
   * 智能拆解考点并生成闪记卡片
   */
  static async generateStudyCard(input: string, subject?: string): Promise<StudyCardData> {
    try {
      const prompt = `
请将以下学习内容智能拆解为闪记卡片格式：

输入内容：${input}
学科：${subject || '未指定'}

请按照以下JSON格式返回：
{
  "title": "考点标题",
  "subject": "学科分类",
  "corePoint": "核心考点内容，要简洁明了",
  "confusionPoint": "易混淆的知识点或常见错误",
  "example": "典型例题或应用场景",
  "difficulty": 1-5的难度等级,
  "tags": ["标签1", "标签2"]
}

要求：
1. 核心考点要提炼关键信息，便于记忆
2. 易混点要指出容易搞错的地方
3. 例题要具有代表性
4. 难度等级要合理评估
5. 标签要有助于分类检索
`;

      const response = await client.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      // 提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应');
      }

      const cardData = JSON.parse(jsonMatch[0]) as StudyCardData;
      return cardData;
    } catch (error) {
      console.error('生成学习卡片失败:', error);
      throw new Error('AI服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 生成测验题目
   */
  static async generateQuizQuestions(
    cardData: StudyCardData,
    count: number = 3
  ): Promise<QuizQuestionData[]> {
    try {
      const prompt = `
基于以下考点内容，生成${count}道测验题目：

考点标题：${cardData.title}
核心内容：${cardData.corePoint}
易混点：${cardData.confusionPoint || '无'}
典型例题：${cardData.example || '无'}

请生成不同类型的题目（选择题、填空题、判断题），按照以下JSON格式返回：
[
  {
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"], // 仅选择题需要
    "correctAnswer": "正确答案",
    "explanation": "答案解析",
    "questionType": "choice" // choice/fill/judge
  }
]

要求：
1. 题目要紧扣考点核心内容
2. 选择题要有干扰项
3. 填空题要考查关键概念
4. 判断题要针对易混点
5. 解析要清晰明了
`;

      const response = await client.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      // 提取JSON内容
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应');
      }

      const questions = JSON.parse(jsonMatch[0]) as QuizQuestionData[];
      return questions;
    } catch (error) {
      console.error('生成测验题目失败:', error);
      throw new Error('AI服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 生成错题分析和迷你闪记卡
   */
  static async generateErrorAnalysis(
    question: string,
    userAnswer: string,
    correctAnswer: string,
    explanation?: string
  ): Promise<{ analysis: string; miniCard: string }> {
    try {
      const prompt = `
用户在以下题目中答错了，请提供错题分析和生成迷你闪记卡：

题目：${question}
用户答案：${userAnswer}
正确答案：${correctAnswer}
原解析：${explanation || '无'}

请按照以下JSON格式返回：
{
  "analysis": "详细的错题分析，包括错误原因和知识点溯源",
  "miniCard": "针对错误知识点的简化记忆卡片内容"
}

要求：
1. 分析要指出具体错误原因
2. 要追溯到相关知识点
3. 迷你卡片要简洁易记
4. 要有针对性的记忆技巧
`;

      const response = await client.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      // 提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应');
      }

      const result = JSON.parse(jsonMatch[0]) as { analysis: string; miniCard: string };
      return result;
    } catch (error) {
      console.error('生成错题分析失败:', error);
      throw new Error('AI服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 审核用户上传的卡片内容
   */
  static async reviewCardContent(cardData: StudyCardData): Promise<{
    approved: boolean;
    reason?: string;
    suggestions?: string[];
  }> {
    try {
      const prompt = `
请审核以下用户上传的学习卡片内容：

标题：${cardData.title}
学科：${cardData.subject}
核心考点：${cardData.corePoint}
易混点：${cardData.confusionPoint || '无'}
例题：${cardData.example || '无'}

请从以下方面审核：
1. 内容准确性
2. 是否包含不当信息
3. 格式是否规范
4. 教育价值

请按照以下JSON格式返回：
{
  "approved": true/false,
  "reason": "审核结果说明",
  "suggestions": ["改进建议1", "改进建议2"]
}
`;

      const response = await client.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      // 提取JSON内容
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应');
      }

      const result = JSON.parse(jsonMatch[0]) as {
        approved: boolean;
        reason?: string;
        suggestions?: string[];
      };
      return result;
    } catch (error) {
      console.error('审核卡片内容失败:', error);
      throw new Error('AI服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 生成简笔画提示词（用于后续图像生成）
   */
  static async generateSketchPrompt(corePoint: string): Promise<string> {
    try {
      const prompt = `
为以下考点内容生成简笔画描述，用于辅助记忆：

考点内容：${corePoint}

请生成一个简洁的简笔画场景描述，要求：
1. 能够直观表达考点核心概念
2. 适合简笔画风格
3. 有助于记忆联想
4. 描述要简洁明了

直接返回描述文本，不需要JSON格式。
`;

      const response = await client.chat.completions.create({
        model: 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('AI响应为空');
      }

      return content.trim();
    } catch (error) {
      console.error('生成简笔画提示词失败:', error);
      return '简单的图形示意图';
    }
  }
}

export default AIService;