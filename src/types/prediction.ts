export type PredictionDirection = 'long' | 'short' | 'neutral';

export type PredictionHorizon = '1_week' | '1_month' | '3_months' | '1_year';

export type PredictionReasoning = 
  | 'technical_analysis'
  | 'fundamental_analysis'
  | 'macro_rates'
  | 'news_events'
  | 'momentum_trend'
  | 'onchain_flow'
  | 'intuition_experience';

export interface Prediction {
  id: string;
  user_id: string;
  asset_ticker: string;
  asset_type: string;
  direction: PredictionDirection;
  horizon: PredictionHorizon;
  expected_move_bucket: number;
  precise_target_price: number | null;
  current_price_at_prediction: number;
  risk_score: number;
  reasoning_tags: PredictionReasoning[];
  comment: string | null;
  created_at: string;
  valid_until: string;
  is_evaluated: boolean;
  direction_correct: boolean | null;
  price_error_percent: number | null;
}

export interface PredictionFormData {
  direction: PredictionDirection;
  horizons: PredictionHorizon[];
  buckets: Record<PredictionHorizon, number>;
  precisePrices: Record<PredictionHorizon, number | null>;
  riskScore: number;
  reasoningTags: PredictionReasoning[];
  comment: string;
}

export interface AggregatedPredictions {
  horizon: PredictionHorizon;
  totalCount: number;
  directionDistribution: {
    long: number;
    short: number;
    neutral: number;
  };
  bucketDistribution: Record<number, number>;
  targetPrices: {
    median: number | null;
    percentile25: number | null;
    percentile75: number | null;
    all: number[];
  };
  avgRiskScore: number;
  reasoningBreakdown: Record<PredictionReasoning, number>;
}

export const HORIZON_LABELS: Record<PredictionHorizon, string> = {
  '1_week': '1 Week',
  '1_month': '1 Month',
  '3_months': '3 Months',
  '1_year': '1 Year',
};

export const HORIZON_DAYS: Record<PredictionHorizon, number> = {
  '1_week': 7,
  '1_month': 30,
  '3_months': 90,
  '1_year': 365,
};

export const REASONING_LABELS: Record<PredictionReasoning, string> = {
  'technical_analysis': 'Technical Analysis',
  'fundamental_analysis': 'Fundamental Analysis',
  'macro_rates': 'Macro / Rates',
  'news_events': 'News / Events',
  'momentum_trend': 'Momentum / Trend',
  'onchain_flow': 'On-chain / Flow',
  'intuition_experience': 'Intuition / Experience',
};

export const MOVE_BUCKETS = [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
