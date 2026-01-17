import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ExternalLink, Calendar, Star, Layout, ChevronRight, TrendingUp, TrendingDown, Target, Zap, Clock, Info } from 'lucide-react';
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
import { BacktestSummaryCards } from '@/components/BacktestSummaryCards';
import { TradesTable } from '@/components/TradesTable';
import { TradesChart } from '@/components/TradesChart';
import { ScenarioPredictionForm } from '@/components/ScenarioPredictionForm';
import { ScenarioAggregatedView } from '@/components/ScenarioAggregatedView';
import { PredictionHistory } from '@/components/PredictionHistory';
import { ScenarioPriceMap } from '@/components/ScenarioPriceMap';
import type { AssetType, Timeframe } from '@/hooks/useGoldHandData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AdvancedChart } from '@/components/AdvancedChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useHistoricalData, type Interval } from '@/hooks/useHistoricalData';
import { runBacktest, calculateSummary, type Trade, type BacktestSummary, type StrategyType } from '@/lib/backtest-engine';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [decodedTicker, assetType]);

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

  // --- LOCAL BACKTEST STATE ---
  const [activeStrategy, setActiveStrategy] = useState<StrategyType>('RSI');
  const [rsiParams, setRsiParams] = useState({ buy: 30, sell: 70 });
  const [ghParams, setGhParams] = useState({
    buyColor: 'gold',
    sellColor: 'blue',
    p1: 15,
    p2: 19,
    p3: 25,
    p4: 29
  });
  const [mlParams, setMlParams] = useState({ mult: 3 });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [timeWindowIndices, setTimeWindowIndices] = useState<[number, number]>([0, 0]);

  // Fetch 10y historical data for backtesting
  const { candles, loading: candlesLoading } = useHistoricalData(decodedTicker, assetType, (timeframe === 'weekly' ? '1wk' : '1d') as Interval);

  // Initialize date range once candles load
  useEffect(() => {
    if (candles.length > 0) {
      if (!dateRange.start) {
        setDateRange({
          start: candles[0].time,
          end: candles[candles.length - 1].time
        });
        setTimeWindowIndices([0, candles.length - 1]);
      }
    }
  }, [candles, dateRange.start]);

  // Update dates when indices change
  const handleTimeWindowChange = (indices: [number, number]) => {
    setTimeWindowIndices(indices);
    if (candles[indices[0]] && candles[indices[1]]) {
      setDateRange({
        start: candles[indices[0]].time,
        end: candles[indices[1]].time
      });
    }
  };

  const handleReset = () => {
    setRsiParams({ buy: 30, sell: 70 });
    setGhParams({
      buyColor: 'gold',
      sellColor: 'blue',
      p1: 15,
      p2: 19,
      p3: 25,
      p4: 29
    });
    setMlParams({ mult: 3 });
    if (candles.length > 0) {
      handleTimeWindowChange([0, candles.length - 1]);
    }
  };

  // Filter candles based on selected date range
  const filteredCandles = useMemo(() => {
    return candles.filter(c => c.time >= dateRange.start && c.time <= dateRange.end);
  }, [candles, dateRange]);

  // Run backtest locally for active strategy
  const activeBacktest = useMemo(() => {
    if (filteredCandles.length === 0) return null;

    const result = runBacktest(filteredCandles, activeStrategy, {
      rsiBuy: rsiParams.buy,
      rsiSell: rsiParams.sell,
      ghBuyColor: ghParams.buyColor,
      ghSellColor: ghParams.sellColor,
      mlMult: mlParams.mult,
      ghP1: ghParams.p1,
      ghP2: ghParams.p2,
      ghP3: ghParams.p3,
      ghP4: ghParams.p4
    });

    const mappedTrades = result.trades.map((t, i) => ({ ...t, trade_id: i + 1 }));

    return {
      trades: mappedTrades,
      indicators: result.indicators,
      summary: calculateSummary(result.trades, filteredCandles)
    };
  }, [filteredCandles, activeStrategy, rsiParams, ghParams, mlParams]);

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
                onClick={() => navigate(-1)}
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

            {/* Local Backtesting Section */}
            <div className="space-y-6">
              <div className="flex flex-col gap-6 border-t border-border pt-6 mt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Backtests</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Real-time simulation based on your parameters</p>
                  </div>
                </div>

                {/* TWO-ROW CONTROLS */}
                <div className="flex flex-col gap-4 bg-muted/20 p-6 rounded-2xl border border-border/50">
                  {/* ROW 1: STRATEGY, INTERVAL, RESET */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6 pb-4 border-b border-border/20">
                    <div className="lg:col-span-5">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Algorithm</Label>
                      <div className="flex gap-2">
                        {[
                          { id: 'RSI', label: 'RSI Momentum', icon: Zap },
                          { id: 'GOLDHAND', label: 'GoldHand Logic', icon: Target },
                          { id: 'MONEYLINE', label: 'MoneyLine Trend', icon: Clock },
                        ].map((s) => (
                          <Button
                            key={s.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveStrategy(s.id as StrategyType)}
                            className={cn(
                              "h-9 px-4 rounded-xl transition-all duration-300 group flex items-center gap-2",
                              activeStrategy === s.id
                                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                : "text-muted-foreground hover:bg-muted/40"
                            )}
                          >
                            <s.icon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{s.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-4">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Interval</Label>
                      <div className="flex bg-muted/40 rounded-xl p-1 border border-border/50 w-full max-w-[240px]">
                        <Button
                          variant="ghost" size="sm"
                          className={cn("flex-1 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", timeframe === 'daily' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/20 opacity-70")}
                          onClick={() => setTimeframe('daily')}
                        >
                          Daily
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className={cn("flex-1 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all", timeframe === 'weekly' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/20 opacity-70")}
                          onClick={() => setTimeframe('weekly')}
                        >
                          Weekly
                        </Button>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reset Defaults
                      </Button>
                    </div>
                  </div>

                  {/* ROW 2: PARAMETERS & TIME WINDOW */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                    {/* Dynamic Parameters Selector */}
                    <div className="lg:col-span-6">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          {activeStrategy === 'MONEYLINE' ? 'Trend Sensitivity' : 'Strategy Parameters'}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                                  <Info className="h-3 w-3 text-muted-foreground/60 hover:text-primary transition-colors" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-background/95 backdrop-blur-md border-primary/20 p-3 max-w-xs shadow-2xl">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">
                                    {activeStrategy === 'GOLDHAND' ? 'GoldHand Logic' : activeStrategy === 'MONEYLINE' ? 'MoneyLine Logic' : 'RSI Momentum'}
                                  </p>
                                  <p className="text-[10px] font-medium leading-relaxed text-muted-foreground">
                                    {activeStrategy === 'GOLDHAND' && "The GoldHand strategy uses four Simple Moving Average (SMMA) lines to identify trend strength and potential reversals. The 'Gold' and 'Silver' colors represent specific configurations of these lines, indicating bullish or bearish sentiment. Adjusting the periods (P1-P4) changes the sensitivity of these lines to price action."}
                                    {activeStrategy === 'MONEYLINE' && "The MoneyLine strategy uses an Average True Range (ATR) multiplier to define a dynamic channel around the price. Trades are triggered when the price breaks out of this channel. A higher multiplier creates a wider channel, making the strategy less sensitive to minor price fluctuations."}
                                    {activeStrategy === 'RSI' && "The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements. It oscillates between 0 and 100. Traditionally, RSI readings above 70 indicate overbought conditions, while readings below 30 indicate oversold conditions. These levels can be adjusted to fine-tune the strategy's sensitivity."}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <span className="text-[10px] font-black text-primary">
                          {activeStrategy === 'RSI' && `${rsiParams.buy} - ${rsiParams.sell}`}
                          {activeStrategy === 'GOLDHAND' && `${ghParams.p1}, ${ghParams.p2}, ${ghParams.p3}, ${ghParams.p4}`}
                          {activeStrategy === 'MONEYLINE' && `x${mlParams.mult.toFixed(1)}`}
                        </span>
                      </div>

                      <div className="px-2">
                        {activeStrategy === 'RSI' && (
                          <Slider
                            value={[rsiParams.buy, rsiParams.sell]}
                            min={0} max={100} step={1}
                            onValueChange={([b, s]) => setRsiParams({ buy: b, sell: s })}
                            className="w-full h-8"
                          />
                        )}

                        {activeStrategy === 'GOLDHAND' && (
                          <div className="space-y-6 w-full animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Buy Alignment</Label>
                                <Select value={ghParams.buyColor} onValueChange={(val) => setGhParams(p => ({ ...p, buyColor: val }))}>
                                  <SelectTrigger className="h-8 text-[9px] font-bold uppercase tracking-wider bg-muted/40 border-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gold" className="text-[9px] font-bold uppercase">Gold</SelectItem>
                                    <SelectItem value="silver" className="text-[9px] font-bold uppercase">Silver</SelectItem>
                                    <SelectItem value="blue" className="text-[9px] font-bold uppercase">Blue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Sell Alignment</Label>
                                <Select value={ghParams.sellColor} onValueChange={(val) => setGhParams(p => ({ ...p, sellColor: val }))}>
                                  <SelectTrigger className="h-8 text-[9px] font-bold uppercase tracking-wider bg-muted/40 border-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gold" className="text-[9px] font-bold uppercase">Gold</SelectItem>
                                    <SelectItem value="silver" className="text-[9px] font-bold uppercase">Silver</SelectItem>
                                    <SelectItem value="blue" className="text-[9px] font-bold uppercase">Blue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between text-[8px] font-black opacity-50 uppercase tracking-widest">
                                <span>Periods (v1 - v4)</span>
                                <span>{ghParams.p1}, {ghParams.p2}, {ghParams.p3}, {ghParams.p4}</span>
                              </div>
                              <Slider
                                value={[ghParams.p1, ghParams.p2, ghParams.p3, ghParams.p4]}
                                min={10} max={50} step={1}
                                onValueChange={(vals: number[]) => {
                                  const sorted = [...vals].sort((a, b) => a - b);
                                  setGhParams(prev => ({
                                    ...prev,
                                    p1: sorted[0],
                                    p2: sorted[1],
                                    p3: sorted[2],
                                    p4: sorted[3]
                                  }));
                                }}
                                className="w-full h-10"
                              />
                            </div>
                          </div>
                        )}

                        {activeStrategy === 'MONEYLINE' && (
                          <Slider
                            value={[mlParams.mult]}
                            min={1} max={10} step={0.1}
                            onValueChange={([val]) => setMlParams(p => ({ ...p, mult: val }))}
                            className="w-full h-8"
                          />
                        )}
                      </div>
                    </div>

                    {/* Time Window Slider */}
                    <div className="lg:col-span-6 border-l border-border/50 pl-8">
                      <div className="flex justify-between items-center mb-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Time Window
                        </Label>
                        <span className="text-[10px] font-black text-muted-foreground/80">
                          {dateRange.start ? new Date(dateRange.start).toLocaleDateString('hu-HU') : '...'} - {dateRange.end ? new Date(dateRange.end).toLocaleDateString('hu-HU') : '...'}
                        </span>
                      </div>
                      <div className="h-10 flex items-center px-2 pt-14">
                        <Slider
                          value={timeWindowIndices}
                          min={0}
                          max={Math.max(0, candles.length - 1)}
                          step={1}
                          onValueChange={handleTimeWindowChange as any}
                          className="w-full"
                        />
                      </div>
                      <p className="text-[8px] text-muted-foreground/40 leading-normal italic mt-4 text-center">
                        Select the historical range to simulate the trade performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategy Card Result Section */}
              {/* Dynamic Result Section (Single Column) */}
              <div className="space-y-8 pb-10">
                {activeBacktest ? (
                  <>
                    {/* 1. Summary Cards on Top */}
                    <BacktestSummaryCards
                      summary={activeBacktest.summary}
                      isProfitable={activeBacktest.summary.average_result > 0}
                      holdBeatsStrategy={activeBacktest.summary.hold_result > activeBacktest.summary.cumulative_result}
                    />

                    {/* 2. Integrated Chart in Middle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Strategy Visualization</h3>
                      </div>
                      <TradesChart
                        trades={activeBacktest.trades as any}
                        strategyName={activeStrategy === 'RSI' ? 'RSI_Strategy' : activeStrategy}
                        ticker={decodedTicker}
                        assetType={assetType}
                        interval={(timeframe === 'weekly' ? '1wk' : '1d') as any}
                        indicators={activeBacktest.indicators}
                        candles={filteredCandles}
                        rsiParams={rsiParams}
                      />
                    </div>

                    {/* 3. Trades Table at Bottom */}
                    <TradesTable trades={activeBacktest.trades as any} showLatest={100} />
                  </>
                ) : (
                  <div className="h-[400px] flex items-center justify-center border-2 border-dashed border-border/30 rounded-2xl bg-card/10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{candlesLoading ? 'Analyzing historical data...' : 'Adjust parameters to see results'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AssetDetail;
