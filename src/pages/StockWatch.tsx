import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TradingViewWidget from '@/components/TradingViewWidget';
import { ArrowLeft, TrendingUp } from 'lucide-react';

const TOP_STOCKS = [
  { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NASDAQ:GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'NASDAQ:AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NASDAQ:NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NASDAQ:TSLA', name: 'Tesla Inc.' },
  { symbol: 'NASDAQ:META', name: 'Meta Platforms Inc.' },
  { symbol: 'NYSE:BRK.B', name: 'Berkshire Hathaway' },
  { symbol: 'NYSE:JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'NYSE:V', name: 'Visa Inc.' },
];

type StockCount = '5' | '10';

export default function StockWatch() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stockCount, setStockCount] = useState<StockCount>('5');
  const [selectedStock, setSelectedStock] = useState(TOP_STOCKS[0].symbol);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  const displayedStocks = TOP_STOCKS.slice(0, parseInt(stockCount));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold font-mono">StockWatch</h1>
            </div>
          </div>
          <Select value={stockCount} onValueChange={(v) => setStockCount(v as StockCount)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5 Stocks</SelectItem>
              <SelectItem value="10">Top 10 Stocks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Stock List */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Select a stock</h2>
            {displayedStocks.map((stock, index) => (
              <Card
                key={stock.symbol}
                className={`cursor-pointer transition-all ${
                  selectedStock === stock.symbol
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedStock(stock.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-mono font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold font-mono">{stock.symbol.split(':')[1]}</p>
                      <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-mono">
                  {displayedStocks.find(s => s.symbol === selectedStock)?.name || selectedStock}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewWidget symbol={selectedStock} height={500} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}