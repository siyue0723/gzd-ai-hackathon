'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  LogIn, 
  UserPlus, 
  User, 
  Target, 
  BookOpen, 
  Brain, 
  Users, 
  BarChart3,
  Plus,
  LogOut
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUsername = localStorage.getItem('username')
    setIsLoggedIn(!!token)
    setUsername(storedUsername || '')
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    setUsername('')
    window.location.href = '/'
  }

  const publicNavItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/login', label: '登录', icon: LogIn },
    { href: '/register', label: '注册', icon: UserPlus },
  ]

  const privateNavItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/cards/create', label: '创建卡片', icon: Plus },
    { href: '/cards', label: '我的卡片', icon: Target },
    { href: '/study', label: '学习复习', icon: BookOpen },
    { href: '/quiz', label: 'AI测验', icon: Brain },
    { href: '/community', label: '社区', icon: Users },
    { href: '/stats', label: '统计', icon: BarChart3 },
  ]

  const navItems = isLoggedIn ? privateNavItems : publicNavItems

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI考点闪记
              </span>
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* User Info & Logout */}
            {isLoggedIn && (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-300 text-sm">{username}</span>
                </div>
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">登出</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}