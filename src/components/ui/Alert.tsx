"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message,
  dismissible = false,
  onDismiss,
  className
}) => {
  const alertConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      textColor: "text-green-400",
      iconColor: "text-green-500"
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      textColor: "text-red-400",
      iconColor: "text-red-500"
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      textColor: "text-yellow-400",
      iconColor: "text-yellow-500"
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
      iconColor: "text-blue-500"
    }
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "relative p-4 rounded-lg border backdrop-blur-sm",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start space-x-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.iconColor)} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("font-medium mb-1", config.textColor)}>
              {title}
            </h4>
          )}
          <p className={cn("text-sm", config.textColor)}>
            {message}
          </p>
        </div>
        
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              "flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors",
              config.textColor
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Alert;