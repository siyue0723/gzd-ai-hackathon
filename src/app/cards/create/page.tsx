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

  const [generatedCards, setGeneratedCards] = useState<StudyCard[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // 流式生成相关状态
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState({ current: 0, total: 0 });
  const [streamMessage, setStreamMessage] = useState('');
  const [currentGeneratingCard, setCurrentGeneratingCard] = useState<number | null>(null);

  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');

  const subjects = [
    '数学', '物理', '化学', '生物', '语文', '英语', 
    '历史', '地理', '政治', '计算机', '经济学', '心理学', '其他'
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // 调用文件解析API
        const response = await fetch('/api/cards/parse-file', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          setFormData(prev => ({ ...prev, input: result.text }));
          setUploadedFile(file);
          setError('');
        } else {
          throw new Error(result.error || '文件解析失败');
        }
      } catch (error: any) {
        console.error('文件上传错误:', error);
        setError(error.message || '文件解析失败');
      } finally {
        setIsLoading(false);
      }
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
      
      if (!formData.input.trim()) {
        setError('文件内容为空或解析失败，请重新上传文件');
        return;
      }
      
      inputContent = formData.input.trim();
    }

    if (inputContent.length > 15000) {
      setError('输入内容过长，请控制在15000字符以内');
      return;
    }

    // 重置状态
    setIsLoading(false);
    setIsStreaming(true);
    setError('');
    setSuccessMessage('');
    setGeneratedCards([]);
    setStreamProgress({ current: 0, total: 0 });
    setStreamMessage('');
    setCurrentGeneratingCard(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // 使用流式API生成卡片
      const response = await fetch('/api/cards/generate-stream', {
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

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      const newCards: StudyCard[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'start':
                  setStreamMessage(data.message);
                  setStreamProgress({ current: 0, total: data.totalCards });
                  break;
                  
                case 'progress':
                  setStreamMessage(data.message);
                  setCurrentGeneratingCard(data.currentCard);
                  setStreamProgress({ current: data.currentCard - 1, total: data.totalCards });
                  break;
                  
                case 'card':
                  // 处理tags字段：将逗号分隔的字符串转换为数组
                  const processedCard = {
                    ...data.card,
                    tags: typeof data.card.tags === 'string' 
                      ? data.card.tags.split(',').filter(tag => tag.trim()) 
                      : data.card.tags || []
                  };
                  newCards.push(processedCard);
                  setGeneratedCards([...newCards]);
                  setStreamProgress({ current: data.currentCard, total: data.totalCards });
                  break;
                  
                case 'complete':
                  setStreamMessage('');
                  setCurrentGeneratingCard(null);
                  setSuccessMessage(data.message);
                  break;
                  
                case 'error':
                  throw new Error(data.message);
              }
            } catch (parseError) {
              console.error('解析SSE数据失败:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('流式生成失败:', error);
      setError(error instanceof Error ? error.message : '生成卡片失败');
    } finally {
      setIsStreaming(false);
      setStreamMessage('');
      setCurrentGeneratingCard(null);
    }
  };

  const handleCreateAnother = () => {
    setGeneratedCards([]);
    setFormData({ input: '', subject: '' });
    setError('');
    setSuccessMessage('');
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

        {generatedCards.length === 0 ? (
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
                    {uploadedFile && formData.input && (
                      <div className="mt-2 text-sm text-green-400">
                        ✅ 文件解析成功：{uploadedFile.name} ({formData.input.length} 字符)
                      </div>
                    )}
                    {uploadedFile && !formData.input && (
                      <div className="mt-2 text-sm text-yellow-400">
                        ⏳ 正在解析文件...
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

                {/* 成功提示 */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300"
                  >
                    {successMessage}
                  </motion.div>
                )}

                {/* 提交按钮 */}
                <Button
                  type="submit"
                  disabled={isLoading || isStreaming || (inputMode === 'text' ? !formData.input.trim() : !uploadedFile)}
                  className="w-full py-4 text-lg font-medium"
                >
                  {isStreaming ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loading size="sm" />
                      {streamMessage || 'AI 正在智能生成卡片...'}
                    </div>
                  ) : isLoading ? (
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
            {/* 流式生成进度显示 */}
            {isStreaming && (
              <GlassCard className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loading size="sm" />
                    <h3 className="text-lg font-semibold text-white">AI 正在智能生成卡片</h3>
                  </div>
                  
                  {streamProgress.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>生成进度</span>
                        <span>{streamProgress.current}/{streamProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(streamProgress.current / streamProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {streamMessage && (
                    <p className="text-gray-300 text-sm">{streamMessage}</p>
                  )}
                  
                  {currentGeneratingCard && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-300 text-sm font-medium mb-1">
                        正在生成第 {currentGeneratingCard} 张卡片...
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
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
                      setSuccessMessage('');
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