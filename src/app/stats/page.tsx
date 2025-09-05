'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { Loading } from '@/components/ui';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Brain, 
  Clock, 
  Calendar,
  Coins,
  Users,
  BookOpen,
  Award,
  Activity,
  PieChart,
  Star,
  Download,
  Upload
} from 'lucide-react';

interface UserStats {
  user: {
    id: string;
    username: string;
    email: string;
    coins: number;
    createdAt: string;
  };
  learningProgress: {
    totalCards: number;
    dueCards: number;
    masteredCards: number;
    learningCards: number;
    newCards: number;
    studyStreak: number;
    totalStudyTime: number;
    averageAccuracy: number;
  };
  quizStats: {
    totalQuizzes: number;
    totalQuestions: number;
    correctAnswers: number;
    averageScore: number;
    bestScore: number;
    recentQuizzes: Array<{
      id: string;
      score: number;
      totalQuestions: number;
      createdAt: string;
    }>;
  };
  recentActivity: Array<{
    type: 'study' | 'quiz' | 'card_created' | 'card_shared' | 'card_purchased';
    description: string;
    createdAt: string;
  }>;
  sharedCards: {
    totalShared: number;
    totalEarnings: number;
    totalPurchases: number;
    popularCards: Array<{
      id: string;
      title: string;
      purchaseCount: number;
      earnings: number;
    }>;
  };
  purchases: {
    totalPurchased: number;
    totalSpent: number;
    recentPurchases: Array<{
      id: string;
      cardTitle: string;
      price: number;
      createdAt: string;
    }>;
  };
  subjectDistribution: Array<{
    subject: string;
    count: number;
    percentage: number;
  }>;
}

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取统计数据失败');
      }

      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setError(error instanceof Error ? error.message : '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'study': return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'quiz': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'card_created': return <Target className="w-4 h-4 text-green-400" />;
      case 'card_shared': return <Upload className="w-4 h-4 text-yellow-400" />;
      case 'card_purchased': return <Download className="w-4 h-4 text-orange-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSubjectColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="text-red-400 mb-4">{error || '无法加载统计数据'}</div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto pt-20">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="text-blue-400" />
            学习统计
          </h1>
          <p className="text-gray-300">
            查看你的学习进度和成就
          </p>
        </motion.div>

        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {stats.user.username}
                </h2>
                <p className="text-gray-300">{stats.user.email}</p>
                <p className="text-gray-400 text-sm">
                  加入时间: {formatDate(stats.user.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-medium text-lg">
                  {stats.user.coins} 代币
                </span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* 核心统计数据 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <GlassCard className="p-6 text-center">
            <Target className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">
              {stats.learningProgress.totalCards}
            </div>
            <div className="text-gray-300 text-sm">总卡片数</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">
              {stats.quizStats.totalQuizzes}
            </div>
            <div className="text-gray-300 text-sm">完成测验</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">
              {stats.learningProgress.studyStreak}
            </div>
            <div className="text-gray-300 text-sm">连续学习天数</div>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <Clock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(stats.learningProgress.totalStudyTime)}
            </div>
            <div className="text-gray-300 text-sm">总学习时间</div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* 学习进度 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="text-blue-400" />
                学习进度
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">待复习</span>
                  <span className="text-red-400 font-medium">
                    {stats.learningProgress.dueCards}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">已掌握</span>
                  <span className="text-green-400 font-medium">
                    {stats.learningProgress.masteredCards}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">学习中</span>
                  <span className="text-yellow-400 font-medium">
                    {stats.learningProgress.learningCards}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">新卡片</span>
                  <span className="text-blue-400 font-medium">
                    {stats.learningProgress.newCards}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">平均准确率</span>
                    <span className="text-purple-400 font-medium">
                      {stats.learningProgress.averageAccuracy.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* 测验统计 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="text-purple-400" />
                测验成绩
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">总题目数</span>
                  <span className="text-blue-400 font-medium">
                    {stats.quizStats.totalQuestions}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">正确答题</span>
                  <span className="text-green-400 font-medium">
                    {stats.quizStats.correctAnswers}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">平均分数</span>
                  <span className="text-yellow-400 font-medium">
                    {stats.quizStats.averageScore.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">最高分数</span>
                  <span className="text-purple-400 font-medium">
                    {stats.quizStats.bestScore.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {stats.quizStats.recentQuizzes.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">最近测验</h4>
                  <div className="space-y-2">
                    {stats.quizStats.recentQuizzes.slice(0, 3).map((quiz, index) => (
                      <div key={quiz.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">
                          {formatDate(quiz.createdAt)}
                        </span>
                        <span className="text-white">
                          {quiz.score}/{quiz.totalQuestions}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* 分享统计 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="text-yellow-400" />
                分享收益
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">分享卡片</span>
                  <span className="text-blue-400 font-medium">
                    {stats.sharedCards.totalShared}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">总收益</span>
                  <span className="text-yellow-400 font-medium">
                    {stats.sharedCards.totalEarnings} 代币
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">被购买次数</span>
                  <span className="text-green-400 font-medium">
                    {stats.sharedCards.totalPurchases}
                  </span>
                </div>
              </div>
              
              {stats.sharedCards.popularCards.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">热门卡片</h4>
                  <div className="space-y-2">
                    {stats.sharedCards.popularCards.slice(0, 3).map((card, index) => (
                      <div key={card.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 truncate flex-1 mr-2">
                          {card.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">{card.purchaseCount}次</span>
                          <span className="text-yellow-400">{card.earnings}币</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* 购买统计 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="text-orange-400" />
                购买记录
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">购买卡片</span>
                  <span className="text-blue-400 font-medium">
                    {stats.purchases.totalPurchased}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">总支出</span>
                  <span className="text-red-400 font-medium">
                    {stats.purchases.totalSpent} 代币
                  </span>
                </div>
              </div>
              
              {stats.purchases.recentPurchases.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">最近购买</h4>
                  <div className="space-y-2">
                    {stats.purchases.recentPurchases.slice(0, 3).map((purchase, index) => (
                      <div key={purchase.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 truncate flex-1 mr-2">
                          {purchase.cardTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400">{purchase.price}币</span>
                          <span className="text-gray-500">
                            {formatDate(purchase.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* 学科分布 */}
        {stats.subjectDistribution.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart className="text-green-400" />
                学科分布
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.subjectDistribution.map((subject, index) => (
                  <div key={subject.subject} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${getSubjectColor(index)}`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">{subject.subject}</span>
                        <span className="text-white text-sm font-medium">
                          {subject.count}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {subject.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* 最近活动 */}
        {stats.recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="text-blue-400" />
                最近活动
              </h3>
              
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-gray-300 text-sm">{activity.description}</p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}