import type { StrategyTrade } from '@/hooks/useAssetDetail';
import type { AssetType } from '@/hooks/useGoldHandData';
import { TradingViewLightweightChart } from './TradingViewLightweightChart';

interface TradesChartProps {
  trades: StrategyTrade[];
  strategyName: string;
  ticker: string;
  assetType: AssetType;
}

export const TradesChart = ({ trades, strategyName, ticker, assetType }: TradesChartProps) => {
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
      height={500}
    />
  );
};
