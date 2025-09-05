"use client";

import { motion } from "framer-motion";
import { Sparkles, Code, Users, Zap } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function Home() {
  const features = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "现代化技术栈",
      description: "基于Next.js 15、React 19和TypeScript构建，采用最新的Web技术标准"
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "玻璃态设计",
      description: "采用现代玻璃态设计语言，配合动态粒子背景和流畅动画效果"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "用户认证",
      description: "完整的用户注册、登录系统，基于JWT的安全认证机制"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "高性能",
      description: "优化的性能表现，快速加载和响应，提供流畅的用户体验"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* 主标题区域 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 max-w-4xl"
      >
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          AI Hackathon
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
          现代化Web应用开发平台
        </p>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          基于Next.js 15和React 19构建的现代化Web应用，采用玻璃态设计和暗黑主题，
          为开发者提供最佳的用户体验和开发体验。
        </p>
      </motion.div>

      {/* 功能特性网格 */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full mb-16"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
          >
            <GlassCard className="p-8 h-full">
              <div className="flex items-start space-x-4">
                <div className="text-blue-400 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* 行动按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <motion.a
          href="/register"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass px-8 py-4 rounded-full text-white font-medium text-lg transition-all duration-300 hover:bg-white/20 border border-white/20"
        >
          开始使用
        </motion.a>
        <motion.a
          href="/login"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 rounded-full text-white font-medium text-lg transition-all duration-300 hover:bg-white/10 border border-white/10"
        >
          立即登录
        </motion.a>
      </motion.div>
    </div>
  );
}
