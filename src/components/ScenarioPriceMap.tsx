import { useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Users
} from 'lucide-react';
import {
    type ScenarioPrediction,
    type AggregatedScenarioData
} from '@/types/prediction';

interface ScenarioPriceMapProps {
    currentPrice: number;
    userActivePrediction: ScenarioPrediction | null;
    aggregatedData: AggregatedScenarioData | null;
}

export function ScenarioPriceMap({
    currentPrice,
    userActivePrediction,
    aggregatedData
}: ScenarioPriceMapProps) {
    const mapData = useMemo(() => {
        if (!currentPrice) return null;

        const findRelative = (price: number) => ((price - currentPrice) / currentPrice) * 100;

        const items: { label: string; rel: number; type: 'user' | 'crowd'; direction: 'bull' | 'bear' }[] = [];

        if (userActivePrediction) {
            items.push({
                label: 'My Bull Target',
                rel: findRelative(userActivePrediction.bullish_target_price),
                type: 'user',
                direction: 'bull'
            });
            items.push({
                label: 'My Bear Target',
                rel: findRelative(userActivePrediction.bearish_target_price),
                type: 'user',
                direction: 'bear'
            });
        }

        if (aggregatedData) {
            items.push({
                label: 'Crowd Bull Median',
                rel: findRelative(aggregatedData.bullish_median_target),
                type: 'crowd',
                direction: 'bull'
            });
            items.push({
                label: 'Crowd Bear Median',
                rel: findRelative(aggregatedData.bearish_median_target),
                type: 'crowd',
                direction: 'bear'
            });
        }

        // Find min/max for scale
        const rels = items.map(i => i.rel).concat([0]);
        const maxRel = Math.max(...rels, 10);
        const minRel = Math.min(...rels, -10);
        const scale = Math.max(Math.abs(maxRel), Math.abs(minRel)) * 1.2;

        return { items, scale };
    }, [currentPrice, userActivePrediction, aggregatedData]);

    if (!mapData || currentPrice === 0) return null;

    const { items, scale } = mapData;

    const getTop = (rel: number) => 50 - (rel / scale) * 50;

    return (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 h-full flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-rose-500/5 pointer-events-none" />

            <div className="relative flex justify-between items-center z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Target Distribution (%)
                </h4>
                <div className="flex gap-3 text-[9px] font-bold uppercase tracking-tight">
                    <div className="flex items-center gap-1 text-primary"><div className="w-2 h-2 rounded-full bg-primary" /> User</div>
                    <div className="flex items-center gap-1 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-muted-foreground/40 border border-muted-foreground/60" /> Crowd</div>
                </div>
            </div>

            <div className="flex-1 relative mt-4">
                {/* Scale Line */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-[2px] bg-gradient-to-b from-emerald-500/30 via-border to-rose-500/30 rounded-full" />

                {/* Scale Labels */}
                <div className="absolute left-[54%] top-4 bottom-4 flex flex-col justify-between text-[8px] font-mono font-bold text-muted-foreground/40 py-2">
                    <span>+{scale.toFixed(0)}%</span>
                    <span>+{Math.round(scale / 2)}%</span>
                    <span className="text-primary/60">0%</span>
                    <span>-{Math.round(scale / 2)}%</span>
                    <span>-{scale.toFixed(0)}%</span>
                </div>

                {/* Current Price Line */}
                <div
                    className="absolute left-0 right-0 h-[1px] bg-primary/40 dashed z-20 flex items-center justify-center"
                    style={{ top: '50%' }}
                >
                    <div className="bg-background border border-primary/40 px-2 py-0.5 rounded-full text-[9px] font-black text-primary shadow-lg shadow-primary/20">
                        ${currentPrice.toLocaleString()}
                    </div>
                </div>

                {/* Markers */}
                {items.map((item, idx) => {
                    const top = getTop(item.rel);
                    const isUser = item.type === 'user';
                    const isBull = item.direction === 'bull';

                    return (
                        <div
                            key={`${item.label}-${idx}`}
                            className={`absolute flex items-center gap-2 group transition-all duration-700 hover:z-50 ${isBull ? 'flex-row-reverse right-[52%]' : 'left-[52%]'}`}
                            style={{ top: `${top}%`, transform: 'translateY(-50%)' }}
                        >
                            <div className={`
                w-3 h-3 rounded-full border-2 shadow-lg transition-transform hover:scale-150
                ${isUser ? (isBull ? 'bg-emerald-500 border-white shadow-emerald-500/40' : 'bg-rose-500 border-white shadow-rose-500/40') : 'bg-background border-muted-foreground/60'}
              `} />

                            <div className={`
                hidden group-hover:flex flex-col whitespace-nowrap bg-background/90 backdrop-blur-md p-2 rounded-lg border border-border shadow-xl animate-in zoom-in-95
                ${isBull ? 'items-end' : 'items-start'}
              `}>
                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">
                                    {item.label}
                                </span>
                                <span className={`text-[11px] font-black ${isBull ? 'text-emerald-500' : 'text-rose-400'}`}>
                                    {item.rel > 0 ? '+' : ''}{item.rel.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Bands (optional: if we had aggregate distribution) */}
            </div>

            <div className="flex justify-between items-center text-[9px] font-bold text-muted-foreground uppercase opacity-50 px-2">
                <TrendingUp className="w-3 h-3" />
                <span>Scenario Price Scale</span>
                <TrendingDown className="w-3 h-3" />
            </div>
        </div>
    );
}
