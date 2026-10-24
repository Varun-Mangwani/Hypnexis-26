import React from 'react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  icon,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-sm active:scale-[0.98]',
    secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-700 active:scale-[0.98]',
    outline: 'border border-zinc-200 hover:bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:hover:bg-zinc-800/60 dark:text-zinc-200 active:scale-[0.98]',
    ghost: 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:text-zinc-300 dark:hover:text-zinc-100',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.98]',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 gap-1.5 min-h-[30px]',
    md: 'text-sm px-3.5 py-1.5 gap-2 min-h-[36px]',
    lg: 'text-base px-4 py-2 gap-2.5 min-h-[42px]',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
