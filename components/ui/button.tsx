import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-primary text-white hover:bg-primary-500":
              variant === "primary",
            "bg-accent text-white hover:bg-accent-600": variant === "accent",
            "bg-transparent text-primary hover:bg-primary-50":
              variant === "ghost",
            "bg-danger text-white hover:bg-danger-600": variant === "danger",
            "border border-border bg-surface text-primary hover:bg-primary-50":
              variant === "outline",
          },
          {
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-5 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
