export type PredictionReasoning =
  | 'technical_analysis'
  | 'fundamental_analysis'
  | 'macro_rates'
  | 'news_events'
  | 'momentum_trend'
  | 'onchain_flow'
  | 'intuition_experience';

export const REASONING_LABELS: Record<PredictionReasoning, string> = {
  'technical_analysis': 'Technical Analysis',
  'fundamental_analysis': 'Fundamental Analysis',
  'macro_rates': 'Macro / Rates',
  'news_events': 'News / Events',
  'momentum_trend': 'Momentum / Trend',
  'onchain_flow': 'On-chain / Flow',
  'intuition_experience': 'Intuition / Experience',
};

/**
 * Clean data model for market consciousness / price tips.
 */
export interface ScenarioPrediction {
  id: string;
  user_id: string;
  asset_ticker: string;
  asset_type: string;
  sentiment: number;      // 0-100 (0=Bearish, 100=Bullish)
  target_price: number;   // The forecast price
  entry_price: number;    // Price at time of prediction
  comment: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

/**
 * Aggregated data from active market predictions.
 */
export interface AggregatedScenarioData {
  total_active: number;
  bullish_weight: number; // average bullish sentiment (%)
  bearish_weight: number;
  bullish_median_target: number;
  bearish_median_target: number;
  bullish_percentiles: { p25: number; p75: number };
  bearish_percentiles: { p25: number; p75: number };
  reasoning_breakdown: Record<string, number>;
  avg_risk: number;
}

/**
 * User watchlist item model.
 */
export interface WatchlistItem {
  id: string;
  user_id: string;
  asset_ticker: string;
  asset_type: string;
  created_at: string;
}
