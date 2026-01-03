import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  color: 'gold' | 'blue' | 'grey' | 'gray';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TrendBadge = ({ color, className, size = 'md' }: TrendBadgeProps) => {
  const normalizedColor = color === 'gray' ? 'grey' : color;
  
  const config = {
    gold: {
      label: 'BULLISH',
      icon: TrendingUp,
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30',
    },
    blue: {
      label: 'BEARISH',
      icon: TrendingDown,
      className: 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30',
    },
    grey: {
      label: 'NEUTRAL',
      icon: Minus,
      className: 'bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30',
    },
  };

  const { label, icon: Icon, className: badgeClassName } = config[normalizedColor];

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 font-semibold',
        sizeClasses[size],
        badgeClassName,
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </Badge>
  );
};
