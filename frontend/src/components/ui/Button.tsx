import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  /** When true, disables the button and shows a spinner. NOT forwarded to the DOM. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      leftIcon,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-lg font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

    const variants = {
      primary:   "bg-primary text-white hover:opacity-90 focus:ring-primary shadow-sm",
      secondary: "bg-secondary text-white hover:opacity-90 focus:ring-secondary shadow-sm",
      danger:    "bg-danger text-white hover:opacity-90 focus:ring-danger shadow-sm",
      ghost:     "border border-primary text-primary bg-transparent hover:bg-primary/5 focus:ring-primary",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={loading || disabled}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
        )}
        {!loading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
