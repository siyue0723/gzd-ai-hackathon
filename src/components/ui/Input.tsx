"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  showPasswordToggle?: boolean;
  variant?: "default" | "glass";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, error, showPasswordToggle, variant = "glass", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const baseStyles = "w-full py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";
    
    const variantStyles = {
      default: "bg-gray-800 border border-gray-600 rounded-lg",
      glass: "bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm"
    };

    const paddingStyles = {
      withIcon: Icon ? "pl-12" : "pl-4",
      withToggle: (isPassword && showPasswordToggle) ? "pr-12" : "pr-4"
    };

    return (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        )}
        
        <input
          type={inputType}
          className={cn(
            baseStyles,
            variantStyles[variant],
            paddingStyles.withIcon,
            paddingStyles.withToggle,
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;