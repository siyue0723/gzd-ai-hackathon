'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function GlassCard({ 
  children, 
  className = '', 
  hover = true, 
  onClick 
}: GlassCardProps) {
  return (
    <motion.div
      className={`glass rounded-2xl p-6 ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={
        hover
          ? {
              scale: 1.02,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              transition: { duration: 0.2 },
            }
          : undefined
      }
      whileTap={
        onClick
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  )
}