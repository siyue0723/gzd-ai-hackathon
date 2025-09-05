"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import { Input, Button, Alert } from "@/components/ui";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // 客户端验证
    if (formData.password !== formData.confirmPassword) {
      setError("密码确认不匹配");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("密码长度至少为6位");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("注册成功！正在跳转到登录页面...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "注册失败");
      }
    } catch (error) {
      setError("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">创建账户</h1>
            <p className="text-gray-400">加入我们，开始您的旅程</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert
                type="error"
                message={error}
                dismissible
                onDismiss={() => setError("")}
              />
            )}

            {success && (
              <Alert
                type="success"
                message={success}
              />
            )}

            <div className="space-y-4">
              <Input
                type="text"
                name="username"
                placeholder="用户名"
                value={formData.username}
                onChange={handleChange}
                icon={User}
                required
              />

              <Input
                type="email"
                name="email"
                placeholder="邮箱地址"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <Input
                type="password"
                name="password"
                placeholder="密码 (至少6位)"
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                showPasswordToggle
                required
                minLength={6}
              />

              <Input
                type="password"
                name="confirmPassword"
                placeholder="确认密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={Lock}
                showPasswordToggle
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 focus:ring-green-500"
            >
              {isLoading ? "注册中..." : "创建账户"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              已有账户？{" "}
              <a
                href="/login"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                立即登录
              </a>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}