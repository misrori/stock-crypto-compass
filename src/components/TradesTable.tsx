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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'buy_date', direction: 'desc' });

  const requestSort = (key: keyof StrategyTrade | 'index') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key: direction ? key : '', direction });
  };

  const filteredAndSortedTrades = useMemo(() => {
    // Determine status for filtering (it's derived from sell_date in current data)
    const processedTrades = trades.map(t => ({
      ...t,
      status: t.sell_date ? 'closed' : 'open'
    }));

    // Filter
    let filtered = processedTrades.filter(trade =>
      trade.buy_date.includes(searchQuery) ||
      (trade.sell_date && trade.sell_date.includes(searchQuery)) ||
      trade.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'index') {
          // Find index in original trades array
          aValue = trades.findIndex(x => x.buy_date === a.buy_date && x.buy_price === a.buy_price);
          bValue = trades.findIndex(x => x.buy_date === b.buy_date && x.buy_price === b.buy_price);
        } else {
          aValue = (a as any)[sortConfig.key];
          bValue = (b as any)[sortConfig.key];
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
    } else if (!sortConfig.key) {
      // If no sort, default to showing trades as they come from props (usually chronological)
      // but the original component showed newest first by reversing
      filtered = [...filtered].reverse();
    }

    return filtered.slice(0, showLatest);
  }, [trades, searchQuery, sortConfig, showLatest]);

  const SortIcon = ({ column }: { column: keyof StrategyTrade | 'index' }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1 inline-block text-primary" /> :
      <ChevronDown className="h-4 w-4 ml-1 inline-block text-primary" />;
  };

  const tableContent = (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter trades (date, status)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-muted/20 border-border"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('index')}
              >
                <div className="flex items-center">
                  # <SortIcon column="index" />
                </div>
              </TableHead>
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('status' as any)}
              >
                <div className="flex items-center">
                  Status <SortIcon column={'status' as any} />
                </div>
              </TableHead>
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('buy_date')}
              >
                <div className="flex items-center">
                  Buy Date <SortIcon column="buy_date" />
                </div>
              </TableHead>
              <TableHead
                className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('buy_price')}
              >
                <div className="flex items-center justify-end">
                  Buy Price <SortIcon column="buy_price" />
                </div>
              </TableHead>
              <TableHead
                className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('sell_date' as any)}
              >
                <div className="flex items-center">
                  Sell Date <SortIcon column={'sell_date' as any} />
                </div>
              </TableHead>
              <TableHead
                className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('sell_price' as any)}
              >
                <div className="flex items-center justify-end">
                  Sell Price <SortIcon column={'sell_price' as any} />
                </div>
              </TableHead>
              <TableHead
                className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('days_in_trade')}
              >
                <div className="flex items-center justify-end">
                  Days <SortIcon column="days_in_trade" />
                </div>
              </TableHead>
              <TableHead
                className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => requestSort('result')}
              >
                <div className="flex items-center justify-end">
                  Result <SortIcon column="result" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No trades found matching "{searchQuery}"
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTrades.map((trade, idx) => {
                const result = formatResult(trade.result);
                const status = trade.sell_date ? 'closed' : 'open';

                // Find original index for display
                const originalIndex = trades.findIndex(x => x.buy_date === trade.buy_date && x.buy_price === trade.buy_price);

                return (
                  <TableRow
                    key={`${trade.buy_date}-${trade.buy_price}-${idx}`}
                    className="border-border hover:bg-muted/30"
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      {originalIndex + 1}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status === 'open'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                        }`}>
                        {status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{trade.buy_date}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatPrice(trade.buy_price)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {trade.sell_date || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {trade.sell_price ? formatPrice(trade.sell_price) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {trade.days_in_trade}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-mono font-medium ${result.isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {result.isPositive ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {result.text}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  if (!showCard) {
    return tableContent;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Trade History</span>
          <span className="text-sm font-normal text-muted-foreground">
            Showing {filteredAndSortedTrades.length} trades
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
