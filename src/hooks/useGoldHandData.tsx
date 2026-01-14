import { useState, useEffect, useCallback } from 'react';

export type AssetType = 'stocks' | 'crypto' | 'commodities';
export type Timeframe = 'daily' | 'weekly';
export type TrendFilter = 'all' | 'bullish' | 'bearish' | 'neutral';
export type TimeSinceFilter = 'all' | '7' | '30' | '90';

export interface GoldHandAsset {
  ticker: string;
  name: string;
  collected_at: string;
  price: number;
  ghl_color: 'gold' | 'blue' | 'grey' | 'gray';
  ghl_status: string;
  ghl_days_since_change: number;
  ghl_last_change_date: string;
  ghl_change_percent: number;
  rsi: number;
  sector?: string;
  industry?: string;
  tradingview_id?: string;
  market_capitalization?: string | number;
  commodity_name?: string;

  // Technical Indicators
  sma_50?: number;
  sma_100?: number;
  sma_200?: number;
  diff_sma50?: number;
  diff_sma100?: number;
  diff_sma200?: number;
  bb_mid?: number;
  bb_upper?: number;
  bb_lower?: number;
  diff_upper_bb?: number;
  diff_lower_bb?: number;

  // RSI Stats
  rsi_days_since_last_change?: number;
  rsi_change_percent_from_last_change?: number;

  // Max/Min Analysis
  last_max?: number;
  fell_from_last_max?: number;
  last_local_min_date?: string;
  last_local_min_price?: number;
  days_after_last_local_min?: number;
  percent_change_from_last_local_min?: number;
  last_local_max_date?: string;
  last_local_max_price?: number;
  days_after_last_local_max?: number;
  percent_fall_from_last_local_max?: number;

  // Fundamental Data
  price_per_earning?: number;
  earnings_per_share_basic_ttm?: number;
  number_of_employees?: number;
}

interface UseGoldHandDataResult {
  data: GoldHandAsset[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  stats: {
    total: number;
    bullish: number;
    bearish: number;
    neutral: number;
  };
  refetch: () => void;
}

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/misrori/goldhand_data_collect/main';

const parseCSV = (csvText: string): GoldHandAsset[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const assets: GoldHandAsset[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const ghlColor = (row['ghl_color'] || 'grey').toLowerCase() as 'gold' | 'blue' | 'grey' | 'gray';

    assets.push({
      ticker: row['ticker'] || '',
      name: row['name'] || row['ticker'] || '',
      collected_at: row['collected_at'] || '',
      price: parseFloat(row['close']) || 0,
      ghl_color: ghlColor === 'gray' ? 'grey' : ghlColor,
      ghl_status: row['ghl_status'] || '',
      ghl_days_since_change: parseInt(row['ghl_days_since_last_change']) || 0,
      ghl_last_change_date: row['ghl_last_change_date'] || '',
      ghl_change_percent: parseFloat(row['ghl_change_percent_from_last_change']) || 0,
      rsi: parseFloat(row['rsi']) || 0,
      sector: row['sector'] || undefined,
      industry: row['industry'] || undefined,
      tradingview_id: row['tradingview_id'] || undefined,
      market_capitalization: row['market_capitalization'] || undefined,
      commodity_name: row['commodity_name'] || undefined,

      // Technicals
      sma_50: parseFloat(row['sma_50']) || undefined,
      sma_100: parseFloat(row['sma_100']) || undefined,
      sma_200: parseFloat(row['sma_200']) || undefined,
      diff_sma50: parseFloat(row['diff_sma50']) || undefined,
      diff_sma100: parseFloat(row['diff_sma100']) || undefined,
      diff_sma200: parseFloat(row['diff_sma200']) || undefined,
      bb_mid: parseFloat(row['bb_mid']) || undefined,
      bb_upper: parseFloat(row['bb_upper']) || undefined,
      bb_lower: parseFloat(row['bb_lower']) || undefined,
      diff_upper_bb: parseFloat(row['diff_upper_bb']) || undefined,
      diff_lower_bb: parseFloat(row['diff_lower_bb']) || undefined,

      // RSI Stats
      rsi_days_since_last_change: parseInt(row['rsi_days_since_last_change']) || undefined,
      rsi_change_percent_from_last_change: parseFloat(row['rsi_change_percent_from_last_change']) || undefined,

      // Max/Min Analysis
      last_max: parseFloat(row['last_max']) || undefined,
      fell_from_last_max: parseFloat(row['fell_from_last_max']) || undefined,
      last_local_min_date: row['last_local_min_date'] || undefined,
      last_local_min_price: parseFloat(row['last_local_min_price']) || undefined,
      days_after_last_local_min: parseInt(row['days_after_last_local_min']) || undefined,
      percent_change_from_last_local_min: parseFloat(row['percent_change_from_last_local_min']) || undefined,
      last_local_max_date: row['last_local_max_date'] || undefined,
      last_local_max_price: parseFloat(row['last_local_max_price']) || undefined,
      days_after_last_local_max: parseInt(row['days_after_last_local_max']) || undefined,
      percent_fall_from_last_local_max: parseFloat(row['percent_fall_from_last_local_max']) || undefined,

      // Fundamentals
      price_per_earning: parseFloat(row['price_per_earning']) || undefined,
      earnings_per_share_basic_ttm: parseFloat(row['earnings_per_share_basic_ttm']) || undefined,
      number_of_employees: parseFloat(row['number_of_employees']) || undefined,
    });
  }

  return assets;
};

const getFileUrl = (assetType: AssetType, timeframe: Timeframe): string => {
  const folderName = timeframe === 'daily' ? 'summary_data_daily' : 'summary_data_weekly';
  const fileName = assetType === 'stocks' ? 'stock_summary_df.csv'
    : assetType === 'crypto' ? 'crypto_summary_df.csv'
      : 'commodity_summary_df.csv';
  return `${GITHUB_BASE_URL}/${folderName}/${fileName}`;
};

export const useGoldHandData = (
  assetType: AssetType,
  timeframe: Timeframe,
  trendFilter: TrendFilter = 'all',
  timeSinceFilter: TimeSinceFilter = 'all'
): UseGoldHandDataResult => {
  const [rawData, setRawData] = useState<GoldHandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = getFileUrl(assetType, timeframe);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      if (parsedData.length > 0 && parsedData[0].collected_at) {
        setLastUpdate(parsedData[0].collected_at);
      }

      setRawData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [assetType, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = rawData.filter((asset) => {
    // Trend filter
    let matchesTrend = true;
    if (trendFilter === 'bullish') matchesTrend = asset.ghl_color === 'gold';
    else if (trendFilter === 'bearish') matchesTrend = asset.ghl_color === 'blue';
    else if (trendFilter === 'neutral') matchesTrend = asset.ghl_color === 'grey';

    // Time since filter
    let matchesTime = true;
    if (timeSinceFilter !== 'all') {
      const days = parseInt(timeSinceFilter);
      matchesTime = asset.ghl_days_since_change <= days;
    }

    return matchesTrend && matchesTime;
  });

  const stats = {
    total: rawData.length,
    bullish: rawData.filter(a => a.ghl_color === 'gold').length,
    bearish: rawData.filter(a => a.ghl_color === 'blue').length,
    neutral: rawData.filter(a => a.ghl_color === 'grey').length,
  };

  return {
    data: filteredData,
    loading,
    error,
    lastUpdate,
    stats,
    refetch: fetchData,
  };
};
