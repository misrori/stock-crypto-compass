import { useState, useEffect, useCallback } from 'react';

export type AssetType = 'stocks' | 'crypto' | 'commodities';
export type Timeframe = 'daily' | 'weekly';
export type TrendFilter = 'all' | 'bullish' | 'bearish' | 'neutral';

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
    
    const ghlColor = (row['extra_ghl_color'] || 'grey').toLowerCase() as 'gold' | 'blue' | 'grey' | 'gray';
    
    assets.push({
      ticker: row['ticker'] || '',
      name: row['name'] || row['ticker'] || '',
      collected_at: row['collected_at'] || '',
      price: parseFloat(row['price_last_close']) || 0,
      ghl_color: ghlColor === 'gray' ? 'grey' : ghlColor,
      ghl_status: row['extra_ghl_status'] || '',
      ghl_days_since_change: parseInt(row['extra_ghl_days_since_last_change']) || 0,
      ghl_last_change_date: row['extra_ghl_last_change_date'] || '',
      ghl_change_percent: parseFloat(row['extra_ghl_change_percent_from_last_change']) || 0,
      rsi: parseFloat(row['ind_latest_rsi']) || 0,
      sector: row['extra_sector'] || undefined,
      industry: row['extra_industry'] || undefined,
    });
  }
  
  return assets;
};

const getFileUrl = (assetType: AssetType, timeframe: Timeframe): string => {
  return `${GITHUB_BASE_URL}/${assetType}_${timeframe}.csv`;
};

export const useGoldHandData = (
  assetType: AssetType,
  timeframe: Timeframe,
  trendFilter: TrendFilter = 'all'
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
    if (trendFilter === 'all') return true;
    if (trendFilter === 'bullish') return asset.ghl_color === 'gold';
    if (trendFilter === 'bearish') return asset.ghl_color === 'blue';
    if (trendFilter === 'neutral') return asset.ghl_color === 'grey';
    return true;
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
