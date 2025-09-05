"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Settings, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import { Button, Loading } from "@/components/ui";

interface UserData {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 模拟用户数据获取
    // 在实际应用中，这里应该调用API来获取用户信息
    setTimeout(() => {
      setUser({
        id: "1",
        username: "用户",
        email: "user@example.com",
        createdAt: new Date().toISOString()
      });
      setIsLoading(false);
    }, 1000);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="加载中..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-6xl mx-auto">
        {/* 欢迎区域 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            欢迎回来，{user.username}！
          </h1>
          <p className="text-xl text-gray-300">
            这是您的个人仪表板，您可以在这里管理您的账户和设置。
          </p>
        </motion.div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">个人资料</h3>
                  <p className="text-gray-400 text-sm">管理您的个人信息</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-400">用户名：</span>{user.username}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">邮箱：</span>{user.email}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">注册时间：</span>
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">活动统计</h3>
                  <p className="text-gray-400 text-sm">查看您的使用情况</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-400">今日访问：</span>5 次
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">本周活跃：</span>7 天
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">总使用时长：</span>2.5 小时
                </p>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">系统设置</h3>
                  <p className="text-gray-400 text-sm">自定义您的体验</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button variant="ghost" size="sm" fullWidth className="justify-start">
                  主题设置
                </Button>
                <Button variant="ghost" size="sm" fullWidth className="justify-start">
                  通知偏好
                </Button>
                <Button variant="ghost" size="sm" fullWidth className="justify-start">
                  隐私设置
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="glass"
            size="lg"
            icon={Settings}
            iconPosition="left"
            className="rounded-full"
          >
            账户设置
          </Button>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="lg"
            icon={LogOut}
            iconPosition="left"
            className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            退出登录
          </Button>
        </motion.div>
      </div>
    </div>
  );
}