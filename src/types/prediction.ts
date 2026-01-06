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

export type PredictionBucket = '+10%' | '+20%' | '+30%' | '+40%' | '+50%+' | '-10%' | '-20%' | '-30%' | '-40%' | '-50%+';

export interface ScenarioPrediction {
  id: string;
  user_id: string;
  asset_ticker: string;
  asset_type: string;
  bullish_target_price: number;
  bearish_target_price: number;
  bullish_bucket: string;
  bearish_bucket: string;
  bullish_probability: number;
  bearish_probability: number;
  reasoning_tags: PredictionReasoning[];
  risk_score: number;
  comment: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface AggregatedScenarioData {
  total_active: number;
  bullish_weight: number; // average bullish probability
  bearish_weight: number;
  bullish_median_target: number;
  bearish_median_target: number;
  bullish_percentiles: { p25: number; p75: number };
  bearish_percentiles: { p25: number; p75: number };
  bucket_distribution: Record<string, number>;
  reasoning_breakdown: Record<PredictionReasoning, number>;
  avg_risk: number;
}

export const BUCKET_LABELS: PredictionBucket[] = [
  '+10%', '+20%', '+30%', '+40%', '+50%+',
  '-10%', '-20%', '-30%', '-40%', '-50%+'
];
