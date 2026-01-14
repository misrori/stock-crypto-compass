import { useNavigate } from 'react-router-dom';
import {
    Target,
    History,
    TrendingUp,
    TrendingDown,
    Clock,
    Award,
    LayoutDashboard,
    ExternalLink,
    ChevronRight,
    Zap,
    MessageSquare
} from 'lucide-react';
import { useGlobalPredictions } from '@/hooks/useGlobalPredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PredictionHistory } from '@/components/PredictionHistory';
import { GlobalIdeaFeed } from '@/components/GlobalIdeaFeed';
import { AssetSearchModal } from '@/components/AssetSearchModal';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const Predictions = () => {
    const navigate = useNavigate();
    const { activePredictions, history, loading, metrics } = useGlobalPredictions();
    const [searchOpen, setSearchOpen] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                </div>
                <Skeleton className="h-96 rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container mx-auto px-4 py-12 space-y-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                            <Target className="w-10 h-10 text-primary" />
                            Scenario Center
                        </h1>
                        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">
                            Manage your market consciousness and active calls
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            className="h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Zap className="w-4 h-4 mr-2" />
                            Post Idea / New Call
                        </Button>
                        <Button variant="outline" className="h-12 rounded-xl group" onClick={() => navigate('/dashboard')}>
                            <LayoutDashboard className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                            Dashboard
                        </Button>
                    </div>
                </div>

                {/* Participation Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-border bg-card/40 backdrop-blur-xl rounded-3xl border-2 border-primary/5">
                        <CardContent className="p-6 flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Award className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Calls</div>
                                <div className="text-3xl font-black">{metrics.totalActive}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/40 backdrop-blur-xl rounded-3xl border-2 border-primary/5">
                        <CardContent className="p-6 flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assets Tracked</div>
                                <div className="text-3xl font-black">{metrics.uniqueAssets}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border bg-card/40 backdrop-blur-xl rounded-3xl border-2 border-primary/5">
                        <CardContent className="p-6 flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                <Clock className="w-8 h-8 text-rose-500" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Next Expiry</div>
                                <div className="text-sm font-black uppercase leading-tight">
                                    {metrics.soonestExpiry
                                        ? formatDistanceToNow(metrics.soonestExpiry, { addSuffix: true })
                                        : 'N/A'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Predictions Grid */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Active Scenarios
                    </h2>
                    {activePredictions.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-border/50 space-y-4">
                            <History className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                            <p className="text-muted-foreground font-medium italic">No active predictions. Express your market view to unlock collective consciousness.</p>
                            <Button
                                className="bg-primary hover:bg-primary/90 rounded-xl px-10 h-11 font-black uppercase tracking-widest"
                                onClick={() => setSearchOpen(true)}
                            >
                                <Target className="w-4 h-4 mr-2" /> Start First Prediction
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {activePredictions.map((pred) => {
                                const sentimentValue = pred.sentiment ?? (pred.bullish_probability ?? 50);
                                const isBullish = sentimentValue > 50;
                                const targetPrice = pred.target_price ?? (isBullish ? pred.bullish_target_price : pred.bearish_target_price);

                                return (
                                    <Card
                                        key={pred.id}
                                        className="group relative overflow-hidden border-border bg-card/40 backdrop-blur-md rounded-2xl border-2 hover:border-primary/20 transition-all cursor-pointer shadow-xl"
                                        onClick={() => navigate(`/scanner/${pred.asset_type}/${encodeURIComponent(pred.asset_ticker)}`)}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CardHeader className="p-5 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <Badge variant="outline" className="text-[8px] font-black tracking-widest uppercase border-primary/20 text-primary">{pred.asset_type}</Badge>
                                                    <CardTitle className="text-2xl font-black leading-none">{pred.asset_ticker}</CardTitle>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-all" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-5 pt-4 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className={`text-[9px] font-bold uppercase transition-colors ${isBullish ? 'text-emerald-500' : sentimentValue < 50 ? 'text-rose-500' : 'text-primary'}`}>
                                                        {isBullish ? 'Bullish Target' : sentimentValue < 50 ? 'Bearish Target' : 'Neutral Target'}
                                                    </span>
                                                    <span className="text-2xl font-black leading-tight">${targetPrice?.toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden flex mb-1 border border-border/20">
                                                        <div className="bg-rose-500 transition-all duration-1000" style={{ width: `${100 - sentimentValue}%` }} />
                                                        <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${sentimentValue}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-muted-foreground">{sentimentValue}%</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-bold py-2 border-t border-border/40">
                                                <span className="text-muted-foreground uppercase tracking-widest">{formatDistanceToNow(new Date(pred.expires_at), { addSuffix: false })} left</span>
                                                <div className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-lg ${isBullish ? 'bg-emerald-500 shadow-emerald-500/50' : sentimentValue < 50 ? 'bg-rose-500 shadow-rose-500/50' : 'bg-primary shadow-primary/50'}`} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Idea Feed */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-accent" />
                        Market Ideas Feed
                    </h2>
                    <GlobalIdeaFeed />
                </div>

                {/* History Log */}
                <div className="space-y-6 pt-12 border-t border-border/20">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        My Activity Log
                    </h2>
                    <PredictionHistory history={history} />
                </div>
            </div>

            <AssetSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
    );
};

export default Predictions;
