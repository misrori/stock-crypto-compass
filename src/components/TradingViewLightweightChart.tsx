import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import type { StrategyTrade } from '@/hooks/useAssetDetail';
import type { AssetType } from '@/hooks/useGoldHandData';

interface TradingViewLightweightChartProps {
    ticker: string;
    assetType: AssetType;
    trades: StrategyTrade[];
    strategyName: string;
    height?: number;
}

interface OHLCDataPoint {
    time: number; // Unix timestamp in seconds
    open: number;
    high: number;
    low: number;
    close: number;
}

export const TradingViewLightweightChart = ({
    ticker,
    assetType,
    trades,
    strategyName,
    height = 500,
}: TradingViewLightweightChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ohlcData, setOhlcData] = useState<OHLCDataPoint[]>([]);

    // Fetch OHLC data from Yahoo Finance
    useEffect(() => {
        const fetchOHLCData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Construct Yahoo Finance symbol
                let yahooTicker = ticker;
                if (assetType === 'crypto') {
                    // Convert crypto tickers: BTC-USD is already correct format for Yahoo
                    yahooTicker = ticker.includes('-USD') ? ticker : `${ticker}-USD`;
                } else if (assetType === 'commodities') {
                    // Commodities already have =F suffix
                    yahooTicker = ticker;
                }

                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=5y`;
                const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(yahooUrl);

                const response = await fetch(proxyUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.status}`);
                }

                const data = await response.json();
                const result = data.chart.result[0];
                const quote = result.indicators.quote[0];
                const timestamps = result.timestamp;

                const candles: OHLCDataPoint[] = [];
                for (let i = 0; i < timestamps.length; i++) {
                    // Skip null values (holidays/weekends)
                    if (quote.open[i] === null) continue;

                    candles.push({
                        time: timestamps[i],
                        open: quote.open[i],
                        high: quote.high[i],
                        low: quote.low[i],
                        close: quote.close[i],
                    });
                }

                setOhlcData(candles);
            } catch (err) {
                console.error('Error fetching OHLC data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch price data');
            } finally {
                setLoading(false);
            }
        };

        fetchOHLCData();
    }, [ticker, assetType]);

    // Initialize chart and add OHLC data
    useEffect(() => {
        if (!chartContainerRef.current || ohlcData.length === 0) return;

        // Create chart
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: 'transparent' },
                textColor: '#a1a1aa',
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            grid: {
                vertLines: { color: 'rgba(161, 161, 170, 0.1)' },
                horzLines: { color: 'rgba(161, 161, 170, 0.1)' },
            },
            timeScale: {
                borderColor: 'rgba(161, 161, 170, 0.2)',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: 'rgba(161, 161, 170, 0.2)',
            },
        });

        chartRef.current = chart;

        // Add candlestickseries
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        candleSeriesRef.current = candleSeries;
        candleSeries.setData(ohlcData as any); // Type cast for Time compatibility

        // Add trade markers
        if (trades && trades.length > 0) {
            const markers: any[] = [];

            trades.forEach((trade) => {
                const isProfit = trade.result >= 1;
                const buyTimestamp = new Date(trade.buy_date).getTime() / 1000;

                // Buy marker
                markers.push({
                    time: buyTimestamp,
                    position: 'belowBar',
                    color: isProfit ? '#10b981' : '#ef4444',
                    shape: 'arrowUp',
                    text: 'B',
                });

                // Sell marker (if closed)
                if (trade.status === 'closed' && trade.sell_date) {
                    const sellTimestamp = new Date(trade.sell_date).getTime() / 1000;
                    const resultPercent = ((trade.result - 1) * 100).toFixed(2);

                    markers.push({
                        time: sellTimestamp,
                        position: 'aboveBar',
                        color: isProfit ? '#10b981' : '#ef4444',
                        shape: 'arrowDown',
                        text: `${isProfit ? '+' : ''}${resultPercent}%`,
                    });
                }
            });

            candleSeries.setMarkers(markers);
        }

        // Fit content
        chart.timeScale().fitContent();

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [ohlcData, trades, height]);

    if (loading) {
        return (
            <div className="flex items-center justify-center bg-muted/20 rounded-lg" style={{ height: `${height}px` }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading price data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center bg-destructive/10 rounded-lg" style={{ height: `${height}px` }}>
                <div className="text-center">
                    <p className="text-destructive mb-2">Error loading price data</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden bg-card/30" />
    );
};
