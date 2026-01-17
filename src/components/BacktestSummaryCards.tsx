import { Target, BarChart3, Percent, Clock, Trophy } from 'lucide-react';
import type { BacktestSummary } from '@/lib/backtest-engine';

interface BacktestSummaryCardsProps {
    summary: BacktestSummary;
    isProfitable: boolean;
    holdBeatsStrategy: boolean;
}

const formatNumber = (value: any, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
        return (0).toFixed(decimals);
    }
    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

export const BacktestSummaryCards = ({ summary, isProfitable, holdBeatsStrategy }: BacktestSummaryCardsProps) => {
    return (
        <div className="space-y-4">
            {/* Status Badges */}
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isProfitable
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    }`}>
                    {isProfitable ? 'Profitable' : 'Unprofitable'}
                </span>
                {holdBeatsStrategy && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                        <Trophy className="h-3 w-3" />
                        Better to Hodl
                    </span>
                )}
            </div>

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-card/40 backdrop-blur-md rounded-xl p-3 border border-border/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">
                        <Target className="h-3 w-3" />
                        Win Rate
                    </div>
                    <p className="text-2xl font-black text-emerald-500">
                        {formatNumber(summary.win_ratio)}%
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-md rounded-xl p-3 border border-border/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">
                        <BarChart3 className="h-3 w-3" />
                        Trades
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {summary.total_trades}
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-md rounded-xl p-3 border border-border/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">
                        <Percent className="h-3 w-3" />
                        Avg Res
                    </div>
                    <p className={`text-2xl font-black ${summary.average_result >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {summary.average_result >= 0 ? '+' : ''}{formatNumber(summary.average_result)}%
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-md rounded-xl p-3 border border-border/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">
                        <Percent className="h-3 w-3" />
                        Median
                    </div>
                    <p className={`text-2xl font-black ${summary.median_result >= 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {summary.median_result >= 0 ? '+' : ''}{formatNumber(summary.median_result)}%
                    </p>
                </div>

                <div className="bg-card/40 backdrop-blur-md rounded-xl p-3 border border-border/50">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">
                        <Clock className="h-3 w-3" />
                        Avg Len
                    </div>
                    <p className="text-2xl font-black text-foreground">
                        {Math.round(summary.average_days)}d
                    </p>
                </div>
            </div>

            {/* Cumulative / Hold Result Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-xl p-4 border border-primary/20 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Cumulative Result</span>
                        <span className={`text-3xl font-black ${summary.cumulative_result >= 1 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {summary.cumulative_result.toFixed(2)}x
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Hold Result</span>
                        <span className="text-xl font-black text-muted-foreground/80">
                            {summary.hold_result.toFixed(2)}x
                        </span>
                    </div>
                </div>

                {/* Simplified Win/Loss Overview */}
                <div className="bg-card/40 backdrop-blur-md rounded-xl p-4 border border-border/50 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 block">Top Winner</span>
                        <span className="text-lg font-black text-emerald-500">+{formatNumber(summary.max_gain)}%</span>
                    </div>
                    <div className="space-y-1 text-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">Trades (W/L)</span>
                        <span className="text-lg font-black text-foreground">{summary.win_trades} / {summary.loss_trades}</span>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 block">Max Loss</span>
                        <span className="text-lg font-black text-rose-500">{formatNumber(summary.max_loss)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
