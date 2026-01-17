import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { StrategyTrade } from '@/hooks/useAssetDetail';

interface TradesTableProps {
  trades: StrategyTrade[];
  showLatest?: number;
  showCard?: boolean;
}

type SortConfig = {
  key: keyof StrategyTrade | 'index' | '';
  direction: 'asc' | 'desc' | null;
};

const formatPrice = (price: number): string => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
};

const formatResult = (result: number): { text: string; isPositive: boolean } => {
  const percentChange = (result - 1) * 100;
  return {
    text: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
    isPositive: percentChange >= 0,
  };
};

export const TradesTable = ({ trades, showLatest = 50, showCard = true }: TradesTableProps) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'buy_date', direction: 'desc' });

  const requestSort = (key: keyof StrategyTrade | 'index') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key: direction ? key : '', direction });
  };

  const sortedTrades = useMemo(() => {
    let filtered = [...trades].map(t => ({
      ...t,
      status: t.sell_date ? 'closed' : 'open'
    }));

    if (sortConfig.key && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'index') {
          aValue = trades.findIndex(x => x.buy_date === a.buy_date && x.buy_price === a.buy_price);
          bValue = trades.findIndex(x => x.buy_date === b.buy_date && x.buy_price === b.buy_price);
        } else {
          aValue = (a as any)[sortConfig.key];
          bValue = (b as any)[sortConfig.key];
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else if (!sortConfig.key) {
      filtered = [...filtered].reverse();
    }

    return filtered.slice(0, showLatest);
  }, [trades, sortConfig, showLatest]);

  const SortIcon = ({ column }: { column: keyof StrategyTrade | 'index' }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1 inline-block text-primary" /> :
      <ChevronDown className="h-4 w-4 ml-1 inline-block text-primary" />;
  };

  const tableContent = (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('index')}>
              # <SortIcon column="index" />
            </TableHead>
            <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('buy_date')}>
              Entry Date <SortIcon column="buy_date" />
            </TableHead>
            <TableHead className="text-right text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('buy_price')}>
              Entry Price <SortIcon column="buy_price" />
            </TableHead>
            <TableHead className="text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('sell_date' as any)}>
              Exit Date <SortIcon column={'sell_date' as any} />
            </TableHead>
            <TableHead className="text-right text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('sell_price' as any)}>
              Exit Price <SortIcon column={'sell_price' as any} />
            </TableHead>
            <TableHead className="text-right text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('days_in_trade')}>
              Days <SortIcon column="days_in_trade" />
            </TableHead>
            <TableHead className="text-right text-muted-foreground text-[10px] font-black uppercase tracking-widest cursor-pointer" onClick={() => requestSort('result')}>
              Result <SortIcon column="result" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTrades.map((trade, idx) => {
            const result = formatResult(trade.result);
            const originalIndex = trades.findIndex(x => x.buy_date === trade.buy_date && x.buy_price === trade.buy_price);

            return (
              <TableRow key={`${trade.buy_date}-${idx}`} className="border-border/40 hover:bg-muted/20">
                <TableCell className="text-[11px] font-bold text-muted-foreground">{originalIndex + 1}</TableCell>
                <TableCell className="text-[11px] font-bold">{trade.buy_date}</TableCell>
                <TableCell className="text-right text-[11px] font-mono">{formatPrice(trade.buy_price)}</TableCell>
                <TableCell className="text-[11px] font-bold">{trade.sell_date || '-'}</TableCell>
                <TableCell className="text-right text-[11px] font-mono">{trade.sell_price ? formatPrice(trade.sell_price) : '-'}</TableCell>
                <TableCell className="text-right text-[11px] font-bold">{trade.days_in_trade}d</TableCell>
                <TableCell className="text-right">
                  <div className={`flex items-center justify-end gap-1 text-[11px] font-black font-mono ${result.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {result.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {result.text}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (!showCard) return tableContent;

  return (
    <Card className="bg-card/40 backdrop-blur-md border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-tight">
          <span>Trade History</span>
          <span className="text-[10px] text-muted-foreground normal-case font-bold">{sortedTrades.length} Trades</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  );
};
