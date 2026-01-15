import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
    History,
    Calendar,
    Clock,
    Archive,
    CheckCircle2,
    ChevronUp,
    ChevronDown,
    Search
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
import { Input } from '@/components/ui/input';
import { type ScenarioPrediction } from '@/types/prediction';
import { formatPrice } from '@/lib/utils';

interface PredictionHistoryProps {
    history: ScenarioPrediction[];
    currentPrice?: number;
}

type SortConfig = {
    key: keyof ScenarioPrediction | 'status' | '';
    direction: 'asc' | 'desc' | null;
};

export function PredictionHistory({ history }: PredictionHistoryProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });

    const getStatus = (prediction: ScenarioPrediction) => {
        const isExpired = new Date(prediction.expires_at) <= new Date();
        if (prediction.is_active && !isExpired) {
            return {
                label: 'Active',
                color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                icon: CheckCircle2,
                weight: 3
            };
        }
        if (!prediction.is_active) {
            return {
                label: 'Replaced',
                color: 'bg-muted text-muted-foreground border-border',
                icon: Archive,
                weight: 1
            };
        }
        return {
            label: 'Expired',
            color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            icon: Clock,
            weight: 2
        };
    };

    const requestSort = (key: keyof ScenarioPrediction | 'status') => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') direction = null;
        }
        setSortConfig({ key: direction ? key : '', direction });
    };

    const filteredAndSortedHistory = useMemo(() => {
        // Filter
        let filtered = history.filter(pred => {
            const status = getStatus(pred).label.toLowerCase();
            const comment = (pred.comment || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return status.includes(query) || comment.includes(query) || pred.asset_ticker.toLowerCase().includes(query);
        });

        // Sort
        if (sortConfig.key && sortConfig.direction) {
            filtered = [...filtered].sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'status') {
                    aValue = getStatus(a).weight;
                    bValue = getStatus(b).weight;
                } else {
                    aValue = a[sortConfig.key as keyof ScenarioPrediction];
                    bValue = b[sortConfig.key as keyof ScenarioPrediction];
                }

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [history, searchQuery, sortConfig]);

    const SortIcon = ({ column }: { column: keyof ScenarioPrediction | 'status' }) => {
        if (sortConfig.key !== column) return null;
        return sortConfig.direction === 'asc' ?
            <ChevronUp className="h-3 w-3 ml-1 inline-block text-primary" /> :
            <ChevronDown className="h-3 w-3 ml-1 inline-block text-primary" />;
    };

    return (
        <Card className="border-border bg-card/40 backdrop-blur-xl overflow-hidden border-2 border-primary/5">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        My Tip Log
                    </CardTitle>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sentiment or status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-9 bg-background/50 border-border text-xs"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="border-border">
                                <TableHead
                                    className="text-[10px] font-black uppercase tracking-widest pl-6 cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => requestSort('created_at')}
                                >
                                    <div className="flex items-center">
                                        Timestamp <SortIcon column="created_at" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => requestSort('sentiment')}
                                >
                                    <div className="flex items-center">
                                        Sentiment <SortIcon column="sentiment" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => requestSort('target_price')}
                                >
                                    <div className="flex items-center">
                                        Target Price <SortIcon column="target_price" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-[10px] font-black uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => requestSort('entry_price')}
                                >
                                    <div className="flex items-center">
                                        Entry Price <SortIcon column="entry_price" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="text-[10px] font-black uppercase tracking-widest pr-6 text-right cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center justify-end">
                                        Status <SortIcon column="status" />
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-sm">
                                        {searchQuery ? `No results for "${searchQuery}"` : "No tips in history. Start by submitting your first move."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAndSortedHistory.map((pred) => {
                                    const status = getStatus(pred);
                                    const StatusIcon = status.icon;
                                    const sentimentValue = pred.sentiment;
                                    const targetPrice = pred.target_price;

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
                                                    <div className="bg-rose-500 h-full" style={{ width: `${100 - sentimentValue}%` }} />
                                                    <div className="bg-emerald-500 h-full" style={{ width: `${sentimentValue}%` }} />
                                                </div>
                                                <div className="text-[9px] font-bold mt-1 text-muted-foreground">
                                                    {sentimentValue > 50 ? `${sentimentValue}% Bullish` : sentimentValue < 50 ? `${100 - sentimentValue}% Bearish` : '50% Neutral'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-primary font-mono font-bold text-xs ring-1 ring-primary/10 px-2 py-0.5 rounded-md w-fit bg-primary/5">
                                                    {formatPrice(targetPrice)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs font-mono font-medium text-muted-foreground">
                                                    {formatPrice(pred.entry_price)}
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
