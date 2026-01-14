import { useState, useEffect, useCallback } from 'react';
import type { AssetType, Timeframe } from './useGoldHandData';

export interface StrategyTrade {
  buy_price: number;
  buy_date: string;
  trade_id: number;
  status: 'closed' | 'open';
  sell_price?: number;
  sell_date?: string;
  result: number;
  days_in_trade: number;
}

export interface StrategySummary {
  ticker: string;
  'number_of_trades': number;
  'win_ratio(%)': number;
  'average_res(%)': number;
  'average_trade_len(days)': number;
  'median_res(%)': number;
  cumulative_result: string | number;
  trade_results: string;
  profitable_trade_results: string;
  profitable_trades_mean: number;
  profitable_trades_median: number;
  looser_trade_results: string;
  looser_trades_mean: number;
  looser_trades_median: number;
  'median_trade_len(days)': number;
  number_of_win_trades: number;
  number_of_lost_trades: number;
  'max_gain(%)': number;
  'max_lost(%)': number;
  first_trade_buy: string;
  first_data_date: string;
  first_open_price: number;
  last_data_date: string;
  last_close_price: number;
  hold_result: string;
  buy_at: string;
  sell_at: string;
}

export interface Strategy {
  summary: StrategySummary;
  trades: StrategyTrade[];
  thresholds?: (string | number)[];
}

export interface IntervalData {
  interval: string;
  data_points: number;
  date_range: {
    start: string;
    end: string;
  };
  price_summary: {
    first_open: number;
    last_close: number;
    min_low: number;
    max_high: number;
    total_return: number;
  };
  indicators: {
    latest_rsi: number;
    latest_sma_50: number;
    latest_sma_100: number;
    latest_sma_200: number;
    diff_from_sma_50: number;
    diff_from_sma_100: number;
    diff_from_sma_200: number;
  };
  extra_metrics: {
    ghl_status: string;
    ghl_color: 'gold' | 'blue' | 'grey' | 'gray';
    ghl_last_change_date: string;
    ghl_days_since_last_change: number;
    ghl_last_change_price: number;
    ghl_change_percent_from_last_change: number;
    rsi_status: string;
    rsi_last_change_date: string;
    rsi_days_since_last_change: number;
    rsi_last_change_price: number;
    rsi_change_percent_from_last_change: number;
    last_max: number;
    fell_from_last_max: number;
    last_local_min_date: string;
    last_local_min_price: number;
    days_after_last_local_min: number;
    percent_change_from_last_local_min: number;
    last_local_max_date: string;
    last_local_max_price: number;
    days_after_last_local_max: number;
    percent_fall_from_last_local_max: number;
    sector?: string;
    industry?: string;
    price_per_earning?: number;
    earnings_per_share_basic_ttm?: number;
    number_of_employees?: number;
    tradingview_id?: string;
  };
  strategies: {
    [key: string]: Strategy;
  };
}

export interface OHLCData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AssetDetail {
  ticker: string;
  is_crypto: boolean;
  collected_at: string;
  intervals: {
    daily: IntervalData;
    weekly?: IntervalData;
  };
  daily_ohlc?: OHLCData[];
  weekly_ohlc?: OHLCData[];
}

interface UseAssetDetailResult {
  data: AssetDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/misrori/goldhand_data_collect/main';

// Mapping commodity tickers to their file names
const COMMODITY_FILE_MAPPING: Record<string, string> = {
  'GC=F': 'gold',
  'SI=F': 'silver',
  'CL=F': 'crude_oil_wti',
  'NG=F': 'natural_gas',
  'HG=F': 'copper',
  'PL=F': 'platinum',
  'PA=F': 'palladium',
  'ZC=F': 'corn',
  'ZW=F': 'wheat',
  'ZS=F': 'soybeans',
  'CT=F': 'cotton',
  'KC=F': 'coffee',
  'SB=F': 'sugar',
  'CC=F': 'cocoa',
  'LE=F': 'live_cattle',
  'HE=F': 'lean_hogs',
  'BZ=F': 'brent_oil',
  'ALI=F': 'aluminum',
  'ZN=F': 'zinc',
};

export const useAssetDetail = (
  ticker: string,
  assetType: AssetType,
  timeframe: Timeframe = 'daily'
): UseAssetDetailResult => {
  const [data, setData] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!ticker) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine the file name based on asset type
      // All asset types now use ticker directly as filename
      const fileName = ticker;

      // Use new folder structure: back_tests_daily or back_tests_weekly
      const folder = timeframe === 'daily' ? 'back_tests_daily' : 'back_tests_weekly';
      const encodedFileName = encodeURIComponent(fileName);
      const url = `${GITHUB_BASE_URL}/${folder}/${encodedFileName}.json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const textData = await response.text();
      // Replace NaN with null to handle invalid JSON
      const cleanedData = textData.replace(/:\s*NaN/g, ': null');
      const jsonData = JSON.parse(cleanedData);

      // Transform the new data format to match the expected AssetDetail interface
      // The new format has summary_data and strategys at root level
      const intervalData: IntervalData = {
        interval: timeframe,
        data_points: 0, // Not provided in new format
        date_range: {
          start: jsonData.summary_data?.date || '',
          end: jsonData.summary_data?.date || '',
        },
        price_summary: {
          first_open: jsonData.summary_data?.open || 0,
          last_close: jsonData.summary_data?.close || 0,
          min_low: jsonData.summary_data?.low || 0,
          max_high: jsonData.summary_data?.high || 0,
          total_return: 0, // Calculate if needed
        },
        indicators: {
          latest_rsi: jsonData.summary_data?.rsi || 0,
          latest_sma_50: jsonData.summary_data?.sma_50 || 0,
          latest_sma_100: jsonData.summary_data?.sma_100 || 0,
          latest_sma_200: jsonData.summary_data?.sma_200 || 0,
          diff_from_sma_50: jsonData.summary_data?.diff_sma50 || 0,
          diff_from_sma_100: jsonData.summary_data?.diff_sma100 || 0,
          diff_from_sma_200: jsonData.summary_data?.diff_sma200 || 0,
        },
        extra_metrics: {
          ghl_status: jsonData.summary_data?.ghl_status || '',
          ghl_color: jsonData.summary_data?.ghl_color || 'grey',
          ghl_last_change_date: jsonData.summary_data?.ghl_last_change_date || '',
          ghl_days_since_last_change: jsonData.summary_data?.ghl_days_since_last_change || 0,
          ghl_last_change_price: jsonData.summary_data?.ghl_last_change_price || 0,
          ghl_change_percent_from_last_change: jsonData.summary_data?.ghl_change_percent_from_last_change || 0,
          rsi_status: jsonData.summary_data?.rsi_status || '',
          rsi_last_change_date: jsonData.summary_data?.rsi_last_change_date || '',
          rsi_days_since_last_change: jsonData.summary_data?.rsi_days_since_last_change || 0,
          rsi_last_change_price: jsonData.summary_data?.rsi_last_change_price || 0,
          rsi_change_percent_from_last_change: jsonData.summary_data?.rsi_change_percent_from_last_change || 0,
          last_max: jsonData.summary_data?.last_max || 0,
          fell_from_last_max: jsonData.summary_data?.fell_from_last_max || 0,
          last_local_min_date: jsonData.summary_data?.last_local_min_date || '',
          last_local_min_price: jsonData.summary_data?.last_local_min_price || 0,
          days_after_last_local_min: jsonData.summary_data?.days_after_last_local_min || 0,
          percent_change_from_last_local_min: jsonData.summary_data?.percent_change_from_last_local_min || 0,
          last_local_max_date: jsonData.summary_data?.last_local_max_date || '',
          last_local_max_price: jsonData.summary_data?.last_local_max_price || 0,
          days_after_last_local_max: jsonData.summary_data?.days_after_last_local_max || 0,
          percent_fall_from_last_local_max: jsonData.summary_data?.percent_fall_from_last_local_max || 0,
          sector: jsonData.summary_data?.sector,
          industry: jsonData.summary_data?.industry,
          price_per_earning: jsonData.summary_data?.price_per_earning,
          earnings_per_share_basic_ttm: jsonData.summary_data?.earnings_per_share_basic_ttm,
          number_of_employees: jsonData.summary_data?.number_of_employees,
          tradingview_id: jsonData.summary_data?.tradingview_id,
        },
        strategies: {},
      };

      // Transform strategies from new format to old format
      // New format: { goldhandline_strategys: [{thresholds: [...], trades: [...], trades_summary: {...}}], rsi_strategy: [...] }
      // Old format: { strategy_name: { summary: {...}, trades: [...]}}
      if (jsonData.strategys) {
        // Process goldhandline strategies
        if (Array.isArray(jsonData.strategys.goldhandline_strategys)) {
          jsonData.strategys.goldhandline_strategys.forEach((strategy: any, index: number) => {
            const strategyName = `goldhand_line_${strategy.thresholds?.join('_') || index}`;
            intervalData.strategies[strategyName] = {
              summary: strategy.trades_summary || {},
              trades: strategy.trades || [],
              thresholds: strategy.thresholds,
            };
          });
        }

        // Process RSI strategies
        if (Array.isArray(jsonData.strategys.rsi_strategy)) {
          jsonData.strategys.rsi_strategy.forEach((strategy: any, index: number) => {
            const thresholds = strategy.thresholds || [];
            const strategyName = `rsi_${thresholds.join('_') || index}`;
            intervalData.strategies[strategyName] = {
              summary: strategy.trades_summary || {},
              trades: strategy.trades || [],
              thresholds: strategy.thresholds,
            };
          });
        }

        // Process any other strategy arrays
        Object.keys(jsonData.strategys).forEach((key) => {
          if (key !== 'ticker' && key !== 'goldhandline_strategys' && key !== 'rsi_strategy') {
            const strategies = jsonData.strategys[key];
            if (Array.isArray(strategies)) {
              strategies.forEach((strategy: any, index: number) => {
                const thresholds = strategy.thresholds || [];
                const strategyName = `${key}_${thresholds.join('_') || index}`;
                intervalData.strategies[strategyName] = {
                  summary: strategy.trades_summary || {},
                  trades: strategy.trades || [],
                  thresholds: strategy.thresholds,
                };
              });
            }
          }
        });
      }

      const transformedData: AssetDetail = {
        ticker: jsonData.summary_data?.ticker || ticker,
        is_crypto: assetType === 'crypto',
        collected_at: jsonData.summary_data?.date || new Date().toISOString(),
        intervals: timeframe === 'daily'
          ? { daily: intervalData }
          : { daily: intervalData, weekly: intervalData }, // For weekly, we set both
      };

      setData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset data');
    } finally {
      setLoading(false);
    }
  }, [ticker, assetType, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
