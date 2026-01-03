import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAssetDetail, type IntervalData } from '@/hooks/useAssetDetail';
import { GoldHandStatusCard } from '@/components/GoldHandStatusCard';
import { IndicatorsCard } from '@/components/IndicatorsCard';
import { StrategyCard } from '@/components/StrategyCard';
import { TradesTable } from '@/components/TradesTable';
import type { AssetType, Timeframe } from '@/hooks/useGoldHandData';

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
  
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  
  const assetType = (type || 'stocks') as AssetType;
  const decodedTicker = ticker ? decodeURIComponent(ticker) : '';
  
  const { data, loading, error, refetch } = useAssetDetail(decodedTicker, assetType);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Load TradingView widget
  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView && chartContainerRef.current) {
        const symbol = getTradingViewSymbol(decodedTicker, assetType);
        new window.TradingView.widget({
          container_id: chartContainerRef.current.id,
          symbol: symbol,
          interval: timeframe === 'daily' ? 'D' : 'W',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0a0a0a',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          autosize: true,
          height: 500,
          studies: ['RSI@tv-basicstudies'],
        });
      }
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [data, decodedTicker, assetType, timeframe]);

  const getTradingViewSymbol = (ticker: string, assetType: AssetType): string => {
    if (assetType === 'crypto') {
      const cleanTicker = ticker.replace('-USD', '').replace('_USD', '').replace('USD', '');
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
      };
      return commodityMap[ticker] || `TVC:${ticker.replace('=F', '')}`;
    }
    return `NASDAQ:${ticker}`;
  };

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
                <h1 className="text-2xl font-bold text-foreground">{decodedTicker}</h1>
                <p className="text-sm text-muted-foreground capitalize">
                  {assetType} • {data?.is_crypto ? 'Cryptocurrency' : 'Traditional Asset'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a
                href={`https://www.tradingview.com/chart/?symbol=${getTradingViewSymbol(decodedTicker, assetType)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Open in TradingView
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
            {/* Timeframe selector */}
            <div className="flex items-center justify-between">
              <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
                <TabsList className="bg-card/50 border border-border">
                  <TabsTrigger 
                    value="daily" 
                    className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Calendar className="h-4 w-4" />
                    Daily
                  </TabsTrigger>
                  <TabsTrigger 
                    value="weekly"
                    disabled={!data.intervals.weekly}
                    className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Calendar className="h-4 w-4" />
                    Weekly
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <p className="text-sm text-muted-foreground">
                Data: {currentIntervalData.date_range.start} - {currentIntervalData.date_range.end}
              </p>
            </div>

            {/* TradingView Chart */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
              <div 
                id="tradingview-widget"
                ref={chartContainerRef}
                className="w-full h-[500px]"
              />
            </div>

            {/* Gold Hand Status and Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoldHandStatusCard data={currentIntervalData} ticker={decodedTicker} />
              <IndicatorsCard data={currentIntervalData} />
            </div>

            {/* Strategies */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Strategy Backtests</h2>
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(currentIntervalData.strategies).map(([name, strategy]) => (
                  <StrategyCard key={name} summary={strategy.summary} strategyName={name} />
                ))}
              </div>
            </div>

            {/* Trade History */}
            {currentIntervalData.strategies.goldhand_line?.trades && (
              <TradesTable trades={currentIntervalData.strategies.goldhand_line.trades} showLatest={30} />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AssetDetail;
