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
  correctAnswer: number;
  explanation?: string;
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
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  useEffect(() => {
    if (!cardId) {
      router.push('/cards');
    }
  }, [cardId, router]);

  const generateQuiz = async () => {
    if (!cardId) return;

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
          cardId,
          questionCount
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成测验失败');
      }

      setQuiz(data.quiz);
      setUserAnswers(new Array(data.quiz.questions.length).fill(-1));
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

  const submitQuiz = async (answers: number[]) => {
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
          quizId: quiz.id,
          answers,
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
                disabled={loading}
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
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={`w-full p-4 text-left rounded-lg border transition-all ${
                        selectedAnswer === index
                          ? 'bg-purple-500/20 border-purple-500 text-white'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedAnswer === index
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-400'
                        }`}>
                          {selectedAnswer === index && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="font-medium mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prev => prev - 1);
                        setSelectedAnswer(userAnswers[currentQuestionIndex - 1]);
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    上一题
                  </Button>
                  
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null || loading}
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