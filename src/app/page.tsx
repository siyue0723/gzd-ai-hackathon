"use client";

import { motion } from "framer-motion";
import { Target, Brain, Users, TrendingUp, BookOpen, Upload, Download, Coins, Zap } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "智能考点拆解",
      description: "上传PDF/PPT或输入文本，AI自动识别并拆解关键考点，生成结构化学习卡片，支持多模态内容展示。",
      href: "/cards/create"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "艾宾浩斯智能推送",
      description: "基于遗忘曲线算法，智能计算最佳复习时间，在碎片时间主动推送需要复习的卡片，提高记忆效率。",
      href: "/study"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI互动测验",
      description: "自动生成个性化测验题目，提供详细的错题分析和解释，针对薄弱环节生成迷你闪记卡强化学习。",
      href: "/quiz"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "考点共享社群",
      description: "用户可分享优质考点卡片，通过AI内容审核确保质量，建立代币激励机制促进知识共享生态。",
      href: "/community"
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
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          AI考点闪记助手
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
          智能学习，科学记忆
        </p>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
          基于AI技术和艾宾浩斯遗忘曲线的智能学习平台，帮助你高效掌握考点知识，
          通过多模态卡片生成、智能推送复习和社群共享，让学习更科学、更有趣。
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
            {isLoggedIn ? (
              <Link href={feature.href}>
                <GlassCard className="p-8 h-full hover:scale-105 transition-transform cursor-pointer">
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
              </Link>
            ) : (
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
            )}
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
        {isLoggedIn ? (
          <Link href="/cards/create">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass px-8 py-4 rounded-full text-white font-medium text-lg transition-all duration-300 hover:bg-white/20 border border-white/20 cursor-pointer"
            >
              开始创建卡片
            </motion.div>
          </Link>
        ) : (
          <>
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
          </>
        )}
      </motion.div>
    </div>
  );
}
