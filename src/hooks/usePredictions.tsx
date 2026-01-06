import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { 
  Prediction, 
  PredictionDirection, 
  PredictionHorizon, 
  PredictionReasoning,
  AggregatedPredictions,
  HORIZON_DAYS 
} from '@/types/prediction';

interface UsePredictionsResult {
  userPredictions: Prediction[];
  aggregatedData: Record<PredictionHorizon, AggregatedPredictions | null>;
  loading: boolean;
  error: string | null;
  submitPrediction: (data: SubmitPredictionData) => Promise<{ error: Error | null }>;
  hasActivePrediction: (horizon: PredictionHorizon) => boolean;
  refetch: () => void;
}

interface SubmitPredictionData {
  assetTicker: string;
  assetType: string;
  currentPrice: number;
  direction: PredictionDirection;
  horizon: PredictionHorizon;
  expectedMoveBucket: number;
  preciseTargetPrice: number | null;
  riskScore: number;
  reasoningTags: PredictionReasoning[];
  comment: string | null;
}

const HORIZON_DAYS_MAP: Record<PredictionHorizon, number> = {
  '1_week': 7,
  '1_month': 30,
  '3_months': 90,
  '1_year': 365,
};

export function usePredictions(assetTicker: string, assetType: string): UsePredictionsResult {
  const { user } = useAuth();
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user's predictions for this asset
      const { data: userPreds, error: userError } = await (supabase as any)
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_ticker', assetTicker)
        .eq('asset_type', assetType)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Fetch all active predictions for aggregation
      const now = new Date().toISOString();
      const { data: allPreds, error: allError } = await (supabase as any)
        .from('predictions')
        .select('*')
        .eq('asset_ticker', assetTicker)
        .eq('asset_type', assetType)
        .gt('valid_until', now);

      if (allError) throw allError;

      setUserPredictions((userPreds || []) as Prediction[]);
      setAllPredictions((allPreds || []) as Prediction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  }, [user, assetTicker, assetType]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const hasActivePrediction = useCallback((horizon: PredictionHorizon): boolean => {
    const now = new Date();
    return userPredictions.some(
      p => p.horizon === horizon && new Date(p.valid_until) > now
    );
  }, [userPredictions]);

  const getAggregatedData = useCallback((): Record<PredictionHorizon, AggregatedPredictions | null> => {
    const horizons: PredictionHorizon[] = ['1_week', '1_month', '3_months', '1_year'];
    const result: Record<PredictionHorizon, AggregatedPredictions | null> = {
      '1_week': null,
      '1_month': null,
      '3_months': null,
      '1_year': null,
    };

    horizons.forEach(horizon => {
      // Only show aggregated data if user has active prediction for this horizon
      if (!hasActivePrediction(horizon)) {
        return;
      }

      const horizonPredictions = allPredictions.filter(p => p.horizon === horizon);
      if (horizonPredictions.length === 0) {
        return;
      }

      // Direction distribution
      const directionDistribution = {
        long: horizonPredictions.filter(p => p.direction === 'long').length,
        short: horizonPredictions.filter(p => p.direction === 'short').length,
        neutral: horizonPredictions.filter(p => p.direction === 'neutral').length,
      };

      // Bucket distribution
      const bucketDistribution: Record<number, number> = {};
      horizonPredictions.forEach(p => {
        bucketDistribution[p.expected_move_bucket] = (bucketDistribution[p.expected_move_bucket] || 0) + 1;
      });

      // Target prices statistics
      const targetPrices = horizonPredictions
        .map(p => p.precise_target_price)
        .filter((p): p is number => p !== null)
        .sort((a, b) => a - b);

      const median = targetPrices.length > 0 
        ? targetPrices[Math.floor(targetPrices.length / 2)] 
        : null;
      const percentile25 = targetPrices.length >= 4 
        ? targetPrices[Math.floor(targetPrices.length * 0.25)] 
        : null;
      const percentile75 = targetPrices.length >= 4 
        ? targetPrices[Math.floor(targetPrices.length * 0.75)] 
        : null;

      // Average risk score
      const avgRiskScore = horizonPredictions.reduce((acc, p) => acc + p.risk_score, 0) / horizonPredictions.length;

      // Reasoning breakdown
      const reasoningBreakdown: Record<PredictionReasoning, number> = {
        'technical_analysis': 0,
        'fundamental_analysis': 0,
        'macro_rates': 0,
        'news_events': 0,
        'momentum_trend': 0,
        'onchain_flow': 0,
        'intuition_experience': 0,
      };
      horizonPredictions.forEach(p => {
        (p.reasoning_tags as PredictionReasoning[]).forEach(tag => {
          reasoningBreakdown[tag] = (reasoningBreakdown[tag] || 0) + 1;
        });
      });

      result[horizon] = {
        horizon,
        totalCount: horizonPredictions.length,
        directionDistribution,
        bucketDistribution,
        targetPrices: {
          median,
          percentile25,
          percentile75,
          all: targetPrices,
        },
        avgRiskScore,
        reasoningBreakdown,
      };
    });

    return result;
  }, [allPredictions, hasActivePrediction]);

  const submitPrediction = async (data: SubmitPredictionData): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Must be logged in to submit prediction') };
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + HORIZON_DAYS_MAP[data.horizon]);

    try {
      const { error: insertError } = await (supabase as any)
        .from('predictions')
        .insert({
          user_id: user.id,
          asset_ticker: data.assetTicker,
          asset_type: data.assetType,
          direction: data.direction,
          horizon: data.horizon,
          expected_move_bucket: data.expectedMoveBucket,
          precise_target_price: data.preciseTargetPrice,
          current_price_at_prediction: data.currentPrice,
          risk_score: data.riskScore,
          reasoning_tags: data.reasoningTags,
          comment: data.comment,
          valid_until: validUntil.toISOString(),
        });

      if (insertError) throw insertError;

      await fetchPredictions();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to submit prediction') };
    }
  };

  return {
    userPredictions,
    aggregatedData: getAggregatedData(),
    loading,
    error,
    submitPrediction,
    hasActivePrediction,
    refetch: fetchPredictions,
  };
}
