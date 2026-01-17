import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle, ColorType, CrosshairMode } from 'lightweight-charts';
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
    const tradeBoxSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

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

                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=max`;
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
            crosshair: {
                mode: CrosshairMode.Normal,
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
        candleSeries.setData(ohlcData as any);

        // Add trade box series
        const tradeBoxSeries = chart.addCandlestickSeries({
            upColor: 'rgba(16, 185, 129, 0.2)',
            downColor: 'rgba(239, 68, 68, 0.2)',
            borderVisible: false,
            wickVisible: false,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        tradeBoxSeriesRef.current = tradeBoxSeries;


        // Add trade markers and box data
        if (trades && trades.length > 0) {
            const markerMap = new Map<string, any>();
            const boxData: any[] = [];

            // Function to find the nearest candle time for a given timestamp
            const findNearestCandleTime = (timestamp: number) => {
                const candleTimes = ohlcData.map(c => c.time as number);
                if (candleTimes.length === 0) return null;

                // For markers, we want to find the exact candle or the one immediately following the trade date
                // especially for weekly/daily alignment
                const exactMatch = candleTimes.find(t => t === timestamp);
                if (exactMatch) return exactMatch;

                // Find the first candle that is >= our timestamp
                const nextCandle = candleTimes.find(t => t >= timestamp);
                return nextCandle || null;
            };

            trades.forEach((trade) => {
                const isProfit = trade.result >= 1;
                const markerColor = isProfit ? '#10b981' : '#ef4444';
                const rawBuyTimestamp = new Date(trade.buy_date).getTime() / 1000;
                const buyTimestamp = findNearestCandleTime(rawBuyTimestamp);

                if (buyTimestamp) {
                    const buyKey = `${buyTimestamp}_buy`;

                    // Buy marker (Deduplicated)
                    if (!markerMap.has(buyKey)) {
                        markerMap.set(buyKey, {
                            time: buyTimestamp,
                            position: 'belowBar',
                            color: markerColor,
                            shape: 'arrowUp',
                            text: 'BUY',
                        });
                    }
                }

                // Sell marker (if closed, Deduplicated)
                // We check for sell_date existence rather than 'closed' status to be robust
                // This matches the logic used for rendering the trade boxes
                if (trade.sell_date) {
                    const rawSellTimestamp = new Date(trade.sell_date).getTime() / 1000;
                    const sellTimestamp = findNearestCandleTime(rawSellTimestamp);

                    if (sellTimestamp) {
                        const sellKey = `${sellTimestamp}_sell`;

                        if (!markerMap.has(sellKey)) {
                            markerMap.set(sellKey, {
                                time: sellTimestamp,
                                position: 'aboveBar',
                                color: markerColor,
                                shape: 'arrowDown',
                                text: 'SELL',
                            });
                        }
                    }
                }
            });

            const markers = Array.from(markerMap.values()).sort((a, b) => a.time - b.time);

            // Generate box data for each OHLC candle
            ohlcData.forEach((candle) => {
                const candleTime = candle.time as number;
                // Find the active trade for this candle
                const activeTrade = trades.find((t) => {
                    const buyT = new Date(t.buy_date).getTime() / 1000;
                    const sellT = t.sell_date ? new Date(t.sell_date).getTime() / 1000 : Infinity;
                    return candleTime >= buyT && candleTime <= sellT;
                });

                if (activeTrade) {
                    boxData.push({
                        time: candleTime,
                        open: activeTrade.buy_price,
                        close: activeTrade.sell_price || candle.close,
                        high: Math.max(activeTrade.buy_price, activeTrade.sell_price || candle.close),
                        low: Math.min(activeTrade.buy_price, activeTrade.sell_price || candle.close),
                    });
                }
            });

            candleSeries.setMarkers(markers);
            tradeBoxSeries.setData(boxData);
        }

        // Tooltip handling
        chart.subscribeCrosshairMove((param) => {
            if (!tooltipRef.current || !chartContainerRef.current) return;

            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > height
            ) {
                tooltipRef.current.style.display = 'none';
                return;
            }

            const candleTime = param.time as number;
            const activeTrade = trades.find((t) => {
                const buyT = new Date(t.buy_date).getTime() / 1000;
                const sellT = t.sell_date ? new Date(t.sell_date).getTime() / 1000 : Infinity;
                return candleTime >= buyT && candleTime <= sellT;
            });

            if (activeTrade) {
                const isProfit = activeTrade.result >= 1;
                const profitPct = ((activeTrade.result - 1) * 100).toFixed(2);

                tooltipRef.current.style.display = 'block';
                tooltipRef.current.style.left = `${param.point.x + 15}px`;
                tooltipRef.current.style.top = `${param.point.y + 15}px`;
                tooltipRef.current.style.borderColor = isProfit ? '#10b981' : '#ef4444';

                tooltipRef.current.innerHTML = `
                    <div style="font-weight: 800; font-size: 12px; margin-bottom: 4px; color: ${isProfit ? '#10b981' : '#ef4444'}">
                        ${isProfit ? 'PROFITABLE TRADE' : 'LOSING TRADE'}
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 11px; margin-bottom: 2px;">
                        <span>Profit:</span>
                        <span style="font-weight: 700; color: ${isProfit ? '#10b981' : '#ef4444'}">${isProfit ? '+' : ''}${profitPct}%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 11px; margin-bottom: 2px;">
                        <span>Entry:</span>
                        <span style="font-weight: 600;">${activeTrade.buy_price.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 11px; margin-bottom: 2px;">
                        <span>Exit:</span>
                        <span style="font-weight: 600;">${activeTrade.sell_price?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 11px;">
                        <span>Duration:</span>
                        <span style="font-weight: 600;">${activeTrade.days_in_trade} days</span>
                    </div>
                `;
            } else {
                tooltipRef.current.style.display = 'none';
            }
        });

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
        <div className="relative w-full rounded-lg overflow-hidden bg-card/30">
            <div ref={chartContainerRef} className="w-full" />
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    display: 'none',
                    padding: '12px',
                    boxSizing: 'border-box',
                    border: '1px solid',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    color: '#e4e4e7',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    minWidth: '180px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}
            />
        </div>
    );
};
