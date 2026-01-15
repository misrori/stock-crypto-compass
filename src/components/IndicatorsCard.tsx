import { Activity, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { IntervalData } from '@/hooks/useAssetDetail';
import { formatPrice } from '@/lib/utils';

interface IndicatorsCardProps {
  data: IntervalData;
}


const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const IndicatorsCard = ({ data }: IndicatorsCardProps) => {
  const { indicators, extra_metrics, price_summary } = data;
  const rsi = indicators.latest_rsi;

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-rose-400';
    if (rsi <= 30) return 'text-emerald-400';
    return 'text-yellow-400';
  };

  const getRSIStatus = (rsi: number) => {
    if (rsi >= 70) return 'Overbought';
    if (rsi <= 30) return 'Oversold';
    return 'Neutral';
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Technical Indicators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RSI */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">RSI (14)</span>
            <span className={`text-xl font-bold ${getRSIColor(rsi)}`}>
              {rsi.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${rsi >= 70 ? 'bg-rose-400' : rsi <= 30 ? 'bg-emerald-400' : 'bg-yellow-400'
                }`}
              style={{ width: `${Math.min(100, rsi)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{getRSIStatus(rsi)}</p>
        </div>

        {/* SMAs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Moving Averages</h4>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">SMA 50</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatPrice(indicators.latest_sma_50)}</span>
                <span className={`text-xs ${indicators.diff_from_sma_50 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent((indicators.diff_from_sma_50 / indicators.latest_sma_50) * 100)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm">SMA 100</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatPrice(indicators.latest_sma_100)}</span>
                <span className={`text-xs ${indicators.diff_from_sma_100 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent((indicators.diff_from_sma_100 / indicators.latest_sma_100) * 100)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm">SMA 200</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{formatPrice(indicators.latest_sma_200)}</span>
                <span className={`text-xs ${indicators.diff_from_sma_200 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPercent((indicators.diff_from_sma_200 / indicators.latest_sma_200) * 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price extremes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <div className="flex items-center gap-1 text-emerald-400 text-xs mb-1">
              <ArrowUp className="h-3 w-3" />
              All-Time High
            </div>
            <p className="font-mono font-bold">{formatPrice(price_summary.max_high)}</p>
          </div>

          <div className="bg-rose-500/10 rounded-lg p-3">
            <div className="flex items-center gap-1 text-rose-400 text-xs mb-1">
              <ArrowDown className="h-3 w-3" />
              All-Time Low
            </div>
            <p className="font-mono font-bold">{formatPrice(price_summary.min_low)}</p>
          </div>
        </div>

        {/* Local extremes */}
        <div className="space-y-2 text-sm">
          <h4 className="font-medium text-muted-foreground">Recent Extremes</h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Local Max</span>
            </div>
            <div className="text-right">
              <p className="font-mono">{formatPrice(extra_metrics.last_local_max_price)}</p>
              <p className="text-xs text-muted-foreground">
                {extra_metrics.last_local_max_date} ({extra_metrics.days_after_last_local_max}d ago)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              <span>Local Min</span>
            </div>
            <div className="text-right">
              <p className="font-mono">{formatPrice(extra_metrics.last_local_min_price)}</p>
              <p className="text-xs text-muted-foreground">
                {extra_metrics.last_local_min_date} ({extra_metrics.days_after_last_local_min}d ago)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
