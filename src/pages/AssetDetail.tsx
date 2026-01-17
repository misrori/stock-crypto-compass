import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink, Calendar, Star, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useAssetDetail, type IntervalData, type Strategy } from '@/hooks/useAssetDetail';
import { useGoldHandData } from '@/hooks/useGoldHandData';
import { usePredictions } from '@/hooks/usePredictions';
import { GoldHandStatusCard } from '@/components/GoldHandStatusCard';
import { IndicatorsCard } from '@/components/IndicatorsCard';
import { StrategyCard } from '@/components/StrategyCard';
import { ScenarioPredictionForm } from '@/components/ScenarioPredictionForm';
import { ScenarioAggregatedView } from '@/components/ScenarioAggregatedView';
import { PredictionHistory } from '@/components/PredictionHistory';
import { ScenarioPriceMap } from '@/components/ScenarioPriceMap';
import type { AssetType, Timeframe } from '@/hooks/useGoldHandData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AdvancedChart } from '@/components/AdvancedChart';

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

const AssetDetail = () => {
  const { type, ticker } = useParams<{ type: string; ticker: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const [timeframe, setTimeframe] = useState<Timeframe>('daily');

  const assetType = (type || 'stocks') as AssetType;
  const decodedTicker = ticker ? decodeURIComponent(ticker) : '';

  const { data, loading, error, refetch } = useAssetDetail(decodedTicker, assetType, timeframe);
  const {
    userActivePrediction,
    history: predictionLog,
    aggregatedData,
    submitPrediction,
    isLocked,
    refetch: refetchPredictions
  } = usePredictions(decodedTicker, assetType);

  const { data: summaryData } = useGoldHandData(assetType, timeframe);
  const assetSummary = summaryData.find(a => a.ticker === decodedTicker);
  const displayName = assetSummary?.display_name || (assetType === 'commodities' ? (assetSummary?.commodity_name || assetSummary?.name || decodedTicker) : (assetSummary?.name || decodedTicker));

  const getTradingViewSymbol = (ticker: string, assetType: AssetType): string => {
    if (assetType === 'crypto') {
      const cleanTicker = ticker.replace('_USD', '').replace('USD', '');
      return `BINANCE:${cleanTicker}USDT`;
    }
    if (assetType === 'commodities') {
      const commodityMap: Record<string, string> = {
        'GC=F': 'COMEX:GC1!',
        'SI=F': 'COMEX:SI1!',
        'CL=F': 'NYMEX:CL1!',
        'NG=F': 'NYMEX:NG1!',
        'HG=F': 'COMEX:HG1!',
        'PL=F': 'NYMEX:PL1!',
        'PA=F': 'NYMEX:PA1!',
        'BZ=F': 'ICEEUR:BRN1!',
      };
      return commodityMap[ticker.toUpperCase()] || `TVC:${ticker.replace('=F', '')}`;
    }
    return `NASDAQ:${ticker}`;
  };

  const tvSymbol = assetSummary?.tradingview_id || getTradingViewSymbol(decodedTicker, assetType);

  const currentPrice = data?.intervals[timeframe]?.price_summary.last_close || data?.intervals.daily?.price_summary.last_close || 0;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);


  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const currentIntervalData: IntervalData | undefined = data?.intervals[timeframe] || data?.intervals.daily;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/scanner')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {displayName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-yellow-500 transition-colors"
                    onClick={() => toggleWatchlist(decodedTicker, assetType)}
                  >
                    <Star className={`h-5 w-5 ${isInWatchlist(decodedTicker, assetType) ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground capitalize">
                  {assetType} • {data?.is_crypto ? 'Cryptocurrency' : 'Traditional Asset'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://www.tradingview.com/chart/?symbol=${tvSymbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View on TradingView
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Loading state */}
        {loading && (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center">
            <p className="text-destructive mb-4">Error loading asset data: {error}</p>
            <Button variant="outline" onClick={refetch}>
              Try Again
            </Button>
          </div>
        )}

        {/* Content */}
        {data && currentIntervalData && (
          <>

            {/* Advanced Chart */}
            <AdvancedChart
              symbol={decodedTicker}
              assetType={assetType}
            />

            {/* Gold Hand Status and Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GoldHandStatusCard data={currentIntervalData} ticker={decodedTicker} />
              <IndicatorsCard data={currentIntervalData} />
              <ScenarioPriceMap
                currentPrice={currentPrice}
                userActivePrediction={userActivePrediction}
                aggregatedData={aggregatedData}
              />
            </div>

            {/* Predictions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Market Consciousness</h2>
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase tracking-widest text-[10px] font-black">Beta Layer</Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ScenarioPredictionForm
                  assetTicker={decodedTicker}
                  assetType={assetType}
                  currentPrice={currentPrice}
                  onSubmit={submitPrediction}
                  hasActivePrediction={!isLocked}
                  activePrediction={userActivePrediction}
                />
                <ScenarioAggregatedView
                  data={aggregatedData}
                  isLocked={isLocked}
                />
              </div>

              <PredictionHistory history={predictionLog} />
            </div>

            {/* Strategies with Trade History - Grouped by Type */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Strategy Backtests</h2>

              {(() => {
                // Group strategies by type
                const goldHandStrategies: [string, Strategy][] = [];
                const rsiStrategies: [string, Strategy][] = [];
                const otherStrategies: [string, Strategy][] = [];

                Object.entries(currentIntervalData.strategies).forEach(([name, strategy]) => {
                  if (name.startsWith('goldhand_line')) {
                    goldHandStrategies.push([name, strategy]);
                  } else if (name.startsWith('rsi_')) {
                    rsiStrategies.push([name, strategy]);
                  } else {
                    otherStrategies.push([name, strategy]);
                  }
                });

                // Don't show tabs if only one category has strategies
                const categoriesWithData = [
                  goldHandStrategies.length > 0,
                  rsiStrategies.length > 0,
                  otherStrategies.length > 0
                ].filter(Boolean).length;

                if (categoriesWithData <= 1) {
                  // Show all strategies without tabs
                  return (
                    <div className="grid grid-cols-1 gap-6">
                      {Object.entries(currentIntervalData.strategies).map(([name, strategy]) => (
                        <StrategyCard
                          key={name}
                          summary={strategy.summary}
                          strategyName={name}
                          trades={strategy.trades}
                          ticker={decodedTicker}
                          assetType={assetType}
                          thresholds={strategy.thresholds}
                        />
                      ))}
                    </div>
                  );
                }

                // Show tabs with timeframe selector
                return (
                  <Tabs defaultValue={goldHandStrategies.length > 0 ? "ghl" : "rsi"} className="w-full">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      {/* Timeframe Selector - Balanced Size */}
                      <div className="flex bg-muted/60 rounded-xl p-1 border border-primary/10 shadow-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                            timeframe === 'daily' ? "bg-primary text-primary-foreground shadow-lg scale-105 z-10" : "hover:bg-primary/20 opacity-70"
                          )}
                          onClick={() => setTimeframe('daily')}
                        >
                          Daily
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                            timeframe === 'weekly' ? "bg-primary text-primary-foreground shadow-lg scale-105 z-10" : "hover:bg-primary/20 opacity-70"
                          )}
                          onClick={() => setTimeframe('weekly')}
                        >
                          Weekly
                        </Button>
                      </div>

                      <TabsList className="grid bg-muted/30 p-1 rounded-xl" style={{ gridTemplateColumns: `repeat(${categoriesWithData}, 1fr)`, width: '100%', maxWidth: '500px' }}>
                        {goldHandStrategies.length > 0 && (
                          <TabsTrigger value="ghl" className="text-[10px] uppercase font-bold tracking-tight px-4">Gold Hand Line ({goldHandStrategies.length})</TabsTrigger>
                        )}
                        {rsiStrategies.length > 0 && (
                          <TabsTrigger value="rsi" className="text-[10px] uppercase font-bold tracking-tight px-4">RSI Strategy ({rsiStrategies.length})</TabsTrigger>
                        )}
                        {otherStrategies.length > 0 && (
                          <TabsTrigger value="other" className="text-[10px] uppercase font-bold tracking-tight px-4">Other ({otherStrategies.length})</TabsTrigger>
                        )}
                      </TabsList>
                    </div>

                    {goldHandStrategies.length > 0 && (
                      <TabsContent value="ghl" className="space-y-6">
                        {goldHandStrategies.map(([name, strategy]) => (
                          <StrategyCard
                            key={name}
                            summary={strategy.summary}
                            strategyName={name}
                            trades={strategy.trades}
                            ticker={decodedTicker}
                            assetType={assetType}
                            thresholds={strategy.thresholds}
                          />
                        ))}
                      </TabsContent>
                    )}

                    {rsiStrategies.length > 0 && (
                      <TabsContent value="rsi" className="space-y-6">
                        {rsiStrategies.map(([name, strategy]) => (
                          <StrategyCard
                            key={name}
                            summary={strategy.summary}
                            strategyName={name}
                            trades={strategy.trades}
                            ticker={decodedTicker}
                            assetType={assetType}
                            thresholds={strategy.thresholds}
                          />
                        ))}
                      </TabsContent>
                    )}

                    {otherStrategies.length > 0 && (
                      <TabsContent value="other" className="space-y-6">
                        {otherStrategies.map(([name, strategy]) => (
                          <StrategyCard
                            key={name}
                            summary={strategy.summary}
                            strategyName={name}
                            trades={strategy.trades}
                            ticker={decodedTicker}
                            assetType={assetType}
                            thresholds={strategy.thresholds}
                          />
                        ))}
                      </TabsContent>
                    )}
                  </Tabs>
                );
              })()}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AssetDetail;
