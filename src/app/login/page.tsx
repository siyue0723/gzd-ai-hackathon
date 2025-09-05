"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/GlassCard";
import { Input, Button, Alert } from "@/components/ui";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 存储JWT token
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else {
        setError(data.error || "登录失败");
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
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">欢迎回来</h1>
            <p className="text-gray-400">登录您的账户以继续</p>
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

            <div className="space-y-4">
              <Input
                type="email"
                name="emailOrUsername"
                placeholder="邮箱地址或用户名"
                value={formData.emailOrUsername}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <Input
                type="password"
                name="password"
                placeholder="密码"
                value={formData.password}
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
            >
              {isLoading ? "登录中..." : "登录"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              还没有账户？{" "}
              <a
                href="/register"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                立即注册
              </a>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}