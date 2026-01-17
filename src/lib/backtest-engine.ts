export interface Candle {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface Trade {
    buy_date: string;
    buy_price: number;
    sell_date?: string;
    sell_price?: number;
    result: number;
    days_in_trade: number;
    status: 'open' | 'closed';
}

export interface BacktestSummary {
    total_trades: number;
    win_ratio: number;
    average_result: number;
    median_result: number;
    cumulative_result: number;
    hold_result: number;
    average_days: number;
    win_trades: number;
    loss_trades: number;
    max_gain: number;
    max_loss: number;
    profitable_mean: number;
    profitable_median: number;
    losing_mean: number;
    losing_median: number;
}

export const Indicators = {
    calculateSMMA: (values: number[], length: number) => {
        const smma = new Array(values.length).fill(null);
        let sum = 0;
        for (let i = 0; i < length; i++) sum += values[i];
        smma[length - 1] = sum / length;
        for (let i = length; i < values.length; i++) {
            smma[i] = (smma[i - 1] * (length - 1) + values[i]) / length;
        }
        return smma;
    },

    calculateRSI: (candles: Candle[], period = 14) => {
        const results = new Array(candles.length).fill(null);
        let gains = 0, losses = 0;
        for (let i = 1; i < candles.length; i++) {
            const diff = candles[i].close - candles[i - 1].close;
            const gain = diff > 0 ? diff : 0;
            const loss = diff < 0 ? Math.abs(diff) : 0;
            if (i <= period) {
                gains += gain; losses += loss;
                if (i === period) {
                    const rs = (gains / period) / (losses / period || 1);
                    results[i] = 100 - (100 / (1 + rs));
                }
            } else {
                gains = (gains * (period - 1) + gain) / period;
                losses = (losses * (period - 1) + loss) / period;
                results[i] = 100 - (100 / (1 + gains / (losses || 1)));
            }
        }
        return results;
    },

    calculateATR: (candles: Candle[], length: number) => {
        const atr = new Array(candles.length).fill(null);
        let sumTR = 0;
        for (let i = 0; i < candles.length; i++) {
            if (i === 0) {
                atr[i] = candles[i].high - candles[i].low;
                continue;
            }
            const tr = Math.max(
                candles[i].high - candles[i].low,
                Math.abs(candles[i].high - candles[i - 1].close),
                Math.abs(candles[i].low - candles[i - 1].close)
            );
            if (i < length) {
                sumTR += tr;
                if (i === length - 1) atr[i] = sumTR / length;
            } else {
                atr[i] = (atr[i - 1] * (length - 1) + tr) / length;
            }
        }
        return atr;
    },

    calculateMoneyLine: (candles: Candle[], period = 14, mult = 3, stepFactor = 0.6) => {
        const atr = Indicators.calculateATR(candles, period);
        const trend = new Array(candles.length).fill(null);
        let trendDir = 1; // 1: Bullish, -1: Bearish
        let trendLine = candles[0].close;

        for (let i = 0; i < candles.length; i++) {
            const close = candles[i].close;
            const currentAtr = atr[i];

            if (currentAtr === null || isNaN(currentAtr)) {
                trend[i] = { val: close, dir: trendDir };
                continue;
            }

            const longStop = close - (currentAtr * mult);
            const shortStop = close + (currentAtr * mult);
            const prevTrendLine = i > 0 ? trend[i - 1].val : close;

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
            trend[i] = { val: trendLine, dir: trendDir };
        }
        return trend;
    }
};

export type StrategyType = 'RSI' | 'GOLDHAND' | 'MONEYLINE';

export interface BacktestParams {
    rsiBuy?: number;
    rsiSell?: number;
    ghBuyColor?: string;
    ghSellColor?: string;
    mlMult?: number;
    ghP1?: number;
    ghP2?: number;
    ghP3?: number;
    ghP4?: number;
}

export interface BacktestResult {
    trades: Trade[];
    indicators: {
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

export function runBacktest(
    candles: Candle[],
    type: StrategyType,
    params: BacktestParams
): BacktestResult {
    if (candles.length < 30) return { trades: [], indicators: {} };

    const signals = new Array(candles.length).fill(0); // 1: Vétel, -1: Eladás
    const indicators: BacktestResult['indicators'] = {};

    if (type === 'RSI') {
        const rsi = Indicators.calculateRSI(candles);
        indicators.rsi = rsi;
        const buyLevel = params.rsiBuy || 30;
        const sellLevel = params.rsiSell || 70;
        for (let i = 1; i < candles.length; i++) {
            if (rsi[i] !== null) {
                if (rsi[i] < buyLevel) signals[i] = 1;
                if (rsi[i] > sellLevel) signals[i] = -1;
            }
        }
    } else if (type === 'GOLDHAND') {
        const hl2 = candles.map(c => (c.high + c.low) / 2);
        const v1 = Indicators.calculateSMMA(hl2, params.ghP1 || 15);
        const v2 = Indicators.calculateSMMA(hl2, params.ghP2 || 19);
        const v3 = Indicators.calculateSMMA(hl2, params.ghP3 || 25);
        const v4 = Indicators.calculateSMMA(hl2, params.ghP4 || 29);

        indicators.gh = {
            v1, v2, v3, v4,
            v1_color: params.ghBuyColor,
            v4_color: params.ghSellColor
        };

        const getColor = (i: number) => {
            if (v1[i] === null || v2[i] === null || v3[i] === null || v4[i] === null) return 'silver';
            if (v1[i] > v2[i] && v2[i] > v3[i] && v3[i] > v4[i]) return 'gold';
            if (v1[i] < v2[i] && v2[i] < v3[i] && v3[i] < v4[i]) return 'blue';
            return 'silver';
        };

        const buyColor = params.ghBuyColor || 'gold';
        const sellColor = params.ghSellColor || 'blue';

        for (let i = 1; i < candles.length; i++) {
            const color = getColor(i);
            const prevColor = getColor(i - 1);
            if (color === buyColor && prevColor !== buyColor) signals[i] = 1;
            if (color === sellColor && prevColor !== sellColor) signals[i] = -1;
        }
    } else if (type === 'MONEYLINE') {
        const mt = Indicators.calculateMoneyLine(candles, 14, params.mlMult || 3);
        indicators.ml = mt;
        for (let i = 1; i < candles.length; i++) {
            if (mt[i - 1] && mt[i]) {
                if (mt[i - 1].dir === -1 && mt[i].dir === 1) signals[i] = 1;
                if (mt[i - 1].dir === 1 && mt[i].dir === -1) signals[i] = -1;
            }
        }
    }

    const trades: Trade[] = [];
    let currentTrade: Partial<Trade> | null = null;

    for (let i = 0; i < candles.length - 1; i++) {
        if (!currentTrade && signals[i] === 1) {
            // Entry next day open
            currentTrade = {
                buy_date: candles[i + 1].time,
                buy_price: candles[i + 1].open,
                status: 'open'
            };
        } else if (currentTrade && signals[i] === -1) {
            // Exit next day open
            const buyPrice = currentTrade.buy_price!;
            const sellPrice = candles[i + 1].open;
            const result = sellPrice / buyPrice;
            const buyDate = new Date(currentTrade.buy_date!);
            const sellDate = new Date(candles[i + 1].time);

            trades.push({
                ...currentTrade as Trade,
                sell_date: candles[i + 1].time,
                sell_price: sellPrice,
                result,
                days_in_trade: Math.round((sellDate.getTime() - buyDate.getTime()) / (1000 * 3600 * 24)),
                status: 'closed'
            });
            currentTrade = null;
        }
    }

    // Handle open trade
    if (currentTrade) {
        const buyPrice = currentTrade.buy_price!;
        const lastPrice = candles[candles.length - 1].close;
        const result = lastPrice / buyPrice;
        const buyDate = new Date(currentTrade.buy_date!);
        const lastDate = new Date(candles[candles.length - 1].time);

        trades.push({
            ...currentTrade as Trade,
            result,
            days_in_trade: Math.round((lastDate.getTime() - buyDate.getTime()) / (1000 * 3600 * 24)),
            status: 'open'
        });
    }

    return { trades, indicators };
}

export function calculateSummary(trades: Trade[], candles: Candle[]): BacktestSummary {
    if (trades.length === 0) {
        return {
            total_trades: 0, win_ratio: 0, average_result: 0, median_result: 0,
            cumulative_result: 1, hold_result: 1, average_days: 0,
            win_trades: 0, loss_trades: 0, max_gain: 0, max_loss: 0,
            profitable_mean: 0, profitable_median: 0, losing_mean: 0, losing_median: 0
        };
    }

    const closedTrades = trades.filter(t => t.status === 'closed');
    // Use all trades for win ratio and total? Actually usually closed trades are more informative for stats, 
    // but let's include open for cumulative if it's the current state.

    const winTrades = trades.filter(t => t.result >= 1);
    const lossTrades = trades.filter(t => t.result < 1);
    const results = trades.map(t => (t.result - 1) * 100);
    const winResults = winTrades.map(t => (t.result - 1) * 100);
    const lossResults = lossTrades.map(t => (t.result - 1) * 100);

    const median = (arr: number[]) => {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const holdResult = candles.length > 0 ? candles[candles.length - 1].close / candles[0].open : 1;
    const cumulativeResult = trades.reduce((acc, t) => acc * t.result, 1);

    return {
        total_trades: trades.length,
        win_ratio: (winTrades.length / trades.length) * 100,
        average_result: results.reduce((a, b) => a + b, 0) / (results.length || 1),
        median_result: median(results),
        cumulative_result: cumulativeResult,
        hold_result: holdResult,
        average_days: trades.reduce((a, b) => a + b.days_in_trade, 0) / (trades.length || 1),
        win_trades: winTrades.length,
        loss_trades: lossTrades.length,
        max_gain: Math.max(...results, 0),
        max_loss: Math.min(...results, 0),
        profitable_mean: winResults.reduce((a, b) => a + b, 0) / (winResults.length || 1),
        profitable_median: median(winResults),
        losing_mean: lossResults.reduce((a, b) => a + b, 0) / (lossResults.length || 1),
        losing_median: median(lossResults),
    };
}
