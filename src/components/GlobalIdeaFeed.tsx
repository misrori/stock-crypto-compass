import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, TrendingDown, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type ScenarioPrediction } from '@/types/prediction';
import { formatPrice } from '@/lib/utils';

export function GlobalIdeaFeed() {
    const [ideas, setIdeas] = useState<(ScenarioPrediction & { profiles: { display_name: string | null } })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchIdeas() {
            const { data, error } = await (supabase as any)
                .from('scenario_predictions')
                .select(`
          *,
          profiles:user_id (
            display_name
          )
        `)
                .not('comment', 'is', null)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setIdeas(data as any);
            }
            setLoading(false);
        }

        fetchIdeas();
    }, []);

    if (loading) return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card/20 animate-pulse rounded-2xl" />)}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ideas.map((idea) => {
                const sentimentValue = idea.sentiment ?? 50;
                const isBullish = sentimentValue > 50;
                const targetPrice = idea.target_price;

                return (
                    <Card key={idea.id} className="bg-card/40 backdrop-blur-md border-border/50 rounded-2xl overflow-hidden hover:border-primary/20 transition-all flex flex-col">
                        <CardContent className="p-5 flex-1 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">
                                            {idea.profiles?.display_name || 'Anonymous Trader'}
                                        </p>
                                        <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {formatDistanceToNow(new Date(idea.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-tighter ${isBullish ? 'border-emerald-500/30 text-emerald-500' : 'border-rose-500/30 text-rose-500'}`}>
                                    {idea.asset_ticker} {isBullish ? <TrendingUp className="w-2 h-2 ml-1 inline" /> : <TrendingDown className="w-2 h-2 ml-1 inline" />}
                                    <span className="ml-1 opacity-60">({sentimentValue}%)</span>
                                </Badge>
                            </div>

                            <div className="relative">
                                <blockquote className="text-sm font-medium italic text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20">
                                    "{idea.comment}"
                                </blockquote>
                            </div>

                            <div className="flex justify-between items-end mt-auto pt-4 border-t border-border/20">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase opacity-50">7-Day Target</span>
                                    <span className="text-[11px] font-black text-primary">
                                        {targetPrice ? formatPrice(targetPrice) : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary/60">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    Review Idea
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            {ideas.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-3xl">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground italic">No tips shared yet. Be the first to post a market insight!</p>
                </div>
            )}
        </div>
    );
}
