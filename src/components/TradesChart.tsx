import type { StrategyTrade } from '@/hooks/useAssetDetail';
import type { AssetType } from '@/hooks/useGoldHandData';
import { TradingViewLightweightChart } from './TradingViewLightweightChart';

interface TradesChartProps {
  trades: StrategyTrade[];
  strategyName: string;
  ticker: string;
  assetType: AssetType;
  interval?: '1d' | '1wk';
  indicators?: any;
  candles?: any[];
  rsiParams?: { buy: number; sell: number };
}

export const TradesChart = ({ trades, strategyName, ticker, assetType, interval = '1d', indicators, candles, rsiParams }: TradesChartProps) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No trade data available
      </div>
    );
  }

  return (
    <TradingViewLightweightChart
      ticker={ticker}
      assetType={assetType}
      trades={trades}
      strategyName={strategyName}
      height={700}
      interval={interval}
      indicators={indicators}
      candles={candles}
      rsiParams={rsiParams}
    />
  );
};
