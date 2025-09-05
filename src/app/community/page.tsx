'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { Input, Button, Loading } from '@/components/ui';
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  Download, 
  Coins,
  Target,
  Brain,
  BookOpen,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';

interface SharedCard {
  id: string;
  title: string;
  subject: string;
  corePoint: string;
  confusionPoint?: string;
  example?: string;
  difficulty: number;
  tags: string[];
  price: number;
  purchaseCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  isPurchased?: boolean;
}

interface CommunityResponse {
  cards: SharedCard[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CommunityPage() {
  const router = useRouter();
  const [cards, setCards] = useState<SharedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  const subjects = [
    '数学', '物理', '化学', '生物', '语文', '英语', 
    '历史', '地理', '政治', '计算机', '经济学', '心理学', '其他'
  ];

  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'rating', label: '评分最高' },
    { value: 'price_low', label: '价格从低到高' },
    { value: 'price_high', label: '价格从高到低' }
  ];

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject) params.append('subject', selectedSubject);

      const response = await fetch(`/api/community/share?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: CommunityResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取社区卡片失败');
      }

      setCards(data.cards);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('获取社区卡片失败:', error);
      setError(error instanceof Error ? error.message : '获取社区卡片失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCoins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.user) {
        setUserCoins(data.user.coins || 0);
      }
    } catch (error) {
      console.error('获取用户代币失败:', error);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchUserCoins();
  }, [currentPage, searchTerm, selectedSubject, sortBy]);

  const handlePurchase = async (cardId: string, price: number) => {
    if (userCoins < price) {
      alert('代币不足，无法购买此卡片');
      return;
    }

    if (!confirm(`确定要花费 ${price} 代币购买这张卡片吗？`)) {
      return;
    }

    setPurchasing(cardId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/community/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '购买失败');
      }

      // 更新用户代币
      setUserCoins(prev => prev - price);
      
      // 更新卡片状态
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, isPurchased: true, purchaseCount: card.purchaseCount + 1 }
          : card
      ));

      alert('购买成功！卡片已添加到你的学习库中。');
    } catch (error) {
      console.error('购买失败:', error);
      alert(error instanceof Error ? error.message : '购买失败');
    } finally {
      setPurchasing(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-400'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto pt-20">
        {/* 页面标题和用户代币 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="text-blue-400" />
              考点社区
            </h1>
            <p className="text-gray-300">
              发现和分享优质学习卡片
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-medium">{userCoins} 代币</span>
            </div>
            <Button
              onClick={() => router.push('/cards')}
              variant="outline"
            >
              我的卡片
            </Button>
          </div>
        </motion.div>

        {/* 搜索和筛选 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="搜索卡片标题或内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* 排序选择 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value} className="text-black">
                    {option.label}
                  </option>
                ))}
              </select>
              
              {/* 筛选按钮 */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                筛选
              </Button>
            </div>

            {/* 筛选选项 */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/10"
              >
                <div>
                  <label className="block text-white font-medium mb-2">学科</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    <button
                      onClick={() => setSelectedSubject('')}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        selectedSubject === ''
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      全部
                    </button>
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          selectedSubject === subject
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* 卡片网格 */}
        {cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              暂无社区卡片
            </h3>
            <p className="text-gray-500">
              成为第一个分享优质学习卡片的用户吧！
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-6 h-full flex flex-col hover:scale-105 transition-transform">
                  {/* 卡片头部 */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                        {card.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                          {card.subject}
                        </span>
                        <span className={`px-2 py-1 bg-gray-500/20 rounded text-sm ${
                          getDifficultyColor(card.difficulty)
                        }`}>
                          {getDifficultyText(card.difficulty)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 font-medium">{card.price}</span>
                      </div>
                      {card.isPurchased && (
                        <span className="text-xs text-green-400">已购买</span>
                      )}
                    </div>
                  </div>

                  {/* 创作者信息 */}
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">{card.creator.username}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400 text-xs">{formatDate(card.createdAt)}</span>
                    </div>
                  </div>

                  {/* 核心考点预览 */}
                  <div className="flex-1 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">核心考点</span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {card.corePoint}
                    </p>
                  </div>

                  {/* 评分和统计 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {renderStars(card.rating)}
                        <span className="text-sm text-gray-400 ml-1">
                          ({card.ratingCount})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <Download className="w-4 h-4" />
                        <span>{card.purchaseCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* 标签 */}
                  {card.tags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {card.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {card.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs">
                            +{card.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 购买按钮 */}
                  <Button
                    onClick={() => handlePurchase(card.id, card.price)}
                    disabled={card.isPurchased || purchasing === card.id || userCoins < card.price}
                    className="w-full"
                    variant={card.isPurchased ? 'outline' : 'default'}
                  >
                    {purchasing === card.id ? (
                      <div className="flex items-center gap-2">
                        <Loading size="sm" />
                        购买中...
                      </div>
                    ) : card.isPurchased ? (
                      '已购买'
                    ) : userCoins < card.price ? (
                      '代币不足'
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="w-4 h-4" />
                        购买 ({card.price} 代币)
                      </div>
                    )}
                  </Button>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                上一页
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              })}
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                下一页
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}