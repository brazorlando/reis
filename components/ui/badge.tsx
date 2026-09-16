import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-primary-50 text-primary border border-primary-100":
            variant === "default",
          "bg-success-50 text-success border border-success/20":
            variant === "success",
          "bg-accent-50 text-accent-700 border border-accent/20":
            variant === "warning",
          "bg-danger-50 text-danger border border-danger/20":
            variant === "danger",
          "bg-info-50 text-info border border-info/20": variant === "info",
          "bg-transparent text-slate-600 border border-border":
            variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
