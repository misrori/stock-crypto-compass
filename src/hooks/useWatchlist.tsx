import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { type WatchlistItem } from '@/types/prediction';
import { toast } from 'sonner';

export const useWatchlist = () => {
    const { user } = useAuth();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWatchlist = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_watchlist' as any)
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            setWatchlist((data as any) || []);
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    const addToWatchlist = async (assetTicker: string, assetType: string) => {
        if (!user) {
            toast.error('Please log in to manage your watchlist');
            return;
        }

        try {
            const { error } = await supabase
                .from('user_watchlist' as any)
                .insert({
                    user_id: user.id,
                    asset_ticker: assetTicker,
                    asset_type: assetType,
                });

            if (error) throw error;

            await fetchWatchlist();
            toast.success(`${assetTicker} added to watchlist`);
        } catch (error: any) {
            if (error.code === '23505') { // Unique constraint violation
                toast.error('Asset already in watchlist');
            } else {
                toast.error('Failed to add to watchlist');
            }
        }
    };

    const removeFromWatchlist = async (assetTicker: string, assetType: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('user_watchlist' as any)
                .delete()
                .eq('user_id', user.id)
                .eq('asset_ticker', assetTicker)
                .eq('asset_type', assetType);

            if (error) throw error;

            await fetchWatchlist();
            toast.success(`${assetTicker} removed from watchlist`);
        } catch (error) {
            toast.error('Failed to remove from watchlist');
        }
    };

    const isInWatchlist = (assetTicker: string, assetType: string) => {
        return watchlist.some(item =>
            item.asset_ticker === assetTicker &&
            item.asset_type === assetType
        );
    };

    const toggleWatchlist = async (assetTicker: string, assetType: string) => {
        if (isInWatchlist(assetTicker, assetType)) {
            await removeFromWatchlist(assetTicker, assetType);
        } else {
            await addToWatchlist(assetTicker, assetType);
        }
    };

    return {
        watchlist,
        loading,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        toggleWatchlist,
        refetch: fetchWatchlist
    };
};
