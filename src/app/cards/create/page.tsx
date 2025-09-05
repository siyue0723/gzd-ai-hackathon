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
  const [generatedCards, setGeneratedCards] = useState<StudyCard[]>([]);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generateMode, setGenerateMode] = useState<'single' | 'multiple'>('single');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');

  const subjects = [
    '数学', '物理', '化学', '生物', '语文', '英语', 
    '历史', '地理', '政治', '计算机', '经济学', '心理学', '其他'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let inputContent = '';
    
    // 获取输入内容
    if (inputMode === 'text') {
      if (!formData.input.trim()) {
        setError('请输入学习内容');
        return;
      }
      inputContent = formData.input.trim();
    } else {
      if (!uploadedFile) {
        setError('请选择要上传的文件');
        return;
      }
      
      try {
        // 这里应该调用文件解析API，暂时使用文件名作为内容
        inputContent = `文件：${uploadedFile.name}\n\n请注意：文件解析功能正在开发中，请先使用文本输入模式。`;
      } catch (error) {
        setError('文件解析失败，请重试');
        return;
      }
    }

    if (inputContent.length > 5000) {
      setError('输入内容过长，请控制在5000字符以内');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedCard(null);
    setGeneratedCards([]);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      if (generateMode === 'single') {
        // 单张卡片生成
        const response = await fetch('/api/cards/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            input: inputContent,
            subject: formData.subject
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '生成卡片失败');
        }

        setGeneratedCard(data.card);
      } else {
        // 批量卡片生成
        const response = await fetch('/api/cards/generate-multiple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            input: inputContent,
            subject: formData.subject
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '生成卡片失败');
        }

        setGeneratedCards(data.cards);
      }
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

                {/* 输入模式选择 */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    输入方式
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-4 py-2 rounded-lg border ${
                        inputMode === 'text'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      文本输入
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('file')}
                      className={`px-4 py-2 rounded-lg border ${
                        inputMode === 'file'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      文件上传
                    </button>
                  </div>
                </div>

                {/* 生成模式选择 */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    生成模式
                  </label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setGenerateMode('single')}
                      className={`px-4 py-2 rounded-lg border ${
                        generateMode === 'single'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      单张卡片
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerateMode('multiple')}
                      className={`px-4 py-2 rounded-lg border ${
                        generateMode === 'multiple'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                      }`}
                    >
                      批量生成 (2-5张)
                    </button>
                  </div>
                </div>

                {/* 内容输入区域 */}
                {inputMode === 'text' ? (
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
                ) : (
                  <div>
                    <label className="block text-white font-medium mb-3">
                      上传文件 *
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".txt,.pdf,.doc,.docx,.ppt,.pptx"
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-gray-300">
                          {uploadedFile ? (
                            <div>
                              <p className="text-green-400 font-medium">{uploadedFile.name}</p>
                              <p className="text-sm text-gray-400 mt-1">点击重新选择文件</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg mb-2">📁</p>
                              <p className="font-medium">点击上传文件</p>
                              <p className="text-sm text-gray-400 mt-1">
                                支持 TXT、PDF、Word、PPT 格式
                              </p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                    {uploadedFile && (
                      <div className="mt-2 text-sm text-orange-400">
                        ⚠️ 文件解析功能正在开发中，当前仅支持文本输入模式
                      </div>
                    )}
                  </div>
                )}

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
                  disabled={isLoading || (inputMode === 'text' ? !formData.input.trim() : !uploadedFile)}
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
            {/* 单张卡片预览 */}
            {generatedCard && (
              <>
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
              </>
            )}

            {/* 批量生成的卡片 */}
            {generatedCards.length > 0 && (
              <>
                {/* 批量生成标题 */}
                <GlassCard className="p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                    <Sparkles className="text-yellow-400" />
                    批量生成的学习卡片
                  </h2>
                  <p className="text-gray-300">
                    AI已为您智能拆解内容，生成了 {generatedCards.length} 张相关的学习卡片
                  </p>
                </GlassCard>

                {/* 卡片列表 */}
                {generatedCards.map((card, index) => (
                  <GlassCard key={index} className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-blue-400" />
                        卡片 {index + 1}: {card.title}
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                          {card.subject}
                        </span>
                        <span className={`px-3 py-1 bg-gray-500/20 rounded-full text-sm ${
                          getDifficultyColor(card.difficulty)
                        }`}>
                          {getDifficultyText(card.difficulty)}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* 核心考点 */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          核心考点
                        </h4>
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                          <p className="text-gray-200 leading-relaxed">
                            {card.corePoint}
                          </p>
                        </div>
                      </div>

                      {/* 易混点 */}
                      {card.confusionPoint && (
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-yellow-300 flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            易混淆点
                          </h4>
                          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-gray-200 leading-relaxed">
                              {card.confusionPoint}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 典型例题 */}
                    {card.example && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-green-300 mb-4">
                          典型例题
                        </h4>
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {card.example}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 标签 */}
                    {card.tags.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-300 mb-3">
                          相关标签
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {card.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </GlassCard>
                ))}

                {/* 批量操作按钮 */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setGeneratedCards([]);
                      setFormData({ input: '', subject: '' });
                      setUploadedFile(null);
                      setError('');
                    }}
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
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}