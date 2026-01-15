import { useState, useEffect } from 'react';
import {
    Info,
    History,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { type ScenarioPrediction } from '@/types/prediction';
import { formatPrice } from '@/lib/utils';

interface ScenarioPredictionFormProps {
    assetTicker: string;
    assetType: string;
    currentPrice: number;
    onSubmit: (data: any) => Promise<{ error: Error | null }>;
    hasActivePrediction: boolean;
    activePrediction: ScenarioPrediction | null;
}

export function ScenarioPredictionForm({
    assetTicker,
    assetType,
    currentPrice,
    onSubmit,
    hasActivePrediction,
    activePrediction
}: ScenarioPredictionFormProps) {
    const [sentiment, setSentiment] = useState<number>(50); // 0-100, 50 neutral
    const [targetPrice, setTargetPrice] = useState<number>(currentPrice);
    const [comment, setComment] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    // Dynamic Range Calculation
    const isBullish = sentiment > 50;
    const isBearish = sentiment < 50;
    const isNeutral = sentiment === 50;

    const maxGainFactor = isBullish ? (sentiment - 50) / 50 : 0; // 0 to 1 (at 100 sentiment)
    const maxLossFactor = isBearish ? (50 - sentiment) / 100 : 0; // 0 to 0.5 (at 0 sentiment)

    const minPrice = isBullish ? currentPrice : (isNeutral ? currentPrice * 0.95 : currentPrice * (1 - maxLossFactor));
    const maxPrice = isBearish ? currentPrice : (isNeutral ? currentPrice * 1.05 : currentPrice * (1 + maxGainFactor));

    // Reset target price if out of bounds when range changes
    useEffect(() => {
        if (targetPrice < minPrice) setTargetPrice(minPrice);
        if (targetPrice > maxPrice) setTargetPrice(maxPrice);
    }, [minPrice, maxPrice]);

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        const { error } = await onSubmit({
            assetTicker,
            assetType,
            sentiment,
            targetPrice,
            entryPrice: currentPrice,
            comment: comment.trim() || null
        });
        setSubmitting(false);

        if (error) {
            toast.error('Submission failed', { description: error.message });
        } else {
            toast.success('Tip recorded!', { description: `Your 7-day forecast for ${assetTicker} is now live.` });
            setComment('');
        }
    };

    if (hasActivePrediction && activePrediction) {
        const timeRemaining = formatDistanceToNow(new Date(activePrediction.expires_at), { addSuffix: true });
        const pTarget = activePrediction.target_price;
        const pSentiment = activePrediction.sentiment;
        const pDiff = ((pTarget / activePrediction.entry_price) - 1) * 100;

        return (
            <Card className="border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group border-2 border-primary/20 transition-all duration-500 min-h-[400px] flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

                <CardContent className="p-8 relative space-y-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase tracking-tight">Thanks for the tip!</h3>
                        <p className="text-muted-foreground text-sm font-medium">
                            Your forecast is active and protecting your participation status.
                        </p>
                    </div>

                    {/* Active Tip Summary */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-left">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                                <History className="w-3 h-3" /> My Forecast
                            </div>
                            <div className={`text-2xl font-black tracking-tighter ${pTarget >= activePrediction.entry_price ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {formatPrice(pTarget)}
                            </div>
                            <div className="text-[10px] font-bold opacity-60">
                                {pDiff > 0 ? '+' : ''}{pDiff.toFixed(2)}% EXPECTED
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 text-left">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> Time Left
                            </div>
                            <div className="text-xl font-black tracking-tight text-foreground uppercase">
                                {timeRemaining.replace('in ', '')}
                            </div>
                            <div className="text-[10px] font-bold opacity-60">
                                UNTIL EXPIRATION
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <div className="flex items-center gap-1.5 justify-center h-4 w-48 bg-muted/30 rounded-full px-1 overflow-hidden border border-border/50 mx-auto">
                            <div className="bg-rose-500 h-full" style={{ width: `${100 - pSentiment}%` }} />
                            <div className="bg-emerald-500 h-full" style={{ width: `${pSentiment}%` }} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-3">
                            Current Sentiment: <span className={pSentiment > 50 ? 'text-emerald-500' : pSentiment < 50 ? 'text-rose-500' : 'text-primary'}>
                                {pSentiment > 50 ? `${pSentiment}% Bullish` : pSentiment < 50 ? `${100 - pSentiment}% Bearish` : '50% Neutral'}
                            </span>
                        </p>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl">
                        <p className="text-[10px] text-muted-foreground leading-snug font-medium italic">
                            " {activePrediction.comment || 'No thesis provided ...'} "
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group border-2 hover:border-primary/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            <CardContent className="p-6 relative space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full animate-pulse bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)]" />
                        <div>
                            <h3 className="font-black text-xl text-foreground tracking-tight">
                                NEW PRICE TARGET
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                                {assetTicker} 7-Day Forecast
                            </p>
                        </div>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                    <Info className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-background/95 backdrop-blur-md border-primary/20 p-4 max-w-xs">
                                <p className="text-xs font-medium leading-relaxed">
                                    This tip represents where you believe the price will be exactly <span className="text-primary font-bold">7 days from now</span>.
                                    Active tips are locked for comparison and expire after 1 week.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Sentiment Slider - REFINED STYLE */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <div className="text-center flex-1">
                            <div className={`text-5xl font-black tracking-tighter transition-all duration-500 ${sentiment < 50 ? 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]' : sentiment === 50 ? 'text-muted-foreground/60' : 'text-muted-foreground/20'}`}>
                                {100 - sentiment}%
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 mt-2">Bearish</div>
                        </div>

                        <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-border/50 to-transparent mx-8" />

                        <div className="text-center flex-1">
                            <div className={`text-5xl font-black tracking-tighter transition-all duration-500 ${sentiment > 50 ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]' : sentiment === 50 ? 'text-muted-foreground/60' : 'text-muted-foreground/20'}`}>
                                {sentiment}%
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 mt-2">Bullish</div>
                        </div>
                    </div>

                    <div className="relative px-2 pt-6">
                        {/* Center Divide Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-border/20 -translate-x-1/2 z-0" />

                        <div className="relative z-10">
                            <Slider
                                value={[sentiment]}
                                onValueChange={([v]) => setSentiment(v)}
                                min={0}
                                max={100}
                                step={1}
                                className={`radiant-slider ${sentiment > 50 ? 'accent-emerald' : sentiment < 50 ? 'accent-rose' : ''}`}
                            />
                        </div>

                        <div className="flex justify-between mt-3 text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest px-1">
                            <span>Extreme Fear</span>
                            <span>Neutral</span>
                            <span>Extreme Greed</span>
                        </div>
                    </div>
                </div>

                {/* Price Target Slider - REFINED STYLE */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex justify-between items-end px-4">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">7-Day Price Target</Label>
                        <div className="text-right">
                            <div className={`text-4xl font-black tracking-tighter transition-all duration-500 ${isBullish ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : isBearish ? 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'text-muted-foreground/60'}`}>
                                {formatPrice(targetPrice)}
                            </div>
                            <div className={`text-[9px] font-black tracking-widest mt-1 uppercase ${isBullish ? 'text-emerald-500/80' : isBearish ? 'text-rose-500/80' : 'text-muted-foreground/60'}`}>
                                {targetPrice >= currentPrice ? '+' : ''}{((targetPrice / currentPrice - 1) * 100).toFixed(2)}% FROM NOW
                            </div>
                        </div>
                    </div>

                    <div className="relative px-2">
                        <Slider
                            value={[targetPrice]}
                            onValueChange={([v]) => setTargetPrice(v)}
                            min={minPrice}
                            max={maxPrice}
                            step={currentPrice / 1000}
                            className={`radiant-slider ${isBullish ? 'accent-emerald' : isBearish ? 'accent-rose' : ''}`}
                        />
                        <div className="flex justify-between mt-3 text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest px-1">
                            <span>{isBullish ? 'Now' : formatPrice(minPrice)}</span>
                            <span className={isBearish ? 'text-rose-500/60' : isBullish ? 'text-emerald-500/60' : ''}>{isBearish ? 'Now' : formatPrice(maxPrice)}</span>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                        <span>Notes / Thesis (Optional)</span>
                        <span className="opacity-50 font-medium">{comment.length}/240</span>
                    </Label>
                    <Textarea
                        placeholder="Simple context or reasoning... (Optional)"
                        maxLength={240}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-muted/20 border-border/40 h-20 text-sm rounded-xl resize-none italic focus:border-primary/50 transition-all"
                    />
                </div>

                {/* Submit */}
                <Button
                    className="w-full h-14 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/10 group relative overflow-hidden"
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center gap-2">
                        {submitting ? 'RECORDING TIP...' : 'SUBMIT MY TIP'}
                        {!submitting && <History className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                    </span>
                </Button>
            </CardContent>
        </Card>
    );
}
