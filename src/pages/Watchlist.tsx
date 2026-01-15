import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, BarChart3, Bitcoin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useGoldHandData, type AssetType, type Timeframe } from '@/hooks/useGoldHandData';
import { ScannerTable } from '@/components/ScannerTable';

const WatchlistPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { watchlist, loading: watchlistLoading } = useWatchlist();
    const [timeframe, setTimeframe] = useState<Timeframe>('daily');

    // Fetch data for all types to filter by watchlist
    const { data: stocksData, loading: stocksLoading } = useGoldHandData('stocks', timeframe, 'all', 'all');
    const { data: cryptoData, loading: cryptoLoading } = useGoldHandData('crypto', timeframe, 'all', 'all');
    const { data: commoditiesData, loading: commoditiesLoading } = useGoldHandData('commodities', timeframe, 'all', 'all');

    const isLoading = authLoading || watchlistLoading || stocksLoading || cryptoLoading || commoditiesLoading;

    const filteredWatchlist = useMemo(() => {
        const stockTickers = watchlist.filter(w => w.asset_type === 'stocks').map(w => w.asset_ticker);
        const cryptoTickers = watchlist.filter(w => w.asset_type === 'crypto').map(w => w.asset_ticker);
        const commodityTickers = watchlist.filter(w => w.asset_type === 'commodities').map(w => w.asset_ticker);

        return {
            stocks: stocksData.filter(a => stockTickers.includes(a.ticker)),
            crypto: cryptoData.filter(a => cryptoTickers.includes(a.ticker)),
            commodities: commoditiesData.filter(a => commodityTickers.includes(a.ticker))
        };
    }, [watchlist, stocksData, cryptoData, commoditiesData]);

    const timeframeToggle = (
        <ToggleGroup
            type="single"
            value={timeframe}
            onValueChange={(value) => value && setTimeframe(value as Timeframe)}
            className="bg-muted/30 p-1 rounded-lg border border-border/50 scale-90 origin-right"
        >
            <ToggleGroupItem
                value="daily"
                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-all"
            >
                Daily
            </ToggleGroupItem>
            <ToggleGroupItem
                value="weekly"
                className="px-3 py-1 text-[10px] font-black uppercase tracking-widest data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-all"
            >
                Weekly
            </ToggleGroupItem>
        </ToggleGroup>
    );

    let timeframeRendered = false;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <Skeleton className="h-12 w-48 mb-8" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!user) {
        navigate('/auth');
        return null;
    }

    const hasAnyInWatchlist = watchlist.length > 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">My Watchlist</h1>
                            <p className="text-sm text-muted-foreground">
                                Track your favorited assets
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 space-y-12">
                {!hasAnyInWatchlist ? (
                    <Card className="bg-card/40 border-dashed border-2 border-border p-12 text-center">
                        <Star className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Your watchlist is empty</h2>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            Star assets in the scanner to track them here across different categories.
                        </p>
                        <Button onClick={() => navigate('/scanner')}>
                            Go to Scanner
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-12 pb-12">
                        {/* Crypto Section */}
                        {filteredWatchlist.crypto.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                            <Bitcoin className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-xl font-black uppercase tracking-tight">Crypto</h2>
                                        <span className="text-xs font-bold text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded-full">
                                            {filteredWatchlist.crypto.length}
                                        </span>
                                    </div>

                                    {/* Global Timeframe Toggle */}
                                    {!timeframeRendered && (timeframeRendered = true) && timeframeToggle}
                                </div>
                                <ScannerTable
                                    data={filteredWatchlist.crypto}
                                    assetType="crypto"
                                    loading={false}
                                />
                            </section>
                        )}

                        {/* Stocks Section */}
                        {filteredWatchlist.stocks.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                            <BarChart3 className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-xl font-black uppercase tracking-tight">Stocks</h2>
                                        <span className="text-xs font-bold text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded-full">
                                            {filteredWatchlist.stocks.length}
                                        </span>
                                    </div>

                                    {!timeframeRendered && (timeframeRendered = true) && timeframeToggle}
                                </div>
                                <ScannerTable
                                    data={filteredWatchlist.stocks}
                                    assetType="stocks"
                                    loading={false}
                                />
                            </section>
                        )}

                        {/* Commodities Section */}
                        {filteredWatchlist.commodities.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-xl font-black uppercase tracking-tight">Commodities</h2>
                                        <span className="text-xs font-bold text-muted-foreground/60 bg-muted/20 px-2 py-0.5 rounded-full">
                                            {filteredWatchlist.commodities.length}
                                        </span>
                                    </div>

                                    {!timeframeRendered && (timeframeRendered = true) && timeframeToggle}
                                </div>
                                <ScannerTable
                                    data={filteredWatchlist.commodities}
                                    assetType="commodities"
                                    loading={false}
                                />
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WatchlistPage;
