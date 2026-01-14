import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type {
  ScenarioPrediction,
  AggregatedScenarioData
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
  sentiment: number;
  targetPrice: number;
  entryPrice: number;
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
        .from('market_predictions')
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
        .from('market_predictions')
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
    let totalSentiment = 0;

    const bullishTargets: number[] = [];
    const bearishTargets: number[] = [];

    allActivePredictions.forEach(p => {
      totalSentiment += p.sentiment;

      if (p.sentiment > 50) {
        bullishTargets.push(p.target_price);
      } else if (p.sentiment < 50) {
        bearishTargets.push(p.target_price);
      } else {
        bullishTargets.push(p.target_price);
        bearishTargets.push(p.target_price);
      }
    });

    const sortNumeric = (a: number, b: number) => a - b;
    bullishTargets.sort(sortNumeric);
    bearishTargets.sort(sortNumeric);

    const getMedian = (arr: number[]) => arr.length > 0 ? arr[Math.floor(arr.length / 2)] : 0;
    const getPercentile = (arr: number[], q: number) => arr.length > 0 ? arr[Math.floor(arr.length * q)] : 0;

    return {
      total_active: total,
      bullish_weight: totalSentiment / total,
      bearish_weight: 100 - (totalSentiment / total),
      bullish_median_target: getMedian(bullishTargets),
      bearish_median_target: getMedian(bearishTargets),
      bullish_percentiles: {
        p25: getPercentile(bullishTargets, 0.25),
        p75: getPercentile(bullishTargets, 0.75)
      },
      bearish_percentiles: {
        p25: getPercentile(bearishTargets, 0.25),
        p75: getPercentile(bearishTargets, 0.75)
      },
      reasoning_breakdown: {},
      avg_risk: 0
    };
  };

  const submitPrediction = async (data: SubmitScenarioPredictionData): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Must be logged in') };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
      const { error: insertError } = await (supabase as any)
        .from('market_predictions')
        .insert({
          user_id: user.id,
          asset_ticker: data.assetTicker,
          asset_type: data.assetType,
          sentiment: data.sentiment,
          target_price: data.targetPrice,
          entry_price: data.entryPrice,
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
