'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { Input, Button, Loading } from '@/components/ui';
import { BookOpen, Sparkles, Brain, Target } from 'lucide-react';

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
}

export default function CreateCardPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    input: '',
    subject: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<StudyCard | null>(null);
  const [error, setError] = useState('');

  const subjects = [
    '数学', '物理', '化学', '生物', '语文', '英语', 
    '历史', '地理', '政治', '计算机', '经济学', '心理学', '其他'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.input.trim()) {
      setError('请输入学习内容');
      return;
    }

    if (formData.input.length > 5000) {
      setError('输入内容过长，请控制在5000字符以内');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedCard(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/cards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '生成卡片失败');
      }

      setGeneratedCard(data.card);
    } catch (error) {
      console.error('生成卡片失败:', error);
      setError(error instanceof Error ? error.message : '生成卡片失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setGeneratedCard(null);
    setFormData({ input: '', subject: '' });
    setError('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto pt-20">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-400" />
            AI 考点闪记卡生成
          </h1>
          <p className="text-gray-300 text-lg">
            输入学习内容，AI 将自动拆解为核心考点、易混点和典型例题
          </p>
        </motion.div>

        {!generatedCard ? (
          /* 输入表单 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 学科选择 */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    选择学科（可选）
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {subjects.map((subject) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, subject }))}
                        className={`p-2 rounded-lg text-sm transition-all ${
                          formData.subject === subject
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 内容输入 */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    学习内容 *
                  </label>
                  <textarea
                    value={formData.input}
                    onChange={(e) => setFormData(prev => ({ ...prev, input: e.target.value }))}
                    placeholder="请输入要学习的内容，例如：\n\n• 高数 - 微积分基本定理\n• 教资 - 德育原则\n• 物理 - 牛顿第二定律\n\n也可以直接粘贴教材内容或课件文字..."
                    className="w-full h-40 p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    maxLength={5000}
                  />
                  <div className="text-right text-sm text-gray-400 mt-1">
                    {formData.input.length}/5000
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300"
                  >
                    {error}
                  </motion.div>
                )}

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.input.trim()}
                  className="w-full py-4 text-lg font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loading size="sm" />
                      AI 正在生成卡片...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Brain className="w-5 h-5" />
                      生成闪记卡片
                    </div>
                  )}
                </Button>
              </form>
            </GlassCard>
          </motion.div>
        ) : (
          /* 生成结果 */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* 卡片预览 */}
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="text-blue-400" />
                  {generatedCard.title}
                </h2>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                    {generatedCard.subject}
                  </span>
                  <span className={`px-3 py-1 bg-gray-500/20 rounded-full text-sm ${
                    getDifficultyColor(generatedCard.difficulty)
                  }`}>
                    {getDifficultyText(generatedCard.difficulty)}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* 核心考点 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    核心考点
                  </h3>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <p className="text-gray-200 leading-relaxed">
                      {generatedCard.corePoint}
                    </p>
                  </div>
                </div>

                {/* 易混点 */}
                {generatedCard.confusionPoint && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      易混淆点
                    </h3>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-gray-200 leading-relaxed">
                        {generatedCard.confusionPoint}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 典型例题 */}
              {generatedCard.example && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-green-300 mb-4">
                    典型例题
                  </h3>
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {generatedCard.example}
                    </p>
                  </div>
                </div>
              )}

              {/* 简笔画提示 */}
              {generatedCard.sketchPrompt && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-pink-300 mb-4">
                    记忆辅助图像
                  </h3>
                  <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                    <p className="text-gray-200 leading-relaxed">
                      {generatedCard.sketchPrompt}
                    </p>
                  </div>
                </div>
              )}

              {/* 标签 */}
              {generatedCard.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">
                    相关标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedCard.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateAnother}
                className="flex-1 py-3"
                variant="outline"
              >
                创建新卡片
              </Button>
              <Button
                onClick={() => router.push('/cards')}
                className="flex-1 py-3"
              >
                查看我的卡片
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}