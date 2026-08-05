import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-1 text-xs w-full">
        {label && <label className="font-bold text-gray-700 block mb-1">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-gray-50 border ${
              error ? "border-red-500" : "border-gray-200"
            } rounded-xl p-3 ${icon ? "pl-9" : "pl-3"} outline-hidden focus:border-black transition ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
