import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, BarChart3, Target, Percent, ChevronDown, LineChart, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { StrategySummary, StrategyTrade, Strategy } from '@/hooks/useAssetDetail';
import type { AssetType } from '@/hooks/useGoldHandData';
import { TradesTable } from './TradesTable';
import { TradesChart } from './TradesChart';

interface StrategyCardProps {
  summary: StrategySummary;
  strategyName: string;
  trades?: StrategyTrade[];
  ticker: string;
  assetType: AssetType;
  thresholds?: (string | number)[];
}

const formatNumber = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(parseFloat(value))) {
    return (0).toFixed(decimals);
  }
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const getStrategyDisplayName = (strategyName: string, thresholds?: (string | number)[]): string => {
  if (!thresholds || thresholds.length === 0) {
    return strategyName.replace(/_/g, ' ');
  }

  // For GHL strategies
  if (strategyName.startsWith('goldhand_line')) {
    const colors = thresholds.map(t => String(t).charAt(0).toUpperCase() + String(t).slice(1));
    return `Gold Hand Line (${colors.join(' & ')})`;
  }

  // For RSI strategies
  if (strategyName.startsWith('rsi_')) {
    if (thresholds.length >= 2) {
      return `RSI (${thresholds[0]}/${thresholds[1]})`;
    }
  }

  // Fallback
  return strategyName.replace(/_/g, ' ');
};

const parseResultString = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove 'x' and any whitespace, then parse
  return parseFloat(val.toString().replace(/x/g, '').trim()) || 0;
};

const formatResultDisplay = (val: string | number): string => {
  if (!val) return '0.00x';
  const str = val.toString();
  if (str.includes('x')) {
    // Already has x, just clean it up a bit (ensure one space and one x)
    const num = parseFloat(str.replace(/x/g, '').trim()) || 0;
    return `${num.toFixed(2)}x`;
  }
  return `${parseFloat(str).toFixed(2)}x`;
};

export const StrategyCard = ({ summary, strategyName, trades, ticker, assetType, thresholds }: StrategyCardProps) => {
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isTradesOpen, setIsTradesOpen] = useState(false);
  const winRate = summary['win_ratio(%)'];

  const parsedCumulative = parseResultString(summary.cumulative_result);
  const parsedHold = parseResultString(summary.hold_result);

  // Profitability based on average_res(%) as requested
  const isProfitable = summary['average_res(%)'] > 0;
  const holdBeatsStrategy = parsedHold > parsedCumulative;
  const displayName = getStrategyDisplayName(strategyName, thresholds);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">
            {displayName}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-1 rounded-full ${isProfitable
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
              }`}>
              {isProfitable ? 'Profitable' : 'Unprofitable'}
            </span>
            {holdBeatsStrategy && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Better to Hodl
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key metrics - 5 columns grid */}
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
              <Target className="h-3 w-3" />
              Win Rate
            </div>
            <p className="text-lg font-bold text-emerald-400">
              {formatNumber(winRate)}%
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3 w-3" />
              Total Trades
            </div>
            <p className="text-lg font-bold text-foreground">
              {summary.number_of_trades}
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
              <Percent className="h-3 w-3" />
              Avg Result
            </div>
            <p className={`text-lg font-bold ${summary['average_res(%)'] >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              {summary['average_res(%)'] >= 0 ? '+' : ''}{formatNumber(summary['average_res(%)'])}%
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
              <Percent className="h-3 w-3" />
              Median
            </div>
            <p className={`text-lg font-bold ${summary['median_res(%)'] >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              {summary['median_res(%)'] >= 0 ? '+' : ''}{formatNumber(summary['median_res(%)'])}%
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-2">
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
              <Clock className="h-3 w-3" />
              Avg Length
            </div>
            <p className="text-lg font-bold text-foreground">
              {Math.round(summary['average_trade_len(days)'])} days
            </p>
          </div>
        </div>

        {/* Cumulative result */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cumulative Result</span>
            <span className={`text-2xl font-bold ${parsedCumulative >= 1 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
              {formatResultDisplay(summary.cumulative_result)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Hold Result: {formatResultDisplay(summary.hold_result)}
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

        {/* Strategy Date Info */}
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <p>First trade: {summary.first_trade_buy} | Data range: {summary.first_data_date} - {summary.last_data_date}</p>
        </div>

        {/* Collapsible Trade Visualization */}
        {trades && trades.length > 0 && (
          <>
            <Collapsible open={isChartOpen} onOpenChange={setIsChartOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Trade Visualization
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isChartOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="bg-muted/20 rounded-lg p-2">
                  <TradesChart
                    trades={trades}
                    strategyName={strategyName}
                    ticker={ticker}
                    assetType={assetType}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible open={isTradesOpen} onOpenChange={setIsTradesOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-foreground">
                  Trade History ({trades.length} trades)
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isTradesOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <TradesTable trades={trades} showLatest={30} showCard={false} />
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
};
