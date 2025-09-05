'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { Button, Loading } from '@/components/ui';
import { 
  Brain, 
  Target, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  TrendingUp,
  Clock,
  BookOpen,
  Lightbulb
} from 'lucide-react';

interface StudyCard {
  id: string;
  title: string;
  subject: string;
  corePoint: string;
  confusionPoint?: string;
  example?: string;
  difficulty: number;
  tags: string[];
  sketchPrompt: string;
  learningProgress: {
    reviewCount: number;
    correctCount: number;
    lastReviewAt?: string;
    nextReviewAt: string;
    status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
  };
}

interface StudyStats {
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  averageAccuracy: number;
  studyStreak: number;
}

type ReviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'FORGOT';

export default function StudyPage() {
  const router = useRouter();
  const [dueCards, setDueCards] = useState<StudyCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [error, setError] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentCard = dueCards[currentCardIndex];

  const fetchDueCards = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/study/review', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取复习卡片失败');
      }

      setDueCards(data.dueCards || []);
      setStats(data.stats);
      
      if (!data.dueCards || data.dueCards.length === 0) {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('获取复习卡片失败:', error);
      setError(error instanceof Error ? error.message : '获取复习卡片失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueCards();
  }, []);

  const handleReview = async (difficulty: ReviewDifficulty, correct: boolean) => {
    if (!currentCard || submitting) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/study/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: currentCard.id,
          difficulty,
          correct
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交复习结果失败');
      }

      // 移动到下一张卡片
      setReviewedCount(prev => prev + 1);
      
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('提交复习结果失败:', error);
      setError(error instanceof Error ? error.message : '提交复习结果失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-400';
    if (difficulty <= 3) return 'text-yellow-400';
    if (difficulty <= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 2) return '简单';
    if (difficulty <= 3) return '中等';
    if (difficulty <= 4) return '困难';
    return '极难';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'text-blue-400';
      case 'LEARNING': return 'text-yellow-400';
      case 'REVIEW': return 'text-orange-400';
      case 'MASTERED': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return '新建';
      case 'LEARNING': return '学习中';
      case 'REVIEW': return '复习中';
      case 'MASTERED': return '已掌握';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <GlassCard className="p-8">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">
                  {reviewedCount > 0 ? '复习完成！' : '暂无需要复习的卡片'}
                </h1>
                <p className="text-gray-300">
                  {reviewedCount > 0 
                    ? `今天已完成 ${reviewedCount} 张卡片的复习`
                    : '所有卡片都在计划中，继续保持！'
                  }
                </p>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {stats.totalCards}
                    </div>
                    <div className="text-sm text-gray-400">总卡片数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {stats.masteredCards}
                    </div>
                    <div className="text-sm text-gray-400">已掌握</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(stats.averageAccuracy * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">平均正确率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {stats.studyStreak}
                    </div>
                    <div className="text-sm text-gray-400">连续学习天数</div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => router.push('/cards/create')}
                  className="flex-1"
                >
                  创建新卡片
                </Button>
                <Button
                  onClick={() => router.push('/cards')}
                  variant="outline"
                  className="flex-1"
                >
                  查看所有卡片
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        {/* 页面标题和进度 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Brain className="text-purple-400" />
            智能复习
          </h1>
          <div className="flex items-center justify-center gap-6 text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>第 {currentCardIndex + 1} / {dueCards.length} 张</span>
            </div>
            {stats && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>今日待复习: {stats.dueCards} 张</span>
              </div>
            )}
          </div>
          
          {/* 进度条 */}
          <div className="w-full max-w-md mx-auto mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentCardIndex + (showAnswer ? 0.5 : 0)) / dueCards.length) * 100}%`
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* 当前卡片 */}
        {currentCard && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-8 mb-6">
                {/* 卡片头部信息 */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {currentCard.title}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {currentCard.subject}
                      </span>
                      <span className={`px-3 py-1 bg-gray-500/20 rounded-full text-sm ${
                        getDifficultyColor(currentCard.difficulty)
                      }`}>
                        {getDifficultyText(currentCard.difficulty)}
                      </span>
                      <span className={`px-3 py-1 bg-gray-500/20 rounded-full text-sm ${
                        getStatusColor(currentCard.learningProgress.status)
                      }`}>
                        {getStatusText(currentCard.learningProgress.status)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    <div>复习次数: {currentCard.learningProgress.reviewCount}</div>
                    <div>正确率: {currentCard.learningProgress.reviewCount > 0 
                      ? Math.round((currentCard.learningProgress.correctCount / currentCard.learningProgress.reviewCount) * 100)
                      : 0}%
                    </div>
                  </div>
                </div>

                {/* 问题部分 - 始终显示 */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-semibold text-purple-300">核心考点</h3>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-gray-200 leading-relaxed">
                      {currentCard.corePoint}
                    </p>
                  </div>
                </div>

                {/* 答案部分 - 点击显示后才出现 */}
                <AnimatePresence>
                  {showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      {/* 易混点 */}
                      {currentCard.confusionPoint && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-lg font-semibold text-yellow-300">易混淆点</h3>
                          </div>
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-gray-200 leading-relaxed">
                              {currentCard.confusionPoint}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 典型例题 */}
                      {currentCard.example && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-5 h-5 text-green-400" />
                            <h3 className="text-lg font-semibold text-green-300">典型例题</h3>
                          </div>
                          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                              {currentCard.example}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 记忆辅助 */}
                      {currentCard.sketchPrompt && (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-pink-400" />
                            <h3 className="text-lg font-semibold text-pink-300">记忆辅助</h3>
                          </div>
                          <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                            <p className="text-gray-200 leading-relaxed">
                              {currentCard.sketchPrompt}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 操作按钮 */}
                <div className="mt-8">
                  {!showAnswer ? (
                    <Button
                      onClick={() => setShowAnswer(true)}
                      className="w-full py-4 text-lg"
                    >
                      显示答案
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-center text-gray-300 mb-4">
                        你掌握这个知识点的程度如何？
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                          onClick={() => handleReview('FORGOT', false)}
                          disabled={submitting}
                          className="flex flex-col items-center gap-2 py-4 bg-red-500/20 hover:bg-red-500/30 border-red-500/30"
                        >
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm">完全忘记</span>
                        </Button>
                        <Button
                          onClick={() => handleReview('HARD', false)}
                          disabled={submitting}
                          className="flex flex-col items-center gap-2 py-4 bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/30"
                        >
                          <RotateCcw className="w-5 h-5" />
                          <span className="text-sm">有些困难</span>
                        </Button>
                        <Button
                          onClick={() => handleReview('MEDIUM', true)}
                          disabled={submitting}
                          className="flex flex-col items-center gap-2 py-4 bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30"
                        >
                          <Clock className="w-5 h-5" />
                          <span className="text-sm">一般掌握</span>
                        </Button>
                        <Button
                          onClick={() => handleReview('EASY', true)}
                          disabled={submitting}
                          className="flex flex-col items-center gap-2 py-4 bg-green-500/20 hover:bg-green-500/30 border-green-500/30"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">完全掌握</span>
                        </Button>
                      </div>
                      
                      {submitting && (
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                          <Loading size="sm" />
                          正在记录学习进度...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}