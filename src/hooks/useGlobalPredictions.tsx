import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { type ScenarioPrediction } from '@/types/prediction';

export function useGlobalPredictions() {
    const { user } = useAuth();
    const [activePredictions, setActivePredictions] = useState<ScenarioPrediction[]>([]);
    const [history, setHistory] = useState<ScenarioPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGlobalData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const now = new Date().toISOString();

            // Fetch ALL user predictions
            const { data, error: fetchError } = await (supabase as any)
                .from('scenario_predictions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const allPreds = (data || []) as ScenarioPrediction[];

            const active = allPreds.filter(p => p.is_active && new Date(p.expires_at) > new Date());
            const historical = allPreds.filter(p => !(p.is_active && new Date(p.expires_at) > new Date()));

            setActivePredictions(active);
            setHistory(historical);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch global predictions');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchGlobalData();
    }, [fetchGlobalData]);

    const metrics = {
        totalActive: activePredictions.length,
        uniqueAssets: new Set(activePredictions.map(p => p.asset_ticker)).size,
        soonestExpiry: activePredictions.length > 0
            ? new Date(Math.min(...activePredictions.map(p => new Date(p.expires_at).getTime())))
            : null
    };

    return {
        activePredictions,
        history,
        loading,
        error,
        metrics,
        refetch: fetchGlobalData
    };
}
