import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, ReferenceLine } from 'recharts';
import type { Trade } from '@/lib/backtest-engine';

interface TradesPerformanceChartProps {
    trades: Trade[];
}

export const TradesPerformanceChart = ({ trades }: TradesPerformanceChartProps) => {
    if (!trades || trades.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground italic">
                No trades to visualize
            </div>
        );
    }

    const data = trades.map((t, i) => ({
        index: i + 1,
        result: (t.result - 1) * 100,
        date: t.sell_date || t.buy_date,
        profit: t.result >= 1
    }));

    return (
        <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="index"
                        tick={{ fontSize: 10, fill: '#888' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#888' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const item = payload[0].payload;
                                return (
                                    <div className="bg-background/95 border border-border p-2 rounded-lg shadow-xl text-xs backdrop-blur-md">
                                        <p className="font-bold text-foreground mb-1">Trade #{item.index}</p>
                                        <p className={`${item.result >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono font-bold`}>
                                            {item.result >= 0 ? '+' : ''}{item.result.toFixed(2)}%
                                        </p>
                                        <p className="text-muted-foreground mt-1">{item.date}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                    <Bar dataKey="result">
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.result >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'}
                                stroke={entry.result >= 0 ? '#10b981' : '#ef4444'}
                                strokeWidth={1}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
