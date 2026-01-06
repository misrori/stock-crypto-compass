import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Brain,
    AlertTriangle,
    Check,
    ChevronRight,
    ChevronLeft,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    type PredictionReasoning,
    type PredictionBucket,
    REASONING_LABELS,
    BUCKET_LABELS
} from '@/types/prediction';

interface ScenarioPredictionFormProps {
    assetTicker: string;
    assetType: string;
    currentPrice: number;
    onSubmit: (data: any) => Promise<{ error: Error | null }>;
    hasActivePrediction: boolean;
}

export function ScenarioPredictionForm({
    assetTicker,
    assetType,
    currentPrice,
    onSubmit,
    hasActivePrediction
}: ScenarioPredictionFormProps) {
    const [step, setStep] = useState(1);
    const [bullishTarget, setBullishTarget] = useState<string>('');
    const [bearishTarget, setBearishTarget] = useState<string>('');
    const [bullishBucket, setBullishBucket] = useState<PredictionBucket>('+10%');
    const [bearishBucket, setBearishBucket] = useState<PredictionBucket>('-10%');
    const [probability, setProbability] = useState<number>(50); // 50 means 50/50
    const [reasoningTags, setReasoningTags] = useState<PredictionReasoning[]>([]);
    const [riskScore, setRiskScore] = useState<number>(3);
    const [comment, setComment] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const bullishProbability = probability;
    const bearishProbability = 100 - probability;

    const toggleReasoning = (tag: PredictionReasoning) => {
        if (reasoningTags.includes(tag)) {
            setReasoningTags(reasoningTags.filter(t => t !== tag));
        } else if (reasoningTags.length < 2) {
            setReasoningTags([...reasoningTags, tag]);
        }
    };

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        const { error } = await onSubmit({
            assetTicker,
            assetType,
            bullishTarget: parseFloat(bullishTarget),
            bearishTarget: parseFloat(bearishTarget),
            bullishBucket,
            bearishBucket,
            bullishProbability,
            bearishProbability,
            riskScore,
            reasoningTags,
            comment: comment.trim() || null
        });
        setSubmitting(false);

        if (error) {
            toast.error('Submission failed', { description: error.message });
        } else {
            toast.success('Prediction recorded!', { description: 'Your scenario for ' + assetTicker + ' is now active for 7 days.' });
            setStep(1);
            setBullishTarget('');
            setBearishTarget('');
            setReasoningTags([]);
            setComment('');
        }
    };

    const isStep1Valid = bullishTarget && bearishTarget && !isNaN(parseFloat(bullishTarget)) && !isNaN(parseFloat(bearishTarget));

    return (
        <Card className="border-border bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden group border-2 hover:border-primary/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

            <CardContent className="p-6 relative">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${hasActivePrediction ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)]'}`} />
                        <div>
                            <h3 className="font-black text-xl text-foreground tracking-tight">
                                {hasActivePrediction ? 'PREDICTION ACTIVE' : 'NEXT MARKET MOVE'}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                                {assetTicker} Scenario Builder
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${step >= i ? 'bg-primary' : 'bg-muted'}`} />
                        ))}
                    </div>
                </div>

                {/* Step 1: Scenarios */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                                <TrendingUp className="w-3.5 h-3.5" /> Bullish Scenario
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Target Price</span>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</span>
                                        <Input
                                            type="number"
                                            value={bullishTarget}
                                            onChange={(e) => setBullishTarget(e.target.value)}
                                            placeholder="Price"
                                            className="bg-muted/30 border-emerald-500/10 focus:border-emerald-500/50 pl-7 transition-all font-mono font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Expectation</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {BUCKET_LABELS.filter(b => b.startsWith('+')).map(b => (
                                            <Button
                                                key={b}
                                                variant={bullishBucket === b ? 'default' : 'outline'}
                                                size="sm"
                                                className={`text-[9px] h-7 px-2 font-black tracking-tighter transition-all ${bullishBucket === b ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-500/10 hover:bg-emerald-500/10'}`}
                                                onClick={() => setBullishBucket(b)}
                                            >
                                                {b}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border/50">
                            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-rose-400">
                                <TrendingDown className="w-3.5 h-3.5" /> Bearish Scenario
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Target Price</span>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
                                        <Input
                                            type="number"
                                            value={bearishTarget}
                                            onChange={(e) => setBearishTarget(e.target.value)}
                                            placeholder="Price"
                                            className="bg-muted/30 border-rose-500/10 focus:border-rose-500/50 pl-7 transition-all font-mono font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold">Expectation</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {BUCKET_LABELS.filter(b => b.startsWith('-')).map(b => (
                                            <Button
                                                key={b}
                                                variant={bearishBucket === b ? 'default' : 'outline'}
                                                size="sm"
                                                className={`text-[9px] h-7 px-2 font-black tracking-tighter transition-all ${bearishBucket === b ? 'bg-rose-600 hover:bg-rose-700' : 'border-rose-500/10 hover:bg-rose-500/10'}`}
                                                onClick={() => setBearishBucket(b)}
                                            >
                                                {b}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl bg-foreground text-background font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all group mt-4 overflow-hidden"
                            disabled={!isStep1Valid}
                            onClick={() => setStep(2)}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Continue to Weights
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                    </div>
                )}

                {/* Step 2: Probability Slider */}
                {step === 2 && (
                    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center space-y-2">
                            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black tracking-widest uppercase text-primary mb-2">
                                Confidence Balance
                            </div>
                            <h4 className="text-2xl font-black tracking-tight uppercase">Express your belief</h4>
                        </div>

                        <div className="relative px-4">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-rose-500/50 via-border to-emerald-500/50" />

                            <div className="flex justify-between items-end mb-8 relative z-10">
                                <div className="text-center group/bear">
                                    <div className={`text-4xl font-black transition-all ${probability < 50 ? 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'text-muted-foreground'}`}>
                                        {bearishProbability}%
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Bearish</div>
                                </div>

                                <div className="text-center group/bull">
                                    <div className={`text-4xl font-black transition-all ${probability > 50 ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-muted-foreground'}`}>
                                        {bullishProbability}%
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Bullish</div>
                                </div>
                            </div>

                            <Slider
                                value={[probability]}
                                onValueChange={([v]) => setProbability(v)}
                                min={0}
                                max={100}
                                step={1}
                                className="z-20 py-8"
                            />

                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-20 bg-border/50 dashed" />
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl font-bold border border-border/50">
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                className="flex-[2] h-12 rounded-xl bg-foreground text-background font-black uppercase tracking-widest"
                                onClick={() => setStep(3)}
                            >
                                Final Details
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Reasoning & Risk */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Brain className="w-3.5 h-3.5" /> Reasoning (PICK 1-2)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(REASONING_LABELS) as PredictionReasoning[]).map(tag => (
                                    <Badge
                                        key={tag}
                                        variant={reasoningTags.includes(tag) ? 'default' : 'outline'}
                                        className={`cursor-pointer h-9 transition-all hover:scale-105 active:scale-95 px-4 font-bold border-2 ${reasoningTags.includes(tag) ? 'bg-primary border-primary' : 'bg-transparent border-border/50 hover:bg-muted'
                                            }`}
                                        onClick={() => toggleReasoning(tag)}
                                    >
                                        {reasoningTags.includes(tag) && <Check className="w-3.5 h-3.5 mr-1.5" />}
                                        {REASONING_LABELS[tag]}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <AlertTriangle className="w-3.5 h-3.5" /> Perceived Risk Level
                            </Label>
                            <div className="grid grid-cols-5 gap-3">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <Button
                                        key={v}
                                        variant={riskScore === v ? 'default' : 'outline'}
                                        className={`h-11 font-black text-lg rounded-xl transition-all ${riskScore === v
                                            ? v > 3 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-primary'
                                            : 'bg-muted/30 border-border/50 hover:bg-muted'
                                            }`}
                                        onClick={() => setRiskScore(v)}
                                    >
                                        {v}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Optional Brief (240 chars)</Label>
                            <Textarea
                                placeholder="Why these targets?"
                                maxLength={240}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="bg-muted/20 border-border/50 h-28 text-sm rounded-xl resize-none italic"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl font-bold border border-border/50">
                                <ChevronLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-rose-500 text-white font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/20"
                                onClick={handleFinalSubmit}
                                disabled={submitting || reasoningTags.length === 0}
                            >
                                {submitting ? 'RECORDING...' : 'LIVE THE SCENARIO'}
                            </Button>
                        </div>
                    </div>
                )}

                {hasActivePrediction && step === 1 && (
                    <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-4 items-center animate-in zoom-in-95 duration-700">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug font-medium">
                            Your active prediction is locked. Submitting now will <span className="text-foreground font-bold underline">overwrite</span> your previous call and reset the 7-day countdown.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
