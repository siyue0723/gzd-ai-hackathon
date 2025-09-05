'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { Button, Loading } from '@/components/ui';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Target,
  BookOpen,
  TrendingUp,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  questionType: 'choice' | 'fill' | 'judge';
}

interface Quiz {
  id: string;
  cardId: string;
  cardTitle: string;
  questions: QuizQuestion[];
  createdAt: string;
}

interface QuizResult {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  analysis?: string;
  miniCards?: Array<{
    title: string;
    content: string;
    tip: string;
  }>;
}

type QuizState = 'setup' | 'taking' | 'completed';

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get('cardId');
  
  const [state, setState] = useState<QuizState>('setup');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const [availableCards, setAvailableCards] = useState<Array<{id: string, title: string, subject: string}>>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  useEffect(() => {
    if (cardId) {
      setSelectedCardId(cardId);
    } else {
      // 加载可用的卡片列表
      loadAvailableCards();
    }
  }, [cardId]);

  const loadAvailableCards = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableCards(data.cards || []);
      }
    } catch (error) {
      console.error('加载卡片列表失败:', error);
    }
  };

  const generateQuiz = async () => {
    const targetCardId = selectedCardId || cardId;
    if (!targetCardId) {
      setError('请选择一个学习卡片');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: targetCardId,
          questionCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成测验失败');
      }

      setQuiz(data.quiz);
      setUserAnswers(new Array(data.quiz.questions.length).fill(''));
      setStartTime(Date.now());
      setState('taking');
    } catch (error) {
      console.error('生成测验失败:', error);
      setError(error instanceof Error ? error.message : '生成测验失败');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || !quiz) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (answers: string[]) => {
    if (!quiz) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: answers.map((answer, index) => ({
            questionId: quiz.questions[index].id,
            userAnswer: answer
          })),
          timeSpent
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交测验失败');
      }

      setResult(data.result);
      setState('completed');
    } catch (error) {
      console.error('提交测验失败:', error);
      setError(error instanceof Error ? error.message : '提交测验失败');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return '优秀';
    if (score >= 70) return '良好';
    if (score >= 60) return '及格';
    return '需要加强';
  };

  // 设置页面
  if (state === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Brain className="text-purple-400" />
              AI 智能测验
            </h1>
            <p className="text-gray-300 text-lg">
              基于学习卡片生成个性化测验题目
            </p>
          </motion.div>

          <GlassCard className="p-8">
            <div className="space-y-6">
              {!cardId && (
                <div>
                  <label className="block text-white font-medium mb-3">
                    选择学习卡片
                  </label>
                  {availableCards.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {availableCards.map(card => (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`w-full p-3 rounded-lg text-left transition-all ${
                            selectedCardId === card.id
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-gray-300 hover:bg-white/20'
                          }`}
                        >
                          <div className="font-medium">{card.title}</div>
                          <div className="text-sm opacity-75">{card.subject}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-300">
                      暂无可用的学习卡片，请先创建一些卡片
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-3">
                  选择题目数量
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[3, 5, 8, 10].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        questionCount === count
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {count} 题
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300"
                >
                  {error}
                </motion.div>
              )}

              <Button
                onClick={generateQuiz}
                disabled={loading || (!cardId && !selectedCardId)}
                className="w-full py-4 text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loading size="sm" />
                    AI 正在生成题目...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-5 h-5" />
                    开始测验
                  </div>
                )}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  // 测验进行中
  if (state === 'taking' && quiz && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          {/* 进度显示 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold text-white mb-2">
              {quiz.cardTitle} - 测验
            </h1>
            <div className="flex items-center justify-center gap-4 text-gray-300 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>第 {currentQuestionIndex + 1} / {quiz.questions.length} 题</span>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="w-full max-w-md mx-auto">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* 当前题目 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    {currentQuestion.question}
                  </h2>
                </div>

                <div className="space-y-3 mb-6">
                  {/* 选择题显示选项 */}
                  {currentQuestion.questionType === 'choice' && currentQuestion.options && currentQuestion.options.length > 0 ? (
                    currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full p-4 text-left rounded-lg border transition-all ${
                          selectedAnswer === option
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswer === option
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedAnswer === option && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        <span className="font-medium mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))
                ) : currentQuestion.questionType === 'fill' ? (
                  /* 填空题输入框 */
                  <div className="w-full">
                    <input
                      type="text"
                      value={selectedAnswer || ''}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      placeholder="请输入答案..."
                      className="w-full p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                ) : currentQuestion.questionType === 'judge' ? (
                  /* 判断题选项 */
                  <div className="flex gap-4">
                    {['正确', '错误'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelectedAnswer(option)}
                        className={`flex-1 p-4 rounded-lg border transition-all ${
                          selectedAnswer === option
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswer === option
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedAnswer === option && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* 无选项的情况 */
                  <div className="text-center py-8">
                    <p className="text-gray-400">题目格式错误，请联系管理员</p>
                  </div>
                )}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prev => prev - 1);
                        setSelectedAnswer(userAnswers[currentQuestionIndex - 1] || null);
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    上一题
                  </Button>
                  
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null || selectedAnswer === '' || loading}
                  >
                    {loading ? (
                      <Loading size="sm" />
                    ) : currentQuestionIndex === quiz.questions.length - 1 ? (
                      '提交测验'
                    ) : (
                      '下一题'
                    )}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // 测验完成
  if (state === 'completed' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              测验完成！
            </h1>
          </motion.div>

          {/* 成绩概览 */}
          <GlassCard className="p-8 mb-6">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className={`text-4xl font-bold mb-2 ${
                  getScoreColor(result.score)
                }`}>
                  {result.score}分
                </div>
                <div className="text-gray-400">总分</div>
                <div className={`text-sm font-medium ${
                  getScoreColor(result.score)
                }`}>
                  {getScoreGrade(result.score)}
                </div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {result.correctAnswers}
                </div>
                <div className="text-gray-400">正确题数</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  {result.totalQuestions}
                </div>
                <div className="text-gray-400">总题数</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400">用时</div>
              </div>
            </div>
          </GlassCard>

          {/* 题目详情 */}
          <GlassCard className="p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">答题详情</h2>
            </div>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      isCorrect 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        isCorrect 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-400">
                            第 {index + 1} 题
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            question.questionType === 'choice' ? 'bg-blue-500/20 text-blue-300' :
                            question.questionType === 'fill' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {question.questionType === 'choice' ? '选择题' :
                             question.questionType === 'fill' ? '填空题' : '判断题'}
                          </span>
                        </div>
                        <h3 className="text-white font-medium mb-3">
                          {question.question}
                        </h3>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">你的答案:</span>
                            <span className={`text-sm font-medium ${
                              isCorrect ? 'text-green-300' : 'text-red-300'
                            }`}>
                              {userAnswer || '未作答'}
                            </span>
                          </div>
                          
                          {!isCorrect && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">正确答案:</span>
                              <span className="text-sm font-medium text-green-300">
                                {question.correctAnswer}
                              </span>
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium text-blue-300">解析</span>
                              </div>
                              <p className="text-sm text-gray-200 leading-relaxed">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>

          {/* AI 分析 */}
          {result.analysis && (
            <GlassCard className="p-8 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">AI 学习分析</h2>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {result.analysis}
                </p>
              </div>
            </GlassCard>
          )}

          {/* 错题强化卡片 */}
          {result.miniCards && result.miniCards.length > 0 && (
            <GlassCard className="p-8 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-semibold text-white">错题强化卡片</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {result.miniCards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                  >
                    <h3 className="font-semibold text-yellow-300 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-gray-200 text-sm mb-3 leading-relaxed">
                      {card.content}
                    </p>
                    <div className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-green-300 text-sm">
                        {card.tip}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setState('setup');
                setCurrentQuestionIndex(0);
                setUserAnswers([]);
                 setSelectedAnswer(null);
                 setSelectedCardId('');
                setResult(null);
                setError('');
              }}
              variant="outline"
              className="flex-1"
            >
              重新测验
            </Button>
            <Button
              onClick={() => router.push('/cards')}
              className="flex-1"
            >
              返回卡片
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <Loading size="lg" />
    </div>
  );
}