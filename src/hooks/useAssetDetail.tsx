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
  cumulative_result: number;
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
  };
  strategies: {
    goldhand_line: Strategy;
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

const getAssetFolder = (assetType: AssetType): string => {
  switch (assetType) {
    case 'stocks':
      return 'stocks';
    case 'crypto':
      return 'crypto';
    case 'commodities':
      return 'commodities';
    default:
      return 'stocks';
  }
};

export const useAssetDetail = (
  ticker: string,
  assetType: AssetType
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
      const folder = getAssetFolder(assetType);
      
      // Determine the file name based on asset type
      let fileName: string;
      if (assetType === 'commodities') {
        // Use the commodity file mapping
        fileName = COMMODITY_FILE_MAPPING[ticker] || ticker.replace(/=F$/, '').toLowerCase();
      } else if (assetType === 'crypto') {
        // Convert ticker format: ETH-USD -> ETH_USD for file names
        fileName = ticker.replace(/-/g, '_');
      } else {
        // Stocks use ticker directly
        fileName = ticker;
      }
      
      const encodedFileName = encodeURIComponent(fileName);
      const url = `${GITHUB_BASE_URL}/${folder}/${encodedFileName}.json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const jsonData: AssetDetail = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset data');
    } finally {
      setLoading(false);
    }
  }, [ticker, assetType]);

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
