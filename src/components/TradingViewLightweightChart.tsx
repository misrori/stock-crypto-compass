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
    interval?: '1d' | '1wk';
    candles?: any[]; // Pass pre-fetched candles
    rsiParams?: { buy: number; sell: number };
    indicators?: {
        rsi?: (number | null)[];
        gh?: {
            v1: (number | null)[];
            v2: (number | null)[];
            v3: (number | null)[];
            v4: (number | null)[];
            v1_color?: string;
            v4_color?: string;
        };
        ml?: { val: number; dir: number }[];
    };
}

interface OHLCDataPoint {
    time: string | number; // Support both string (YYYY-MM-DD) and Unix timestamp
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export const TradingViewLightweightChart = ({
    ticker,
    assetType,
    trades,
    strategyName,
    height = 500,
    interval = '1d',
    indicators,
    candles = [],
    rsiParams = { buy: 30, sell: 70 },
}: TradingViewLightweightChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const rsiContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const rsiChartRef = useRef<IChartApi | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const tradeBoxSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Use candles directly to ensure alignment with indicators
    const ohlcData = candles;

    // Initialize chart and add OHLC data
    useEffect(() => {
        if (!chartContainerRef.current || ohlcData.length === 0) return;

        const isSplit = strategyName.toUpperCase().includes('RSI');
        const totalHeight = isSplit ? 850 : height;
        const mainHeight = isSplit ? totalHeight * 0.65 : totalHeight;
        const rsiHeight = isSplit ? totalHeight * 0.35 : 0;

        // Common options
        const commonOptions = {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#d1d4dc',
                fontSize: 10,
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.2)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.2)' },
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.1)',
                minimumWidth: 65,
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.1)',
            },
        };

        // Create main chart
        const chart = createChart(chartContainerRef.current, {
            ...commonOptions,
            width: chartContainerRef.current.clientWidth,
            height: mainHeight,
            timeScale: {
                ...commonOptions.timeScale,
                timeVisible: false, // Don't show time for daily/weekly
                secondsVisible: false,
                shiftVisibleRangeOnNewBar: true,
                rightOffset: 12,
                barSpacing: interval === '1wk' ? 12 : 6,
                minBarSpacing: 0.5,
            },
            crosshair: {
                mode: CrosshairMode.Normal,
            },
        });

        chartRef.current = chart;

        let rsiChart: IChartApi | null = null;
        if (isSplit && rsiContainerRef.current) {
            rsiChart = createChart(rsiContainerRef.current, {
                ...commonOptions,
                width: rsiContainerRef.current.clientWidth,
                height: rsiHeight,
                timeScale: {
                    ...commonOptions.timeScale,
                    visible: false, // Hidden for sync
                },
                crosshair: {
                    mode: CrosshairMode.Normal,
                },
                leftPriceScale: {
                    visible: true,
                    borderColor: 'rgba(197, 203, 206, 0.1)',
                },
            });
            rsiChartRef.current = rsiChart;
        }

        // Add volume series
        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '', // overlay
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        const volumes = ohlcData.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)'
        }));
        volumeSeries.setData(volumes as any);

        // Add candlestickseries
        const candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        candleSeriesRef.current = candleSeries;
        candleSeries.setData(ohlcData as any);

        // Add trade box series (Enhanced rectangles)
        const tradeBoxSeries = chart.addCandlestickSeries({
            upColor: 'rgba(16, 185, 129, 0.15)',
            downColor: 'rgba(239, 68, 68, 0.15)',
            borderVisible: false,
            wickVisible: false,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        tradeBoxSeriesRef.current = tradeBoxSeries;

        // --- INDICATORS RENDERING ---
        if (indicators) {
            const sn = strategyName.toUpperCase();
            if ((sn === 'RSI' || sn === 'RSI_STRATEGY') && indicators.rsi) {
                const targetChart = rsiChart || chart;
                const rsiSeries = targetChart.addLineSeries({
                    color: '#BA68C8', // Vibrant purple
                    lineWidth: 3,
                    priceScaleId: isSplit ? 'left' : 'left',
                });
                rsiSeriesRef.current = rsiSeries;
                const rsiData = ohlcData.map((d, i) => ({
                    time: d.time,
                    value: indicators.rsi![i] ?? undefined
                })).filter(d => d.value !== undefined);
                rsiSeries.setData(rsiData as any);

                // Add Stronger RSI limits
                [rsiParams.buy, rsiParams.sell].forEach(level => {
                    rsiSeries.createPriceLine({
                        price: level,
                        color: 'rgba(255, 255, 255, 0.4)',
                        lineWidth: 2,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: level === rsiParams.buy ? 'BUY' : 'SELL',
                    });
                });

                // Highlight Crossing Points (Dots)
                const crossingMarkers: any[] = [];
                for (let i = 1; i < indicators.rsi.length; i++) {
                    const prev = indicators.rsi[i - 1];
                    const curr = indicators.rsi[i];
                    if (prev === null || curr === null) continue;

                    // Cross buy level
                    if ((prev > rsiParams.buy && curr <= rsiParams.buy) || (prev < rsiParams.buy && curr >= rsiParams.buy)) {
                        crossingMarkers.push({
                            time: ohlcData[i].time,
                            position: 'inBar',
                            color: '#10b981',
                            shape: 'circle',
                            size: 1,
                        });
                    }
                    // Cross sell level
                    if ((prev < rsiParams.sell && curr >= rsiParams.sell) || (prev > rsiParams.sell && curr <= rsiParams.sell)) {
                        crossingMarkers.push({
                            time: ohlcData[i].time,
                            position: 'inBar',
                            color: '#ef4444',
                            shape: 'circle',
                            size: 1,
                        });
                    }
                }

                // Add Trade Markers to RSI too
                if (trades && trades.length > 0) {
                    trades.forEach(trade => {
                        crossingMarkers.push({
                            time: trade.buy_date,
                            position: 'belowBar',
                            color: '#10b981',
                            shape: 'arrowUp',
                            size: 2,
                        });
                        if (trade.sell_date) {
                            crossingMarkers.push({
                                time: trade.sell_date,
                                position: 'aboveBar',
                                color: '#ef4444',
                                shape: 'arrowDown',
                                size: 2,
                            });
                        }
                    });
                }
                rsiSeries.setMarkers(crossingMarkers.sort((a, b) => (a.time > b.time ? 1 : -1)));
            }

            if (sn === 'GOLDHAND' && indicators.gh) {
                const getGHStyle = (i: number) => {
                    const v1 = indicators.gh!.v1[i];
                    const v2 = indicators.gh!.v2[i];
                    const v3 = indicators.gh!.v3[i];
                    const v4 = indicators.gh!.v4[i];

                    if (v1 === null || v2 === null || v3 === null || v4 === null) {
                        return { line: '#999', fill: 'rgba(200, 200, 200, 0.1)' };
                    }

                    const bullish = (v1 > v2) && (v2 > v3) && (v3 > v4);
                    const bearish = (v1 < v2) && (v2 < v3) && (v3 < v4);

                    if (bullish) return { line: '#F57F17', fill: 'rgba(255, 192, 0, 0.2)' };
                    if (bearish) return { line: '#1565C0', fill: 'rgba(21, 101, 192, 0.2)' };
                    return { line: '#999', fill: 'rgba(200, 200, 200, 0.1)' };
                };

                // Add lines (v1 and v4 only, but colored dynamically)
                const series1 = chart.addLineSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
                const series4 = chart.addLineSeries({ lineWidth: 2, priceLineVisible: false, lastValueVisible: false });

                series1.setData(ohlcData.map((d, i) => ({
                    time: d.time,
                    value: indicators.gh!.v1[i] ?? undefined,
                    color: getGHStyle(i).line
                })).filter(d => d.value !== undefined) as any);

                series4.setData(ohlcData.map((d, i) => ({
                    time: d.time,
                    value: indicators.gh!.v4[i] ?? undefined,
                    color: getGHStyle(i).line
                })).filter(d => d.value !== undefined) as any);

                // Add Fill (Shaded Area between v1 and v4)
                const fillSeries = chart.addBarSeries({
                    thinBars: false,
                    openVisible: false,
                    priceLineVisible: false,
                    lastValueVisible: false,
                });

                const fillData = ohlcData.map((d, i) => {
                    const v1 = indicators.gh!.v1[i];
                    const v4 = indicators.gh!.v4[i];
                    if (v1 === null || v4 === null) return null;
                    return {
                        time: d.time,
                        open: v1,
                        high: Math.max(v1, v4),
                        low: Math.min(v1, v4),
                        close: v4,
                        color: getGHStyle(i).fill
                    };
                }).filter(d => d !== null);
                fillSeries.setData(fillData as any);
            }

            if (sn === 'MONEYLINE' && indicators.ml) {
                const mlSeries = chart.addLineSeries({
                    lineWidth: 3,
                    priceLineVisible: false,
                    lastValueVisible: false,
                });

                mlSeries.setData(ohlcData.map((d, i) => {
                    const val = indicators.ml![i];
                    const isBullish = val?.dir === 1;
                    let segmentColor = isBullish ? '#2e7d32' : '#c62828';

                    if (i < indicators.ml!.length - 1) {
                        const next = indicators.ml![i + 1];
                        if (next && val && next.dir !== val.dir) {
                            segmentColor = 'transparent';
                        }
                    }

                    return {
                        time: d.time,
                        value: val ? val.val : undefined,
                        color: segmentColor
                    };
                }).filter(d => d.value !== undefined) as any);

                // Add MoneyLine Fill (Cloud)
                const mlFillSeries = chart.addBarSeries({
                    thinBars: false,
                    openVisible: false,
                    priceLineVisible: false,
                    lastValueVisible: false,
                });
                const mlFillData = ohlcData.map((d, i) => {
                    const ml = indicators.ml![i];
                    if (!ml) return null;
                    const isBullish = ml.dir === 1;
                    return {
                        time: d.time,
                        open: ml.val,
                        high: Math.max(ml.val, d.close),
                        low: Math.min(ml.val, d.close),
                        close: d.close,
                        color: isBullish ? 'rgba(46, 125, 50, 0.15)' : 'rgba(198, 40, 40, 0.15)'
                    };
                }).filter(d => d !== null);
                mlFillSeries.setData(mlFillData as any);
            }
        }


        // Add trade markers and box data
        if (trades && trades.length > 0) {
            const markerMap = new Map<string, any>();
            const boxData: any[] = [];

            // Function to find the nearest candle time for a given timestamp
            const findNearestCandleTime = (timestamp: number) => {
                const candleTimes = ohlcData.map(c => c.time as number);
                if (candleTimes.length === 0) return null;

                const exactMatch = candleTimes.find(t => t === timestamp);
                if (exactMatch) return exactMatch;

                const nextCandle = candleTimes.find(t => t >= timestamp);
                return nextCandle || null;
            };

            trades.forEach((trade) => {
                const isProfit = trade.result >= 1;
                const markerColor = isProfit ? '#10b981' : '#ef4444';
                const buyTimestamp = trade.buy_date; // Using string date directly

                if (buyTimestamp) {
                    const buyKey = `${buyTimestamp}_buy`;
                    if (!markerMap.has(buyKey)) {
                        markerMap.set(buyKey, {
                            time: buyTimestamp,
                            position: 'belowBar',
                            color: '#10b981', // Always green for buy
                            shape: 'arrowUp',
                            text: 'BUY',
                            size: 2,
                        });
                    }
                }

                if (trade.sell_date) {
                    const sellTimestamp = trade.sell_date;

                    if (sellTimestamp) {
                        const sellKey = `${sellTimestamp}_sell`;
                        if (!markerMap.has(sellKey)) {
                            markerMap.set(sellKey, {
                                time: sellTimestamp,
                                position: 'aboveBar',
                                color: '#ef4444', // Always red for sell
                                shape: 'arrowDown',
                                text: 'SELL',
                                size: 2,
                            });
                        }
                    }
                }
            });

            const markers = Array.from(markerMap.values()).sort((a, b) => a.time - b.time);

            // Generate box data for each OHLC candle
            ohlcData.forEach((candle) => {
                const candleTime = candle.time as string;
                const activeTrade = trades.find((t) => {
                    return candleTime >= t.buy_date && (!t.sell_date || candleTime <= t.sell_date);
                });

                if (activeTrade) {
                    const isProfit = activeTrade.result >= 1;
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

        // SYNC Clocks (Refined)
        if (chart && rsiChart && candleSeries && rsiSeriesRef.current) {
            const syncCharts = [
                { chart: chart, series: candleSeries },
                { chart: rsiChart, series: rsiSeriesRef.current }
            ];

            syncCharts.forEach(c => {
                c.chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
                    if (range) {
                        syncCharts.forEach(other => {
                            if (other.chart !== c.chart) other.chart.timeScale().setVisibleLogicalRange(range);
                        });
                    }
                });

                c.chart.subscribeCrosshairMove(param => {
                    if (!param.time || param.point === undefined) {
                        syncCharts.forEach(other => {
                            if (other.chart !== c.chart) other.chart.clearCrosshairPosition();
                        });
                    } else {
                        syncCharts.forEach(other => {
                            if (other.chart !== c.chart && other.series) {
                                other.chart.setCrosshairPosition(0, param.time!, other.series);
                            }
                        });
                    }
                });
            });
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

            const candleTime = param.time as string;
            const activeTrade = trades.find((t) => {
                return candleTime >= t.buy_date && (!t.sell_date || candleTime <= t.sell_date);
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
            if (rsiContainerRef.current && rsiChart) {
                rsiChart.applyOptions({ width: rsiContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            if (rsiChart) rsiChart.remove();
        };
    }, [ohlcData, trades, height, indicators, strategyName, interval]);


    const isSplit = strategyName.toUpperCase().includes('RSI');
    const totalHeight = isSplit ? 850 : height;
    const mainHeight = isSplit ? totalHeight * 0.65 : totalHeight;
    const rsiHeight = isSplit ? totalHeight * 0.35 : 0;

    const logoStyle = {
        backgroundImage: "url('https://i.ibb.co/TMdGbqfK/hattergh.png')",
        backgroundRepeat: 'no-repeat' as const,
        backgroundPosition: 'center center',
        backgroundSize: '300px'
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="relative w-full rounded-2xl overflow-hidden bg-card/30 border border-border/50">
                <div
                    ref={chartContainerRef}
                    className="w-full"
                    style={{
                        height: `${mainHeight}px`,
                        ...logoStyle
                    }}
                />
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'absolute',
                        display: 'none',
                        padding: '12px',
                        boxSizing: 'border-box',
                        border: '1px solid',
                        borderRadius: '12px',
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

            {isSplit && (
                <div className="relative w-full rounded-2xl overflow-hidden bg-card/30 border border-border/50">
                    <div
                        ref={rsiContainerRef}
                        className="w-full"
                        style={{
                            height: `${rsiHeight}px`,
                            ...logoStyle
                        }}
                    />
                </div>
            )}
        </div>
    );
};
