import { formatDistanceToNow } from 'date-fns';
import {
    History,
    TrendingUp,
    TrendingDown,
    Calendar,
    Clock,
    Archive,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { type ScenarioPrediction } from '@/types/prediction';

interface PredictionHistoryProps {
    history: ScenarioPrediction[];
    currentPrice?: number;
}

export function PredictionHistory({ history }: PredictionHistoryProps) {
    const getStatus = (prediction: ScenarioPrediction) => {
        const isExpired = new Date(prediction.expires_at) <= new Date();
        if (prediction.is_active && !isExpired) {
            return {
                label: 'Active',
                color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                icon: CheckCircle2
            };
        }
        if (!prediction.is_active) {
            return {
                label: 'Replaced',
                color: 'bg-muted text-muted-foreground border-border',
                icon: Archive
            };
        }
        return {
            label: 'Expired',
            color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            icon: Clock
        };
    };

    return (
        <Card className="border-border bg-card/40 backdrop-blur-xl overflow-hidden border-2 border-primary/5">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    My Prediction Log
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="border-border">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Timestamp</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Sentiment</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Bull Scenario</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Bear Scenario</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Risk</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest pr-6 text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic text-sm">
                                        No predictions in history. Start by submitting your first move.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((pred) => {
                                    const status = getStatus(pred);
                                    const StatusIcon = status.icon;

                                    return (
                                        <TableRow key={pred.id} className="border-border hover:bg-muted/10 transition-colors group">
                                            <TableCell className="pl-6">
                                                <div className="text-xs font-bold leading-tight">
                                                    {formatDistanceToNow(new Date(pred.created_at), { addSuffix: true })}
                                                </div>
                                                <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                                    {new Date(pred.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 h-6 w-24 bg-muted/30 rounded-full px-1 overflow-hidden border border-border/50">
                                                    <div className="bg-rose-500 h-full" style={{ width: `${pred.bearish_probability}%` }} />
                                                    <div className="bg-emerald-500 h-full" style={{ width: `${pred.bullish_probability}%` }} />
                                                </div>
                                                <div className="text-[9px] font-bold mt-1 text-muted-foreground">
                                                    {pred.bullish_probability}% / {pred.bearish_probability}%
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-emerald-500 font-mono font-bold text-xs ring-1 ring-emerald-500/10 px-2 py-0.5 rounded-md w-fit bg-emerald-500/5">
                                                    <TrendingUp className="w-3 h-3" />
                                                    ${pred.bullish_target_price.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-1 font-medium">{pred.bullish_bucket}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-rose-500 font-mono font-bold text-xs ring-1 ring-rose-500/10 px-2 py-0.5 rounded-md w-fit bg-rose-500/5">
                                                    <TrendingDown className="w-3 h-3" />
                                                    ${pred.bearish_target_price.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground mt-1 font-medium">{pred.bearish_bucket}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <div key={v} className={`w-1.5 h-3 rounded-full ${pred.risk_score >= v ? 'bg-primary' : 'bg-muted'}`} />
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Badge variant="outline" className={`text-[9px] font-black tracking-widest uppercase gap-1 ${status.color}`}>
                                                    <StatusIcon className="w-2.5 h-2.5" />
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
