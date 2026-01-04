import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StrategyTrade } from '@/hooks/useAssetDetail';

interface TradesTableProps {
  trades: StrategyTrade[];
  showLatest?: number;
  showCard?: boolean;
}

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

export const TradesTable = ({ trades, showLatest = 20, showCard = true }: TradesTableProps) => {
  // Reverse to show most recent first, then take showLatest
  const recentTrades = [...trades].reverse().slice(0, showLatest);

  const tableContent = (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">#</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Buy Date</TableHead>
            <TableHead className="text-right text-muted-foreground">Buy Price</TableHead>
            <TableHead className="text-muted-foreground">Sell Date</TableHead>
            <TableHead className="text-right text-muted-foreground">Sell Price</TableHead>
            <TableHead className="text-right text-muted-foreground">Days</TableHead>
            <TableHead className="text-right text-muted-foreground">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentTrades.map((trade) => {
            const result = formatResult(trade.result);
            return (
              <TableRow 
                key={trade.trade_id}
                className="border-border hover:bg-muted/30"
              >
                <TableCell className="font-medium text-muted-foreground">
                  {trade.trade_id}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.status === 'open' 
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {trade.status.toUpperCase()}
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
                  <div className={`flex items-center justify-end gap-1 font-mono font-medium ${
                    result.isPositive ? 'text-emerald-400' : 'text-rose-400'
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
          })}
        </TableBody>
      </Table>
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
            Showing last {Math.min(showLatest, trades.length)} of {trades.length} trades
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
