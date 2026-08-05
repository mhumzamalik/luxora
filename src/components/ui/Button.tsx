import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-xl transition duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-black text-white hover:bg-gray-800 shadow-md focus-visible:ring-black",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-300",
      outline: "border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-400",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow-md focus-visible:ring-red-600",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-xs",
      lg: "px-6 py-3.5 text-sm",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
