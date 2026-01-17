import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, LineStyle, CrosshairMode, ColorType, type IChartApi, type ISeriesApi, type SeriesType } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedChartProps {
    symbol: string;
    assetType: 'stocks' | 'crypto' | 'commodities';
    height?: number;
}

type TimeInterval = '1d' | '1wk';

// --- MATH UTILS ---
const calculateSMA = (data: any[], period: number) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) { result.push({ time: data[i].time, value: NaN }); continue; }
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close;
        result.push({ time: data[i].time, value: sum / period });
    }
    return result;
};

const calculateEMA = (data: any[], period: number) => {
    const result = [];
    const k = 2 / (period + 1);

    if (data.length < period) return [];

    // Calculate initial SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i].close;
        if (i < period - 1) result.push({ time: data[i].time, value: NaN });
    }

    let prevEma = sum / period;
    result.push({ time: data[period - 1].time, value: prevEma });

    // Calculate EMA
    for (let i = period; i < data.length; i++) {
        const val = data[i].close;
        const ema = (val - prevEma) * k + prevEma;
        result.push({ time: data[i].time, value: ema });
        prevEma = ema;
    }
    return result;
};

const calculateRSI = (data: any[], period = 14) => {
    const result = [];
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        if (i <= period) {
            avgGain += gain; avgLoss += loss;
            if (i === period) {
                avgGain /= period; avgLoss /= period;
                result.push({ time: data[i].time, value: 100 - 100 / (1 + (avgGain / (avgLoss || 1))) });
            } else { result.push({ time: data[i].time, value: NaN }); }
        } else {
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            result.push({ time: data[i].time, value: 100 - 100 / (1 + (avgGain / (avgLoss || 1))) });
        }
    }
    return result;
};

const calculateMACD = (data: any[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const getEMA = (values: number[], period: number) => {
        const result = new Array(values.length).fill(NaN);
        let firstValidIdx = -1;
        for (let i = 0; i < values.length; i++) { if (!isNaN(values[i])) { firstValidIdx = i; break; } }
        if (firstValidIdx === -1 || values.length - firstValidIdx < period) return result;

        let sum = 0;
        for (let i = firstValidIdx; i < firstValidIdx + period; i++) sum += values[i];
        let ema = sum / period;
        result[firstValidIdx + period - 1] = ema;

        const k = 2 / (period + 1);
        for (let i = firstValidIdx + period; i < values.length; i++) {
            if (isNaN(values[i])) { result[i] = NaN; }
            else { ema = (values[i] - ema) * k + ema; result[i] = ema; }
        }
        return result;
    };

    const closes = data.map(d => d.close);
    const fastEMA = getEMA(closes, fastPeriod);
    const slowEMA = getEMA(closes, slowPeriod);
    const macdLine: number[] = [];
    const macdSeriesData = [];
    const signalSeriesData = [];
    const histSeriesData = [];

    for (let i = 0; i < data.length; i++) {
        let val = NaN;
        if (!isNaN(fastEMA[i]) && !isNaN(slowEMA[i])) { val = fastEMA[i] - slowEMA[i]; }
        macdLine.push(val);
    }

    const signalLine = getEMA(macdLine, signalPeriod);

    for (let i = 0; i < data.length; i++) {
        const time = data[i].time;
        const macd = macdLine[i];
        const sig = signalLine[i];
        let hist = NaN;
        let histColor = '#26a69a';

        if (!isNaN(macd) && !isNaN(sig)) {
            hist = macd - sig;
            histColor = hist >= 0 ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
        }
        macdSeriesData.push({ time, value: macd });
        signalSeriesData.push({ time, value: sig });
        histSeriesData.push({ time, value: hist, color: histColor });
    }
    return { macdSeriesData, signalSeriesData, histSeriesData };
};

const calculateSMMA = (values: number[], length: number) => {
    const smma = new Array(values.length).fill(NaN);
    let sum = 0;
    for (let i = 0; i < length; i++) sum += values[i];
    smma[length - 1] = sum / length;
    for (let i = length; i < values.length; i++) {
        smma[i] = (smma[i - 1] * (length - 1) + values[i]) / length;
    }
    return smma;
};

const calculateATR = (data: any[], period: number) => {
    const atr = [];
    let sumTR = 0;
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            atr.push(NaN);
            continue;
        }
        const tr = Math.max(
            data[i].high - data[i].low,
            Math.abs(data[i].high - data[i - 1].close),
            Math.abs(data[i].low - data[i - 1].close)
        );
        if (i < period) {
            sumTR += tr;
            atr.push(NaN);
        } else if (i === period) {
            sumTR += tr;
            atr.push(sumTR / period);
        } else {
            atr.push((atr[i - 1] * (period - 1) + tr) / period);
        }
    }
    return atr;
};

const calculateMoneyline = (data: any[], period = 14, mult = 3.0, stepFactor = 0.6) => {
    const atr = calculateATR(data, period);
    const lineData: any[] = [];
    const fillData: any[] = [];
    const markers: any[] = [];

    let trendDir = 1;
    let trendLine = data[0] ? data[0].close : 0;
    const results: any[] = [];

    for (let i = 0; i < data.length; i++) {
        const close = data[i].close;
        const currentAtr = atr[i];

        if (isNaN(currentAtr)) {
            results.push({ val: NaN, dir: trendDir });
            continue;
        }

        const longStop = close - (currentAtr * mult);
        const shortStop = close + (currentAtr * mult);
        const prevTrendLine = i > 0 && !isNaN(results[i - 1].val) ? results[i - 1].val : close;

        if (trendDir === 1) { // BULLISH
            if (close < prevTrendLine) {
                trendDir = -1;
                trendLine = shortStop;
            } else {
                const potentialRise = Math.max(longStop, prevTrendLine);
                if (potentialRise > prevTrendLine) {
                    trendLine = prevTrendLine + (potentialRise - prevTrendLine) * stepFactor;
                } else {
                    trendLine = prevTrendLine;
                }
            }
        } else { // BEARISH
            if (close > prevTrendLine) {
                trendDir = 1;
                trendLine = longStop;
            } else {
                const potentialDrop = Math.min(shortStop, prevTrendLine);
                if (potentialDrop < prevTrendLine) {
                    trendLine = prevTrendLine - (prevTrendLine - potentialDrop) * stepFactor;
                } else {
                    trendLine = prevTrendLine;
                }
            }
        }
        results.push({ val: trendLine, dir: trendDir });
    }

    for (let i = 0; i < data.length; i++) {
        const current = results[i];
        const isBullish = current.dir === 1;
        let segmentColor = isBullish ? '#2e7d32' : '#c62828';

        if (i < results.length - 1) {
            const next = results[i + 1];
            if (next.dir !== current.dir) {
                segmentColor = 'transparent';
            }
        }

        lineData.push({
            time: data[i].time,
            value: current.val,
            color: segmentColor
        });

        fillData.push({
            time: data[i].time,
            open: current.val,
            high: Math.max(current.val, data[i].close),
            low: Math.min(current.val, data[i].close),
            close: data[i].close,
            color: isBullish ? 'rgba(46, 125, 50, 0.15)' : 'rgba(198, 40, 40, 0.15)'
        });

        if (i > 0 && !isNaN(results[i - 1].val) && current.dir !== results[i - 1].dir) {
            markers.push({
                time: data[i].time,
                position: isBullish ? 'belowBar' : 'aboveBar',
                color: isBullish ? '#2e7d32' : '#c62828',
                shape: isBullish ? 'arrowUp' : 'arrowDown',
                text: isBullish ? 'BULLISH' : 'BEARISH'
            });
        }
    }
    return { lineData, fillData, markers };
};

const calculateGoldhand = (candles: any[]) => {
    const hl2 = candles.map(c => (c.high + c.low) / 2);
    const v1 = calculateSMMA(hl2, 15);
    const v2 = calculateSMMA(hl2, 19);
    const v3 = calculateSMMA(hl2, 25);
    const v4 = calculateSMMA(hl2, 29);

    const line1Data = []; const line2Data = []; const fillData = [];

    for (let i = 0; i < candles.length; i++) {
        if (isNaN(v4[i])) continue;
        const val1 = v1[i]; const val2 = v2[i]; const val3 = v3[i]; const val4 = v4[i];
        const bullish = (val1 > val2) && (val2 > val3) && (val3 > val4);
        const bearish = (val1 < val2) && (val2 < val3) && (val3 < val4);

        let lineColor = '#999'; let fillColor = 'rgba(200, 200, 200, 0.1)';
        if (bullish) { lineColor = '#F57F17'; fillColor = 'rgba(255, 192, 0, 0.2)'; }
        if (bearish) { lineColor = '#1565C0'; fillColor = 'rgba(21, 101, 192, 0.2)'; }

        const time = candles[i].time;
        line1Data.push({ time: time, value: val1, color: lineColor });
        line2Data.push({ time: time, value: val4, color: lineColor });
        fillData.push({ time: time, open: val1, high: Math.max(val1, val4), low: Math.min(val1, val4), close: val4, color: fillColor });
    }
    return { line1Data, line2Data, fillData };
};

export const AdvancedChart: React.FC<AdvancedChartProps> = ({ symbol, assetType, height = 500 }) => {
    const [interval, setIntervalState] = useState<TimeInterval>('1d');
    const [loading, setLoading] = useState(false);

    const [showSMA, setShowSMA] = useState(false);
    const [showEMA21, setShowEMA21] = useState(false);
    const [showRSI, setShowRSI] = useState(true);
    const [showGold, setShowGold] = useState(true);
    const [showMoneyline, setShowMoneyline] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showVol, setShowVol] = useState(true);
    const [showVP, setShowVP] = useState(true);
    const [showMACD, setShowMACD] = useState(true);

    const [vpElements, setVpElements] = useState<JSX.Element[]>([]);

    const mainContainerRef = useRef<HTMLDivElement>(null);
    const mainChartRef = useRef<HTMLDivElement>(null);
    const rsiRef = useRef<HTMLDivElement>(null);
    const macdRef = useRef<HTMLDivElement>(null);

    const chart = useRef<IChartApi | null>(null);
    const rsiChart = useRef<IChartApi | null>(null);
    const macdChart = useRef<IChartApi | null>(null);

    const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null);
    const sma50 = useRef<ISeriesApi<"Line"> | null>(null);
    const sma200 = useRef<ISeriesApi<"Line"> | null>(null);
    const ema21 = useRef<ISeriesApi<"Line"> | null>(null);
    const goldFillSeries = useRef<ISeriesApi<"Bar"> | null>(null);
    const gold1 = useRef<ISeriesApi<"Line"> | null>(null);
    const gold2 = useRef<ISeriesApi<"Line"> | null>(null);
    const moneylineSeries = useRef<ISeriesApi<"Line"> | null>(null);
    const moneylineFillSeries = useRef<ISeriesApi<"Bar"> | null>(null);
    const mlMarkersRef = useRef<any[]>([]);

    const rsiLine = useRef<ISeriesApi<"Line"> | null>(null);

    const macdHistSeries = useRef<ISeriesApi<"Histogram"> | null>(null);
    const macdLineSeries = useRef<ISeriesApi<"Line"> | null>(null);
    const signalLineSeries = useRef<ISeriesApi<"Line"> | null>(null);

    const allDataRef = useRef<any[]>([]);

    // --- HEIGHT CALCULATION ---
    const [chartHeights, setChartHeights] = useState({ main: 400, rsi: 0, macd: 0 });

    // --- VOLUME PROFILE ---
    // Moved up to be available for effects
    const updateVolumeProfile = useCallback(() => {
        if (!chart.current || !candleSeries.current || !showVP || allDataRef.current.length === 0) {
            setVpElements([]);
            return;
        }

        const visibleRange = chart.current.timeScale().getVisibleLogicalRange();
        if (!visibleRange) return;

        const startIdx = Math.max(0, Math.floor(visibleRange.from));
        const endIdx = Math.min(allDataRef.current.length - 1, Math.ceil(visibleRange.to));

        const visibleData = [];
        for (let i = startIdx; i <= endIdx; i++) {
            if (allDataRef.current[i]) visibleData.push(allDataRef.current[i]);
        }

        if (visibleData.length === 0) return;

        let minPrice = Infinity; let maxPrice = -Infinity;
        visibleData.forEach(d => { if (d.low < minPrice) minPrice = d.low; if (d.high > maxPrice) maxPrice = d.high; });

        const numBins = 40;
        const binSize = (maxPrice - minPrice) / numBins;
        if (binSize === 0) return;

        const bins = new Array(numBins).fill(0);
        visibleData.forEach(d => {
            const binIdx = Math.floor((d.close - minPrice) / binSize);
            if (binIdx >= 0 && binIdx < numBins) bins[binIdx] += d.volume;
        });

        const maxVol = Math.max(...bins);
        const elements = [];
        const series = candleSeries.current;

        // Use dynamic height for checking bounds
        const currentHeight = chartHeights.main;

        for (let i = 0; i < numBins; i++) {
            if (bins[i] === 0) continue;
            const priceLevel = minPrice + (i * binSize) + (binSize / 2);
            const coordinate = series.priceToCoordinate(priceLevel);
            if (coordinate === null || coordinate < 0 || coordinate > currentHeight) continue;
            const widthPct = (bins[i] / maxVol) * 100;
            const isPOC = bins[i] === maxVol;
            let barColor = isPOC ? 'rgba(255, 61, 0, 0.6)' : 'rgba(21, 101, 192, 0.4)';
            elements.push(
                <div
                    key={i}
                    className={cn("absolute left-0 h-[2px] pointer-events-none transition-all duration-200", isPOC && "z-10")}
                    style={{
                        top: coordinate,
                        width: `${widthPct}%`,
                        backgroundColor: barColor,
                        borderRight: isPOC ? '1px solid #ff3d00' : 'none'
                    }}
                />
            );
        }
        setVpElements(elements);
    }, [showVP, chartHeights.main]);

    // Use ref to access latest updateVolumeProfile without triggering effects
    const updateVolumeProfileRef = useRef(updateVolumeProfile);
    useEffect(() => {
        updateVolumeProfileRef.current = updateVolumeProfile;
    }, [updateVolumeProfile]);

    useEffect(() => {
        const calculateHeights = () => {
            if (!isFullscreen) {
                setChartHeights({
                    main: 400,
                    rsi: showRSI ? 120 : 0,
                    macd: showMACD ? 120 : 0
                });
                return;
            }

            // Fullscreen logic
            const toolbarHeight = 60; //Approximate toolbar height
            const availableHeight = window.innerHeight - toolbarHeight;

            const activeIndicators = (showRSI ? 1 : 0) + (showMACD ? 1 : 0);

            let mainH = availableHeight;
            let indicatorH = 0;

            if (activeIndicators === 1) {
                mainH = availableHeight * 0.80; // 80% Main
                indicatorH = availableHeight * 0.20; // 20% Indicator
            } else if (activeIndicators === 2) {
                mainH = availableHeight * 0.70; // 70% Main
                indicatorH = availableHeight * 0.15; // 15% Each Indicator
            }

            setChartHeights({
                main: Math.floor(mainH),
                rsi: showRSI ? Math.floor(indicatorH) : 0,
                macd: showMACD ? Math.floor(indicatorH) : 0
            });
        };

        calculateHeights();
        window.addEventListener('resize', calculateHeights);
        return () => window.removeEventListener('resize', calculateHeights);
    }, [isFullscreen, showRSI, showMACD]);

    // Apply heights to charts
    useEffect(() => {
        if (chart.current) chart.current.applyOptions({ height: chartHeights.main });
        if (rsiChart.current) rsiChart.current.applyOptions({ height: chartHeights.rsi });
        if (macdChart.current) macdChart.current.applyOptions({ height: chartHeights.macd });

        // Trigger resize to fix widths as well
        if (mainChartRef.current && chart.current) chart.current.applyOptions({ width: mainChartRef.current.clientWidth });
        if (rsiRef.current && rsiChart.current) rsiChart.current.applyOptions({ width: rsiRef.current.clientWidth });
        if (macdRef.current && macdChart.current) macdChart.current.applyOptions({ width: macdRef.current.clientWidth });

        updateVolumeProfile();
    }, [chartHeights, updateVolumeProfile]);

    // --- INIT CHARTS ---
    useEffect(() => {
        if (!mainChartRef.current || !rsiRef.current || !macdRef.current) return;

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
                minimumWidth: 65, // Unified width for alignment
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.1)',
            },
        };

        chart.current = createChart(mainChartRef.current, {
            ...commonOptions,
            width: mainChartRef.current.clientWidth,
            height: chartHeights.main,
            crosshair: { mode: CrosshairMode.Normal },
            timeScale: { ...commonOptions.timeScale, timeVisible: true },
            localization: {
                locale: 'hu-HU',
                timeFormatter: (time: number) => {
                    return new Date(time * 1000).toLocaleString('hu-HU', {
                        timeZone: 'Europe/Budapest',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                },
            },
        });

        volumeSeries.current = chart.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
        });
        volumeSeries.current.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });

        goldFillSeries.current = chart.current.addBarSeries({ thinBars: false, openVisible: false, downColor: 'transparent', upColor: 'transparent' });
        moneylineFillSeries.current = chart.current.addBarSeries({
            thinBars: false,
            openVisible: false,
            downColor: 'transparent',
            upColor: 'transparent',
            priceLineVisible: false,
            lastValueVisible: false
        });
        candleSeries.current = chart.current.addCandlestickSeries({ upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });
        sma50.current = chart.current.addLineSeries({ color: '#2962ff', lineWidth: 1, title: 'SMA 50' });
        sma200.current = chart.current.addLineSeries({ color: '#ff6d00', lineWidth: 1, title: 'SMA 200' });
        ema21.current = chart.current.addLineSeries({ color: '#e91e63', lineWidth: 1, title: 'EMA 21' });
        gold1.current = chart.current.addLineSeries({ lineWidth: 2, title: 'Gold High' });
        gold2.current = chart.current.addLineSeries({ lineWidth: 2, title: 'Gold Low' });
        moneylineSeries.current = chart.current.addLineSeries({ lineWidth: 3, title: 'MoneyLine', lastValueVisible: false, priceLineVisible: false });

        // RSI
        rsiChart.current = createChart(rsiRef.current, {
            ...commonOptions,
            width: rsiRef.current.clientWidth,
            height: chartHeights.rsi,
            timeScale: { visible: false },
            localization: {
                locale: 'hu-HU',
                timeFormatter: (time: number) => {
                    return new Date(time * 1000).toLocaleString('hu-HU', {
                        timeZone: 'Europe/Budapest',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                },
            },
        });
        rsiLine.current = rsiChart.current.addLineSeries({ color: '#7b1fa2', lineWidth: 2 });
        rsiLine.current.createPriceLine({ price: 70, color: '#333', lineWidth: 1, lineStyle: LineStyle.Dashed });
        rsiLine.current.createPriceLine({ price: 30, color: '#333', lineWidth: 1, lineStyle: LineStyle.Dashed });

        // MACD
        macdChart.current = createChart(macdRef.current, {
            ...commonOptions,
            width: macdRef.current.clientWidth,
            height: chartHeights.macd,
            timeScale: { visible: false },
            localization: {
                locale: 'hu-HU',
                timeFormatter: (time: number) => {
                    return new Date(time * 1000).toLocaleString('hu-HU', {
                        timeZone: 'Europe/Budapest',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                },
            },
        });
        macdHistSeries.current = macdChart.current.addHistogramSeries({ color: '#26a69a' });
        macdLineSeries.current = macdChart.current.addLineSeries({ color: '#2962FF', lineWidth: 2, title: 'MACD' });
        signalLineSeries.current = macdChart.current.addLineSeries({ color: '#FF6D00', lineWidth: 2, title: 'Signal' });

        // --- SYNC ---
        const charts = [
            { chart: chart.current, series: candleSeries.current },
            { chart: rsiChart.current, series: rsiLine.current },
            { chart: macdChart.current, series: macdLineSeries.current }
        ];

        charts.forEach(c => {
            c.chart!.timeScale().subscribeVisibleLogicalRangeChange(range => {
                if (range) {
                    charts.forEach(other => {
                        if (other.chart !== c.chart) {
                            other.chart!.timeScale().setVisibleLogicalRange(range);
                        }
                    });
                    if (c.chart === chart.current) updateVolumeProfileRef.current();
                }
            });

            c.chart!.subscribeCrosshairMove(param => {
                if (!param.time || param.point === undefined) {
                    charts.forEach(other => {
                        if (other.chart !== c.chart) other.chart!.clearCrosshairPosition();
                    });
                    return;
                }
                charts.forEach(other => {
                    if (other.chart !== c.chart) {
                        other.chart!.setCrosshairPosition(0, param.time as any, other.series as any);
                    }
                });
            });
        });

        const handleResize = () => {
            // Resize is now handled by the chartHeights useEffect primarily for heights
            // We can keep this for width sync if needed, but the main useEffect covers it.
            // Leaving this empty or simple as the dedicated hook manages sizing.
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.current?.remove();
            rsiChart.current?.remove();
            macdChart.current?.remove();
        }
    }, [assetType]); // Minimal logical dependency to force re-init only if fundamentally changing context

    // --- DATA FETCH ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const yahooSymbol = symbol.includes('-USD') ? symbol : symbol;
                const range = '10y';
                const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
                const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(yahooUrl);

                const res = await fetch(proxyUrl);
                const json = await res.json();

                if (!json.chart.result) throw new Error('No data found');

                const result = json.chart.result[0];
                const quotes = result.indicators.quote[0];
                const timestamps = result.timestamp;

                const candles = [];
                const volumes = [];

                const getStartOfWeek = (timestamp: number) => {
                    const date = new Date(timestamp * 1000);
                    const day = date.getDay(); // 0 is Sunday
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                    const monday = new Date(date.setDate(diff));
                    monday.setHours(0, 0, 0, 0);
                    return Math.floor(monday.getTime() / 1000);
                };

                for (let i = 0; i < timestamps.length; i++) {
                    if (quotes.open[i] === null) continue;

                    let time = timestamps[i];
                    if (interval === '1wk') {
                        time = getStartOfWeek(time);
                    }

                    const c = {
                        time: time,
                        open: quotes.open[i],
                        high: quotes.high[i],
                        low: quotes.low[i],
                        close: quotes.close[i],
                        volume: quotes.volume[i] || 0
                    };

                    const color = quotes.close[i] >= quotes.open[i] ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)';
                    const v = { time: time, value: quotes.volume[i], color: color };

                    if (candles.length > 0 && candles[candles.length - 1].time === time) {
                        // Merge with existing candle
                        const lastCandle = candles[candles.length - 1];
                        lastCandle.high = Math.max(lastCandle.high, c.high);
                        lastCandle.low = Math.min(lastCandle.low, c.low);
                        lastCandle.close = c.close;
                        lastCandle.volume += c.volume;

                        const lastVol = volumes[volumes.length - 1];
                        lastVol.value += v.value;
                        lastVol.color = lastCandle.close >= lastCandle.open ? 'rgba(38, 166, 154, 0.4)' : 'rgba(239, 83, 80, 0.4)';
                    } else {
                        candles.push(c);
                        volumes.push(v);
                    }
                }

                allDataRef.current = candles;

                // --- DYNAMIC PRECISION ---
                let precision = 2;
                let minMove = 0.01;

                if (candles.length > 0) {
                    const minPrice = Math.min(...candles.map(c => c.low));
                    if (minPrice < 0.0001) { precision = 8; minMove = 0.00000001; }
                    else if (minPrice < 0.01) { precision = 6; minMove = 0.000001; }
                    else if (minPrice < 1) { precision = 4; minMove = 0.0001; }
                    else if (minPrice >= 1000) { precision = 0; minMove = 1; }
                }

                // Explicit custom formatter to guarantee display
                const customFormatter = (price: number) => {
                    // Start of volume logic: if value is huge, it's volume
                    if (price > 10000000) {
                        if (price >= 1000000000) return (price / 1000000000).toFixed(2) + 'B';
                        if (price >= 1000000) return (price / 1000000).toFixed(2) + 'M';
                    }
                    return price.toFixed(precision);
                };

                const priceFormat = {
                    type: 'custom',
                    formatter: customFormatter,
                    minMove: minMove
                };

                // FORCE global localization formatter to override axis
                // This ensures the axis labels MUST use this format
                chart.current?.applyOptions({
                    localization: {
                        priceFormatter: customFormatter
                    },
                    rightPriceScale: {
                        minimumWidth: 65, // Unified width for alignment
                    }
                });

                candleSeries.current?.applyOptions({ priceFormat: priceFormat as any });
                sma50.current?.applyOptions({ priceFormat: priceFormat as any });
                sma200.current?.applyOptions({ priceFormat: priceFormat as any });
                ema21.current?.applyOptions({ priceFormat: priceFormat as any });
                gold1.current?.applyOptions({ priceFormat: priceFormat as any });
                gold2.current?.applyOptions({ priceFormat: priceFormat as any });
                moneylineSeries.current?.applyOptions({ priceFormat: priceFormat as any });

                candleSeries.current?.setData(candles);
                volumeSeries.current?.setData(volumes);

                sma50.current?.setData(calculateSMA(candles, 50));
                sma200.current?.setData(calculateSMA(candles, 200));
                ema21.current?.setData(calculateEMA(candles, 21));
                rsiLine.current?.setData(calculateRSI(candles));

                const macdData = calculateMACD(candles);
                macdLineSeries.current?.setData(macdData.macdSeriesData);
                signalLineSeries.current?.setData(macdData.signalSeriesData);
                macdHistSeries.current?.setData(macdData.histSeriesData);

                const { line1Data, line2Data, fillData } = calculateGoldhand(candles);
                gold1.current?.setData(line1Data);
                gold2.current?.setData(line2Data);
                goldFillSeries.current?.setData(fillData);

                const { lineData: mlLine, fillData: mlFill, markers: mlMarkers } = calculateMoneyline(candles, 14, 3.0, 0.6);
                mlMarkersRef.current = mlMarkers;
                moneylineSeries.current?.setData(mlLine);
                moneylineFillSeries.current?.setData(mlFill);
                candleSeries.current?.setMarkers(showMoneyline ? mlMarkers : []);

                setTimeout(() => updateVolumeProfileRef.current(), 500);
            } catch (e) {
                console.error('AdvancedChart error:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol, interval]); // Removed updateVolumeProfile dependency

    // --- VISIBILITY ---
    useEffect(() => {
        sma50.current?.applyOptions({ visible: showSMA });
        sma200.current?.applyOptions({ visible: showSMA });
    }, [showSMA]);

    useEffect(() => {
        ema21.current?.applyOptions({ visible: showEMA21 });
    }, [showEMA21]);

    useEffect(() => {
        gold1.current?.applyOptions({ visible: showGold });
        gold2.current?.applyOptions({ visible: showGold });
        goldFillSeries.current?.applyOptions({ visible: showGold });
    }, [showGold]);

    useEffect(() => {
        moneylineSeries.current?.applyOptions({ visible: showMoneyline });
        moneylineFillSeries.current?.applyOptions({ visible: showMoneyline });
        candleSeries.current?.setMarkers(showMoneyline ? mlMarkersRef.current : []);
    }, [showMoneyline]);

    useEffect(() => {
        volumeSeries.current?.applyOptions({ visible: showVol });
    }, [showVol]);

    return (
        <div className={cn(
            "flex flex-col bg-card/40 backdrop-blur-xl border border-border rounded-xl overflow-hidden shadow-2xl transition-all duration-500",
            isFullscreen && "fixed inset-0 z-[100] rounded-none m-0 bg-background/95 p-0"
        )}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-3 gap-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">TF</span>
                        <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 px-3 text-[10px] font-black uppercase tracking-tighter rounded-md", interval === '1d' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/10")}
                                onClick={() => setIntervalState('1d')}
                            >
                                1D
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 px-3 text-[10px] font-black uppercase tracking-tighter rounded-md", interval === '1wk' ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-primary/10")}
                                onClick={() => setIntervalState('1wk')}
                            >
                                1W
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50">IND</span>
                        <div className="flex flex-wrap gap-1">
                            {[
                                { label: 'SMA 50&200', active: showSMA, set: setShowSMA },
                                { label: 'EMA 21', active: showEMA21, set: setShowEMA21, color: 'text-pink-500 hover:text-pink-400' },
                                { label: 'GOLDHAND', active: showGold, set: setShowGold, color: 'text-amber-500 hover:text-amber-400' },
                                { label: 'MONEYLINE', active: showMoneyline, set: setShowMoneyline, color: 'text-emerald-500 hover:text-emerald-400' },
                                { label: 'RSI', active: showRSI, set: setShowRSI },
                                { label: 'MACD', active: showMACD, set: setShowMACD },
                                { label: 'VOL', active: showVol, set: setShowVol },
                                { label: 'VPVR', active: showVP, set: setShowVP },
                            ].map((ind) => (
                                <Button
                                    key={ind.label}
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-[9px] font-black uppercase tracking-tight border-border/50 transition-all duration-300",
                                        ind.active ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "hover:bg-muted/50 opacity-60",
                                        ind.active && ind.color
                                    )}
                                    onClick={() => ind.set(!ind.active)}
                                >
                                    {ind.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black tracking-widest uppercase">
                        {symbol} Terminal
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="relative flex flex-col bg-card/20 min-h-[500px]" ref={mainContainerRef}>
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Syncing Market Data...</span>
                        </div>
                    </div>
                )}

                <div className="relative flex-1 overflow-hidden" style={{ height: `${chartHeights.main}px` }}>
                    {/* Main Chart */}
                    <div
                        ref={mainChartRef}
                        className="w-full z-2 relative transition-all duration-300"
                        style={{
                            height: `${chartHeights.main}px`,
                            backgroundImage: "url('https://i.ibb.co/TMdGbqfK/hattergh.png')",
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                            backgroundSize: '300px'
                        }}
                    />

                    {/* Volume Profile Overlay */}
                    {showVP && (
                        <div className="vp-container absolute top-0 left-0 w-40 h-full pointer-events-none z-10 opacity-70">
                            {vpElements}
                        </div>
                    )}
                </div>

                {/* Indicator Charts */}
                <div
                    ref={rsiRef}
                    className={cn("w-full border-t border-border/30 transition-all duration-500", showRSI ? `h-[${chartHeights.rsi}px]` : "h-0 opacity-0 invisible overflow-hidden")}
                    style={{ height: showRSI ? `${chartHeights.rsi}px` : '0px' }}
                />
                <div
                    ref={macdRef}
                    className={cn("w-full border-t border-border/30 transition-all duration-500", showMACD ? `h-[${chartHeights.macd}px]` : "h-0 opacity-0 invisible overflow-hidden")}
                    style={{ height: showMACD ? `${chartHeights.macd}px` : '0px' }}
                />
            </div>
        </div>
    );
};
