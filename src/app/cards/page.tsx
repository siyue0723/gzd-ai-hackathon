'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { Input, Button, Loading } from '@/components/ui';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Target, 
  Brain, 
  Trash2,
  Calendar,
  TrendingUp,
  X,
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
  createdAt: string;
  learningProgress?: {
    reviewCount: number;
    correctCount: number;
    lastReviewAt?: string;
    nextReviewAt: string;
    status: 'NEW' | 'LEARNING' | 'REVIEW' | 'MASTERED';
  };
}

interface CardsResponse {
  cards: StudyCard[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCard, setSelectedCard] = useState<StudyCard | null>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);

  const subjects = [
    '数学', '物理', '化学', '生物', '语文', '英语', 
    '历史', '地理', '政治', '计算机', '经济学', '心理学', '其他'
  ];

  const statusOptions = [
    { value: 'NEW', label: '新建', color: 'text-blue-400' },
    { value: 'LEARNING', label: '学习中', color: 'text-yellow-400' },
    { value: 'REVIEW', label: '复习中', color: 'text-orange-400' },
    { value: 'MASTERED', label: '已掌握', color: 'text-green-400' }
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
        limit: '12'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/cards?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data: CardsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '获取卡片失败');
      }

      setCards(data.cards);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('获取卡片失败:', error);
      setError(error instanceof Error ? error.message : '获取卡片失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [currentPage, searchTerm, selectedSubject, selectedStatus]);

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('确定要删除这张卡片吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cards`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      // 重新获取卡片列表
      fetchCards();
    } catch (error) {
      console.error('删除卡片失败:', error);
      alert(error instanceof Error ? error.message : '删除卡片失败');
    }
  };

  const handleCardClick = (card: StudyCard) => {
    setSelectedCard(card);
    setShowCardDetail(true);
  };

  const closeCardDetail = () => {
    setShowCardDetail(false);
    setSelectedCard(null);
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

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {/* 页面标题和操作 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <BookOpen className="text-blue-400" />
              我的闪记卡片
            </h1>
            <p className="text-gray-300">
              共 {cards.length} 张卡片
            </p>
          </div>
          <Button
            onClick={() => router.push('/cards/create')}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            创建新卡片
          </Button>
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
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 学科筛选 */}
                  <div>
                    <label className="block text-white font-medium mb-2">学科</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">全部学科</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject} className="text-black">
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 状态筛选 */}
                  <div>
                    <label className="block text-white font-medium mb-2">学习状态</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">全部状态</option>
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value} className="text-black">
                          {status.label}
                        </option>
                      ))}
                    </select>
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
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              还没有卡片
            </h3>
            <p className="text-gray-500 mb-6">
              创建你的第一张闪记卡片开始学习吧！
            </p>
            <Button onClick={() => router.push('/cards/create')}>
              创建卡片
            </Button>
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
                <GlassCard 
                  className="p-6 h-full flex flex-col hover:scale-105 transition-transform cursor-pointer group"
                  onClick={() => handleCardClick(card)}
                >
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 rounded-lg text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

                  {/* 学习进度 */}
                  {card.learningProgress && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className={`text-sm font-medium ${
                            getStatusInfo(card.learningProgress.status).color
                          }`}>
                            {getStatusInfo(card.learningProgress.status).label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {card.learningProgress.reviewCount} 次复习
                        </span>
                      </div>
                      
                      {card.learningProgress.reviewCount > 0 && (
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (card.learningProgress.correctCount / card.learningProgress.reviewCount) * 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 卡片底部 */}
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(card.createdAt)}
                    </div>
                    {card.learningProgress?.nextReviewAt && (
                      <div>
                        下次复习: {formatDate(card.learningProgress.nextReviewAt)}
                      </div>
                    )}
                  </div>

                  {/* 标签 */}
                  {card.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
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
                  )}
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
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
              
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

      {/* 卡片详情模态框 */}
      <AnimatePresence>
        {showCardDetail && selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* 模态框头部 */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {selectedCard.title}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    {selectedCard.subject}
                  </span>
                  <span className={`px-3 py-1 bg-gray-500/20 rounded-full text-sm ${
                    getDifficultyColor(selectedCard.difficulty)
                  }`}>
                    {getDifficultyText(selectedCard.difficulty)}
                  </span>
                  {selectedCard.learningProgress && (
                    <span className={`px-3 py-1 bg-gray-500/20 rounded-full text-sm ${
                      getStatusInfo(selectedCard.learningProgress.status).color
                    }`}>
                      {getStatusInfo(selectedCard.learningProgress.status).label}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeCardDetail}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* 核心考点 */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-300">核心考点</h3>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-gray-200 leading-relaxed">
                  {selectedCard.corePoint}
                </p>
              </div>
            </div>

            {/* 易混淆点 */}
            {selectedCard.confusionPoint && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-yellow-300">易混淆点</h3>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-gray-200 leading-relaxed">
                    {selectedCard.confusionPoint}
                  </p>
                </div>
              </div>
            )}

            {/* 典型例题 */}
            {selectedCard.example && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-green-300">典型例题</h3>
                </div>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {selectedCard.example}
                  </p>
                </div>
              </div>
            )}

            {/* 记忆辅助 */}
            {selectedCard.sketchPrompt && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-semibold text-pink-300">记忆辅助</h3>
                </div>
                <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                  <p className="text-gray-200 leading-relaxed">
                    {selectedCard.sketchPrompt}
                  </p>
                </div>
              </div>
            )}

            {/* 学习进度 */}
            {selectedCard.learningProgress && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-300">学习进度</h3>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">复习次数:</span>
                      <span className="text-white ml-2">{selectedCard.learningProgress.reviewCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">正确次数:</span>
                      <span className="text-white ml-2">{selectedCard.learningProgress.correctCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">正确率:</span>
                      <span className="text-white ml-2">
                        {selectedCard.learningProgress.reviewCount > 0 
                          ? Math.round((selectedCard.learningProgress.correctCount / selectedCard.learningProgress.reviewCount) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">下次复习:</span>
                      <span className="text-white ml-2">
                        {formatDate(selectedCard.learningProgress.nextReviewAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 标签 */}
            {selectedCard.tags && selectedCard.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-3">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCard.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={() => {
                  closeCardDetail();
                  router.push('/study');
                }}
                className="flex-1"
              >
                开始学习
              </Button>
              <Button
                onClick={closeCardDetail}
                variant="outline"
                className="flex-1"
              >
                关闭
              </Button>
            </div>
          </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}