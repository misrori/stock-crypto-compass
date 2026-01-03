import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  color: 'gold' | 'blue' | 'grey' | 'gray';
  className?: string;
}

export const TrendBadge = ({ color, className }: TrendBadgeProps) => {
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

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 font-semibold text-xs px-2 py-1',
        badgeClassName,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};
