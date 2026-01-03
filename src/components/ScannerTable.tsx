import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendBadge } from './TrendBadge';
import type { GoldHandAsset, AssetType } from '@/hooks/useGoldHandData';

interface ScannerTableProps {
  data: GoldHandAsset[];
  assetType: AssetType;
  loading: boolean;
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

const formatTimeSinceFlipped = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  
  if (weeks < 4) {
    return remainingDays > 0 ? `${weeks}W ${remainingDays}D` : `${weeks}W`;
  }
  
  const months = Math.floor(days / 30);
  const remainingWeeks = Math.floor((days % 30) / 7);
  
  return remainingWeeks > 0 ? `${months}M ${remainingWeeks}W` : `${months}M`;
};

const getTradingViewSymbol = (ticker: string, assetType: AssetType): string => {
  if (assetType === 'crypto') {
    // Remove _USD suffix if present, then add BINANCE prefix
    const cleanTicker = ticker.replace('_USD', '').replace('USD', '');
    return `BINANCE:${cleanTicker}USDT`;
  }
  if (assetType === 'commodities') {
    // Common commodity symbols
    const commodityMap: Record<string, string> = {
      'GOLD': 'TVC:GOLD',
      'SILVER': 'TVC:SILVER',
      'OIL': 'TVC:USOIL',
      'BRENT': 'TVC:UKOIL',
      'PLATINUM': 'TVC:PLATINUM',
      'PALLADIUM': 'TVC:PALLADIUM',
      'COPPER': 'COMEX:HG1!',
      'NATURAL_GAS': 'NYMEX:NG1!',
    };
    return commodityMap[ticker.toUpperCase()] || `TVC:${ticker}`;
  }
  // Stocks - use NASDAQ or NYSE prefix
  return `NASDAQ:${ticker}`;
};

export const ScannerTable = ({ data, assetType, loading }: ScannerTableProps) => {
  const navigate = useNavigate();

  const handleRowClick = (ticker: string) => {
    navigate(`/scanner/${assetType}/${encodeURIComponent(ticker)}`);
  };

  if (loading) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        <div className="animate-pulse p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">No assets found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="w-12 text-muted-foreground">#</TableHead>
            <TableHead className="text-muted-foreground">
              {assetType === 'stocks' ? 'Stock' : assetType === 'crypto' ? 'Crypto' : 'Commodity'}
            </TableHead>
            <TableHead className="text-muted-foreground">Trend</TableHead>
            <TableHead className="text-muted-foreground">Time Since Flipped</TableHead>
            <TableHead className="text-right text-muted-foreground">Price</TableHead>
            <TableHead className="text-right text-muted-foreground">Change %</TableHead>
            <TableHead className="text-center text-muted-foreground">Chart</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset, index) => (
            <TableRow 
              key={asset.ticker} 
              className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleRowClick(asset.ticker)}
            >
              <TableCell className="font-medium text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border">
                    <span className="text-xs font-bold text-primary">
                      {asset.ticker.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{asset.name || asset.ticker}</p>
                    <p className="text-xs text-muted-foreground">{asset.ticker}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <TrendBadge color={asset.ghl_color} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatTimeSinceFlipped(asset.ghl_days_since_change)}
              </TableCell>
              <TableCell className="text-right font-mono text-foreground">
                {formatPrice(asset.price)}
              </TableCell>
              <TableCell className={`text-right font-mono ${
                asset.ghl_change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {asset.ghl_change_percent >= 0 ? '+' : ''}{asset.ghl_change_percent.toFixed(2)}%
              </TableCell>
              <TableCell className="text-center">
                <a
                  href={`https://www.tradingview.com/chart/?symbol=${getTradingViewSymbol(asset.ticker, assetType)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  TradingView
                  <ExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
