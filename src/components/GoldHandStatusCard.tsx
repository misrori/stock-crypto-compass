import { Sparkles, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendBadge } from './TrendBadge';
import type { IntervalData } from '@/hooks/useAssetDetail';

interface GoldHandStatusCardProps {
  data: IntervalData;
  ticker: string;
}

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
};

const formatDays = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;
  
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''}`;
};

export const GoldHandStatusCard = ({ data, ticker }: GoldHandStatusCardProps) => {
  const { extra_metrics, price_summary } = data;
  const ghlColor = extra_metrics.ghl_color.toLowerCase() as 'gold' | 'blue' | 'grey' | 'gray';
  const normalizedColor = ghlColor === 'gray' ? 'grey' : ghlColor;
  
  const getStatusText = (color: string) => {
    switch (color) {
      case 'gold':
        return 'Bullish - BUY Signal Active';
      case 'blue':
        return 'Bearish - SELL Signal Active';
      default:
        return 'Neutral - No Clear Signal';
    }
  };

  const getBackgroundGradient = (color: string) => {
    switch (color) {
      case 'gold':
        return 'from-amber-500/20 via-yellow-500/10 to-transparent';
      case 'blue':
        return 'from-blue-500/20 via-sky-500/10 to-transparent';
      default:
        return 'from-gray-500/20 via-slate-500/10 to-transparent';
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${getBackgroundGradient(normalizedColor)} border-border overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg">Gold Hand Line Status</span>
          </div>
          <TrendBadge color={normalizedColor} size="lg" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xl font-semibold text-foreground">
          {getStatusText(normalizedColor)}
        </p>

        {/* Current Price */}
        <div className="bg-background/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Price</span>
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(price_summary.last_close)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-muted-foreground">Total Return</span>
            <span className={`font-bold ${price_summary.total_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {price_summary.total_return >= 100 
                ? `${(price_summary.total_return / 100).toFixed(0)}x` 
                : `${price_summary.total_return.toFixed(2)}%`
              }
            </span>
          </div>
        </div>

        {/* Signal details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              GHL Signal
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDays(extra_metrics.ghl_days_since_last_change)} in signal</span>
              </div>
              <p className="text-muted-foreground">
                Changed: {extra_metrics.ghl_last_change_date}
              </p>
              <p className="text-muted-foreground">
                Price at flip: {formatPrice(extra_metrics.ghl_last_change_price)}
              </p>
              <p className={`font-medium ${extra_metrics.ghl_change_percent_from_last_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {extra_metrics.ghl_change_percent_from_last_change >= 0 ? '+' : ''}
                {extra_metrics.ghl_change_percent_from_last_change.toFixed(2)}% since flip
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              RSI Signal
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  extra_metrics.rsi_status === 'open' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {extra_metrics.rsi_status.toUpperCase()}
                </span>
              </div>
              <p className="text-muted-foreground">
                Changed: {extra_metrics.rsi_last_change_date}
              </p>
              <p className="text-muted-foreground">
                {formatDays(extra_metrics.rsi_days_since_last_change)} ago
              </p>
              <p className={`font-medium ${extra_metrics.rsi_change_percent_from_last_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {extra_metrics.rsi_change_percent_from_last_change >= 0 ? '+' : ''}
                {extra_metrics.rsi_change_percent_from_last_change.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Drawdown from max */}
        <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            <span>From Recent High</span>
          </div>
          <span className="text-rose-400 font-medium">
            -{extra_metrics.fell_from_last_max.toFixed(2)}%
          </span>
        </div>

        {/* Stock specific info */}
        {extra_metrics.sector && (
          <div className="text-sm text-muted-foreground border-t border-border pt-3 space-y-1">
            <p>Sector: <span className="text-foreground">{extra_metrics.sector}</span></p>
            {extra_metrics.industry && (
              <p>Industry: <span className="text-foreground">{extra_metrics.industry}</span></p>
            )}
            {extra_metrics.price_per_earning && (
              <p>P/E Ratio: <span className="text-foreground">{extra_metrics.price_per_earning.toFixed(2)}</span></p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
