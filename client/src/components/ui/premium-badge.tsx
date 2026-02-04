import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";

interface PremiumBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "crown" | "text" | "minimal";
}

export function PremiumBadge({ 
  className, 
  size = "sm", 
  variant = "crown" 
}: PremiumBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm", 
    lg: "px-4 py-2 text-base"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  if (variant === "minimal") {
    return (
      <Crown 
        className={cn(
          iconSizes[size],
          "text-amber-500",
          className
        )} 
      />
    );
  }

  if (variant === "text") {
    return (
      <span className={cn(
        sizeClasses[size],
        "bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-medium",
        className
      )}>
        Premium
      </span>
    );
  }

  return (
    <span className={cn(
      sizeClasses[size],
      "inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-medium",
      className
    )}>
      <Crown className={iconSizes[size]} />
      Premium
    </span>
  );
}