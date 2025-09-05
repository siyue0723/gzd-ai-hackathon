"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "primary",
    size = "md",
    icon: Icon,
    iconPosition = "left",
    loading = false,
    fullWidth = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantStyles = {
      primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white focus:ring-blue-500",
      secondary: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
      glass: "bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white focus:ring-white/50",
      outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white focus:ring-blue-500",
      ghost: "text-gray-300 hover:text-white hover:bg-white/10 focus:ring-white/50"
    };
    
    const sizeStyles = {
      sm: "px-3 py-2 text-sm rounded-md",
      md: "px-4 py-2.5 text-base rounded-lg",
      lg: "px-6 py-3 text-lg rounded-xl"
    };
    
    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6"
    };

    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        {...props}
      >
        {loading && (
          <div className="mr-2 animate-spin rounded-full border-2 border-current border-t-transparent w-4 h-4" />
        )}
        
        {Icon && iconPosition === "left" && !loading && (
          <Icon className={cn(iconSizes[size], children && "mr-2")} />
        )}
        
        {children}
        
        {Icon && iconPosition === "right" && !loading && (
          <Icon className={cn(iconSizes[size], children && "ml-2")} />
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;