import { useState, useEffect, useCallback, useRef } from 'react';
import type { AssetType } from './useGoldHandData';
import type { Candle } from '@/lib/backtest-engine';

export type Interval = '1d' | '1wk';

interface UseHistoricalDataResult {
    candles: Candle[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useHistoricalData = (
    ticker: string,
    assetType: AssetType,
    interval: Interval = '1d'
): UseHistoricalDataResult => {
    const [candles, setCandles] = useState<Candle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cache = useRef<Record<string, Candle[]>>({});

    const fetchData = useCallback(async () => {
        if (!ticker) return;

        const cacheKey = `${ticker}-${assetType}-${interval}`;
        if (cache.current[cacheKey]) {
            setCandles(cache.current[cacheKey]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let yahooTicker = ticker;
            if (assetType === 'crypto') {
                yahooTicker = ticker.includes('-USD') ? ticker : `${ticker}-USD`;
            } else if (assetType === 'commodities') {
                // Commodities already have =F suffix usually, but we ensure consistency
                yahooTicker = ticker;
            }

            const range = '10y';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=${interval}&range=${range}`;
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(yahooUrl);

            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

            const json = await res.json();
            if (!json.chart?.result) throw new Error('No data found');

            const result = json.chart.result[0];
            const quote = result.indicators.quote[0];
            const timestamps = result.timestamp;

            const formattedCandles: Candle[] = [];

            const getStartOfWeek = (timestamp: number) => {
                const date = new Date(timestamp * 1000);
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(date.setDate(diff));
                monday.setHours(0, 0, 0, 0);
                return monday;
            };

            for (let i = 0; i < timestamps.length; i++) {
                if (quote.open[i] === null || quote.close[i] === null) continue;

                let dateObj = new Date(timestamps[i] * 1000);
                if (interval === '1wk') {
                    dateObj = getStartOfWeek(timestamps[i]);
                }

                const dateStr = dateObj.toISOString().split('T')[0];

                const candle: Candle = {
                    time: dateStr,
                    open: quote.open[i],
                    high: quote.high[i],
                    low: quote.low[i],
                    close: quote.close[i],
                };

                // Merge daily into weekly if needed (though Yahoo returns weekly intervals already)
                // But for consistency with AdvancedChart logic:
                if (formattedCandles.length > 0 && formattedCandles[formattedCandles.length - 1].time === dateStr) {
                    const last = formattedCandles[formattedCandles.length - 1];
                    last.high = Math.max(last.high, candle.high);
                    last.low = Math.min(last.low, candle.low);
                    last.close = candle.close;
                } else {
                    formattedCandles.push(candle);
                }
            }

            cache.current[cacheKey] = formattedCandles;
            setCandles(formattedCandles);
        } catch (err) {
            console.error('Error fetching historical data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [ticker, assetType, interval]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        candles,
        loading,
        error,
        refetch: fetchData,
    };
};
