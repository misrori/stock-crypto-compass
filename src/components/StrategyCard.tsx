import { TrendingUp, TrendingDown, Clock, BarChart3, Target, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StrategySummary } from '@/hooks/useAssetDetail';

interface StrategyCardProps {
  summary: StrategySummary;
  strategyName: string;
}

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const StrategyCard = ({ summary, strategyName }: StrategyCardProps) => {
  const winRate = summary['win_ratio(%)'];
  const isPositive = summary.cumulative_result > 1;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold capitalize">
            {strategyName.replace(/_/g, ' ')}
          </span>
          <span className={`text-sm px-2 py-1 rounded-full ${
            isPositive 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isPositive ? 'Profitable' : 'Unprofitable'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Target className="h-3 w-3" />
              Win Rate
            </div>
            <p className={`text-xl font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatNumber(winRate)}%
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3 w-3" />
              Total Trades
            </div>
            <p className="text-xl font-bold text-foreground">
              {summary['number_of_trades']}
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Percent className="h-3 w-3" />
              Avg Result
            </div>
            <p className={`text-xl font-bold ${
              summary['average_res(%)'] >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {summary['average_res(%)'] >= 0 ? '+' : ''}{formatNumber(summary['average_res(%)'])}%
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Avg Trade Length
            </div>
            <p className="text-xl font-bold text-foreground">
              {formatNumber(summary['average_trade_len(days)'], 0)} days
            </p>
          </div>
        </div>

        {/* Cumulative result */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cumulative Result</span>
            <span className={`text-2xl font-bold ${
              summary.cumulative_result >= 1 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatNumber(summary.cumulative_result)}x
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Hold Result: {summary.hold_result}
          </p>
        </div>

        {/* Win/Loss breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Winning Trades</span>
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Count: {summary.number_of_win_trades}</p>
              <p>Mean: +{formatNumber(summary.profitable_trades_mean)}%</p>
              <p>Median: +{formatNumber(summary.profitable_trades_median)}%</p>
              <p>Max Gain: +{formatNumber(summary['max_gain(%)'])}%</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-400">
              <TrendingDown className="h-4 w-4" />
              <span className="font-medium">Losing Trades</span>
            </div>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>Count: {summary.number_of_lost_trades}</p>
              <p>Mean: {formatNumber(summary.looser_trades_mean)}%</p>
              <p>Median: {formatNumber(summary.looser_trades_median)}%</p>
              <p>Max Loss: {formatNumber(summary['max_lost(%)'])}%</p>
            </div>
          </div>
        </div>

        {/* Strategy info */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <p>Buy at: <span className="text-foreground capitalize">{summary.buy_at}</span> | Sell at: <span className="text-foreground capitalize">{summary.sell_at}</span></p>
          <p>First trade: {summary.first_trade_buy} | Data range: {summary.first_data_date} - {summary.last_data_date}</p>
        </div>
      </CardContent>
    </Card>
  );
};
