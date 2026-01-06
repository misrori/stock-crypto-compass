import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  ScenarioPrediction,
  AggregatedScenarioData,
  PredictionReasoning,
  PredictionBucket
} from '@/types/prediction';

interface UsePredictionsResult {
  userActivePrediction: ScenarioPrediction | null;
  history: ScenarioPrediction[];
  aggregatedData: AggregatedScenarioData | null;
  loading: boolean;
  error: string | null;
  submitPrediction: (data: SubmitScenarioPredictionData) => Promise<{ error: Error | null }>;
  isLocked: boolean;
  refetch: () => void;
}

interface SubmitScenarioPredictionData {
  assetTicker: string;
  assetType: string;
  bullishTarget: number;
  bearishTarget: number;
  bullishBucket: PredictionBucket;
  bearishBucket: PredictionBucket;
  bullishProbability: number;
  bearishProbability: number;
  riskScore: number;
  reasoningTags: PredictionReasoning[];
  comment: string | null;
}

export function usePredictions(assetTicker: string, assetType: string): UsePredictionsResult {
  const { user } = useAuth();
  const [userActivePrediction, setUserActivePrediction] = useState<ScenarioPrediction | null>(null);
  const [history, setHistory] = useState<ScenarioPrediction[]>([]);
  const [allActivePredictions, setAllActivePredictions] = useState<ScenarioPrediction[]>([]);
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
      const now = new Date().toISOString();

      // Fetch user's history for this asset
      const { data: userPreds, error: userError } = await (supabase as any)
        .from('scenario_predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_ticker', assetTicker)
        .eq('asset_type', assetType)
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      const userHistory = (userPreds || []) as ScenarioPrediction[];
      setHistory(userHistory);

      // Find active user prediction (is_active = true AND not expired)
      const active = userHistory.find(p => p.is_active && new Date(p.expires_at) > new Date());
      setUserActivePrediction(active || null);

      // Fetch all active predictions for aggregation
      const { data: allPreds, error: allError } = await (supabase as any)
        .from('scenario_predictions')
        .select('*')
        .eq('asset_ticker', assetTicker)
        .eq('asset_type', assetType)
        .eq('is_active', true)
        .gt('expires_at', now);

      if (allError) throw allError;

      setAllActivePredictions((allPreds || []) as ScenarioPrediction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  }, [user, assetTicker, assetType]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const isLocked = !userActivePrediction;

  const calculateAggregatedData = (): AggregatedScenarioData | null => {
    if (isLocked || allActivePredictions.length === 0) return null;

    const total = allActivePredictions.length;
    let totalBullProb = 0;
    let totalBearProb = 0;
    let totalRisk = 0;
    const bullTargets: number[] = [];
    const bearTargets: number[] = [];
    const bucketDist: Record<string, number> = {};
    const reasoningDist: Record<string, number> = {};

    allActivePredictions.forEach(p => {
      totalBullProb += p.bullish_probability;
      totalBearProb += p.bearish_probability;
      totalRisk += p.risk_score;
      bullTargets.push(p.bullish_target_price);
      bearTargets.push(p.bearish_target_price);

      bucketDist[p.bullish_bucket] = (bucketDist[p.bullish_bucket] || 0) + 1;
      bucketDist[p.bearish_bucket] = (bucketDist[p.bearish_bucket] || 0) + 1;

      p.reasoning_tags.forEach(tag => {
        reasoningDist[tag] = (reasoningDist[tag] || 0) + 1;
      });
    });

    const sortNumeric = (a: number, b: number) => a - b;
    bullTargets.sort(sortNumeric);
    bearTargets.sort(sortNumeric);

    const getMedian = (arr: number[]) => arr[Math.floor(arr.length / 2)];
    const getPercentile = (arr: number[], q: number) => arr[Math.floor(arr.length * q)];

    return {
      total_active: total,
      bullish_weight: totalBullProb / total,
      bearish_weight: totalBearProb / total,
      bullish_median_target: getMedian(bullTargets),
      bearish_median_target: getMedian(bearTargets),
      bullish_percentiles: {
        p25: getPercentile(bullTargets, 0.25),
        p75: getPercentile(bullTargets, 0.75)
      },
      bearish_percentiles: {
        p25: getPercentile(bearTargets, 0.25),
        p75: getPercentile(bearTargets, 0.75)
      },
      bucket_distribution: bucketDist,
      reasoning_breakdown: reasoningDist as Record<PredictionReasoning, number>,
      avg_risk: totalRisk / total
    };
  };

  const submitPrediction = async (data: SubmitScenarioPredictionData): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Must be logged in') };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      const { error: insertError } = await (supabase as any)
        .from('scenario_predictions')
        .insert({
          user_id: user.id,
          asset_ticker: data.assetTicker,
          asset_type: data.assetType,
          bullish_target_price: data.bullishTarget,
          bearish_target_price: data.bearishTarget,
          bullish_bucket: data.bullishBucket,
          bearish_bucket: data.bearishBucket,
          bullish_probability: data.bullishProbability,
          bearish_probability: data.bearishProbability,
          risk_score: data.riskScore,
          reasoning_tags: data.reasoningTags,
          comment: data.comment,
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (insertError) throw insertError;

      await fetchPredictions();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Failed to submit prediction') };
    }
  };

  return {
    userActivePrediction,
    history,
    aggregatedData: calculateAggregatedData(),
    loading,
    error,
    submitPrediction,
    isLocked,
    refetch: fetchPredictions
  };
}
