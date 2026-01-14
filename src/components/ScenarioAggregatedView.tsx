import {
    Lock,
    Users,
    TrendingUp,
    TrendingDown,
    BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    type AggregatedScenarioData
} from '@/types/prediction';

interface ScenarioAggregatedViewProps {
    data: AggregatedScenarioData | null;
    isLocked: boolean;
}

export function ScenarioAggregatedView({ data, isLocked }: ScenarioAggregatedViewProps) {
    if (isLocked) {
        return (
            <Card className="border-border bg-card/40 backdrop-blur-xl h-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center relative z-10 min-h-[400px]">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                        <Lock className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Crowd Sentiment Locked</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-8">
                        The market consciousness is hidden. Submit your tip to unlock current bullish/bearish expectations.
                    </p>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary">Anti-Free-Rider Mode</Badge>
                    </div>
                </CardContent>
                {/* Mock background content blurred */}
                <div className="absolute inset-0 opacity-10 blur-xl pointer-events-none select-none">
                    <div className="w-full h-full flex flex-col gap-8 p-8">
                        <div className="h-10 w-full bg-foreground rounded-lg" />
                        <div className="h-40 w-full bg-foreground rounded-lg" />
                        <div className="h-20 w-full bg-foreground rounded-lg" />
                    </div>
                </div>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card className="border-border bg-card/40 backdrop-blur-xl h-full flex items-center justify-center p-8 min-h-[400px]">
                <div className="text-center space-y-4">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">No active tips yet</p>
                </div>
            </Card>
        );
    }

    const {
        total_active,
        bullish_weight,
        bearish_weight,
        bullish_median_target,
        bearish_median_target,
        bullish_percentiles,
        bearish_percentiles
    } = data;

    return (
        <Card className="border-border bg-card/40 backdrop-blur-xl h-full relative overflow-hidden border-2 border-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            <CardContent className="p-8 relative z-10 space-y-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Market Consciousness</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> {total_active} PARTICIPANTS (Active last 7 days)
                        </p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black tracking-widest">UNLOCKED</Badge>
                </div>

                {/* Probability Weight */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="text-left">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500/70">Bearish Weight</span>
                            <div className="text-4xl font-black text-rose-500">{Math.round(bearish_weight)}%</div>
                        </div>
                        <BarChart3 className="w-6 h-6 text-muted-foreground opacity-20" />
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Bullish Weight</span>
                            <div className="text-4xl font-black text-emerald-500">{Math.round(bullish_weight)}%</div>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-muted/30 rounded-full overflow-hidden flex border border-border/50">
                        <div className="bg-rose-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(244,63,94,0.4)]" style={{ width: `${bearish_weight}%` }} />
                        <div className="bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${bullish_weight}%` }} />
                    </div>
                </div>

                {/* Median Targets */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-3">
                        <div className="flex items-center gap-2 text-rose-400">
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Bearish Goal</span>
                        </div>
                        <div className="text-2xl font-black font-mono leading-none">${bearish_median_target.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                        <div className="text-[9px] text-rose-400/60 font-medium">Bands: ${bearish_percentiles.p25.toLocaleString()}—${bearish_percentiles.p75.toLocaleString()}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Bullish Goal</span>
                        </div>
                        <div className="text-2xl font-black font-mono leading-none">${bullish_median_target.toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                        <div className="text-[9px] text-emerald-400/60 font-medium">Bands: ${bullish_percentiles.p25.toLocaleString()}—${bullish_percentiles.p75.toLocaleString()}</div>
                    </div>
                </div>

                {/* Consensus Sentiment */}
                <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Market Mood</div>
                            <div className={`text-sm font-black uppercase ${bullish_weight > 55 ? 'text-emerald-500' : bearish_weight > 55 ? 'text-rose-500' : 'text-primary'}`}>
                                {bullish_weight > 60 ? 'Greedy' : bullish_weight > 52 ? 'Bullish' : bearish_weight > 60 ? 'Fearful' : bearish_weight > 52 ? 'Bearish' : 'Neutral'}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
