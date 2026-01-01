import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TradingViewWidget from '@/components/TradingViewWidget';
import { ArrowLeft, Bitcoin } from 'lucide-react';

const TOP_CRYPTOS = [
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin' },
  { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum' },
  { symbol: 'BINANCE:BNBUSDT', name: 'BNB' },
  { symbol: 'BINANCE:SOLUSDT', name: 'Solana' },
  { symbol: 'BINANCE:XRPUSDT', name: 'XRP' },
  { symbol: 'BINANCE:ADAUSDT', name: 'Cardano' },
  { symbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin' },
  { symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche' },
  { symbol: 'BINANCE:DOTUSDT', name: 'Polkadot' },
  { symbol: 'BINANCE:LINKUSDT', name: 'Chainlink' },
  { symbol: 'BINANCE:MATICUSDT', name: 'Polygon' },
  { symbol: 'BINANCE:SHIBUSDT', name: 'Shiba Inu' },
  { symbol: 'BINANCE:LTCUSDT', name: 'Litecoin' },
  { symbol: 'BINANCE:ATOMUSDT', name: 'Cosmos' },
  { symbol: 'BINANCE:UNIUSDT', name: 'Uniswap' },
  { symbol: 'BINANCE:ETCUSDT', name: 'Ethereum Classic' },
  { symbol: 'BINANCE:XLMUSDT', name: 'Stellar' },
  { symbol: 'BINANCE:NEARUSDT', name: 'NEAR Protocol' },
  { symbol: 'BINANCE:ICPUSDT', name: 'Internet Computer' },
  { symbol: 'BINANCE:APTUSDT', name: 'Aptos' },
];

type CryptoCount = '5' | '10' | '20';

export default function CryptoWatch() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [cryptoCount, setCryptoCount] = useState<CryptoCount>('5');
  const [selectedCrypto, setSelectedCrypto] = useState(TOP_CRYPTOS[0].symbol);

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

  const displayedCryptos = TOP_CRYPTOS.slice(0, parseInt(cryptoCount));

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
              <Bitcoin className="w-6 h-6 text-accent" />
              <h1 className="text-xl font-bold font-mono">CryptoWatch</h1>
            </div>
          </div>
          <Select value={cryptoCount} onValueChange={(v) => setCryptoCount(v as CryptoCount)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5 Crypto</SelectItem>
              <SelectItem value="10">Top 10 Crypto</SelectItem>
              <SelectItem value="20">Top 20 Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Crypto List */}
          <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 sticky top-0 bg-background py-2">Select a cryptocurrency</h2>
            {displayedCryptos.map((crypto, index) => (
              <Card
                key={crypto.symbol}
                className={`cursor-pointer transition-all ${
                  selectedCrypto === crypto.symbol
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
                onClick={() => setSelectedCrypto(crypto.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm font-mono font-bold text-accent">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold font-mono">{crypto.symbol.split(':')[1].replace('USDT', '')}</p>
                      <p className="text-xs text-muted-foreground truncate">{crypto.name}</p>
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
                  {displayedCryptos.find(c => c.symbol === selectedCrypto)?.name || selectedCrypto}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewWidget symbol={selectedCrypto} height={500} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}