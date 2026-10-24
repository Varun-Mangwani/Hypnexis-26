import React from 'react';
import { cn } from '../lib/utils';
import { VERDICT_CONFIGS, type Verdict } from '../lib/tokens';

export interface DualVerdictBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  verdict: Verdict;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

export const DualVerdictBadge: React.FC<DualVerdictBadgeProps> = ({
  verdict,
  size = 'md',
  compact = false,
  className,
  ...props
}) => {
  const config = VERDICT_CONFIGS[verdict] || VERDICT_CONFIGS.PARAMETRIC_LEAK;
  const IconComponent = config.icon;

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
    lg: 'text-base px-3 py-1.5 gap-2.5 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium select-none shadow-sm transition-colors',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeStyles[size],
        className
      )}
      title={config.description}
      {...props}
    >
      <IconComponent className={cn('flex-shrink-0', iconSizes[size])} aria-hidden="true" />
      <span>{compact ? config.shortLabel : config.label}</span>
    </span>
  );
};
