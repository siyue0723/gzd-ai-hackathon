"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
  className?: string;
  text?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "spinner",
  className,
  text
}) => {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (variant === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent",
            sizeStyles[size]
          )}
        />
        {text && (
          <p className={cn("text-gray-400", textSizes[size])}>{text}</p>
        )}
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "bg-current rounded-full",
                size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
              )}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={
                {
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }
              }
            />
          ))}
        </div>
        {text && (
          <p className={cn("text-gray-400", textSizes[size])}>{text}</p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
        <motion.div
          className={cn(
            "bg-current rounded-full",
            sizeStyles[size]
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        />
        {text && (
          <p className={cn("text-gray-400", textSizes[size])}>{text}</p>
        )}
      </div>
    );
  }

  return null;
};

export default Loading;