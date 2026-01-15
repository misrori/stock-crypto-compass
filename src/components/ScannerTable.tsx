import { useState, useMemo } from 'react';
import { ExternalLink, ChevronUp, ChevronDown, Search, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { TrendBadge } from './TrendBadge';
import type { GoldHandAsset, AssetType } from '@/hooks/useGoldHandData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { formatPrice } from '@/lib/utils';

interface ScannerTableProps {
  data: GoldHandAsset[];
  assetType: AssetType;
  loading: boolean;
}

type SortConfig = {
  key: keyof GoldHandAsset | 'index' | 'favorite' | '';
  direction: 'asc' | 'desc' | null;
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
    const cleanTicker = ticker.replace('_USD', '').replace('USD', '');
    return `BINANCE:${cleanTicker}USDT`;
  }
  if (assetType === 'commodities') {
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
  return `NASDAQ:${ticker}`;
};

const formatMarketCap = (val: string | number | undefined): string => {
  if (val === undefined || val === null || val === '') return '-';
  if (typeof val === 'string' && (val.includes('T') || val.includes('B') || val.includes('M'))) return val.startsWith('$') ? val : `$${val}`;

  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return val.toString();

  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const parseMarketCap = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = val.toString().toUpperCase().replace(/[$,]/g, '');
  let num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (str.endsWith('T')) num *= 1e12;
  else if (str.endsWith('B')) num *= 1e9;
  else if (str.endsWith('M')) num *= 1e6;
  return num;
};

export const ScannerTable = ({ data, assetType, loading }: ScannerTableProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const handleRowClick = (ticker: string) => {
    navigate(`/scanner/${assetType}/${encodeURIComponent(ticker)}`);
  };

  const handleToggleWatchlist = (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    toggleWatchlist(ticker, assetType);
  };

  const requestSort = (key: keyof GoldHandAsset | 'index' | 'favorite') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key: direction ? key : '', direction });
  };

  const filteredAndSortedData = useMemo(() => {
    let processed = data.filter(asset =>
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.name && asset.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.commodity_name && asset.commodity_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (sortConfig.key && sortConfig.direction) {
      processed = [...processed].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'index') {
          aValue = data.findIndex(x => x.ticker === a.ticker);
          bValue = data.findIndex(x => x.ticker === b.ticker);
        } else if (sortConfig.key === 'favorite') {
          aValue = isInWatchlist(a.ticker, assetType) ? 1 : 0;
          bValue = isInWatchlist(b.ticker, assetType) ? 1 : 0;
        } else if (sortConfig.key === 'market_capitalization') {
          aValue = parseMarketCap(a.market_capitalization);
          bValue = parseMarketCap(b.market_capitalization);
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
    }

    return processed;
  }, [data, searchQuery, sortConfig, isInWatchlist, assetType]);

  const SortIcon = ({ column }: { column: keyof GoldHandAsset | 'index' | 'favorite' }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1 inline-block text-primary" /> :
      <ChevronDown className="h-4 w-4 ml-1 inline-block text-primary" />;
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

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${assetType}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card/50 border-border"
        />
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
        {filteredAndSortedData.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No assets found matching "{searchQuery}"
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead
                  className="w-10 text-muted-foreground cursor-pointer hover:text-foreground transition-colors group px-2"
                  onClick={() => requestSort('favorite')}
                >
                  <div className="flex items-center justify-center">
                    <Star className="h-4 w-4" /> <SortIcon column="favorite" />
                  </div>
                </TableHead>
                <TableHead
                  className="w-12 text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => requestSort('index')}
                >
                  <div className="flex items-center">
                    # <SortIcon column="index" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => requestSort('ticker')}
                >
                  <div className="flex items-center">
                    {assetType === 'stocks' ? 'Stock' : assetType === 'crypto' ? 'Crypto' : 'Commodity'}
                    <SortIcon column="ticker" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => requestSort('ghl_color')}
                >
                  <div className="flex items-center">
                    Trend <SortIcon column="ghl_color" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => requestSort('ghl_days_since_change')}
                >
                  <div className="flex items-center">
                    Time Since Flipped <SortIcon column="ghl_days_since_change" />
                  </div>
                </TableHead>
                {assetType !== 'commodities' && (
                  <TableHead
                    className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                    onClick={() => requestSort('market_capitalization' as any)}
                  >
                    <div className="flex items-center justify-end">
                      Market Cap <SortIcon column={'market_capitalization' as any} />
                    </div>
                  </TableHead>
                )}
                <TableHead
                  className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => requestSort('price')}
                >
                  <div className="flex items-center justify-end">
                    Price <SortIcon column="price" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-right text-muted-foreground cursor-pointer hover:text-foreground transition-colors group"
                  onClick={() => requestSort('ghl_change_percent')}
                >
                  <div className="flex items-center justify-end">
                    Change % <SortIcon column="ghl_change_percent" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((asset) => {
                const originalIndex = data.findIndex(x => x.ticker === asset.ticker);
                const displayName = assetType === 'commodities' ? (asset.commodity_name || asset.name) : asset.name;
                const isFavorite = isInWatchlist(asset.ticker, assetType);

                return (
                  <TableRow
                    key={asset.ticker}
                    className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(asset.ticker)}
                  >
                    <TableCell className="text-center px-2" onClick={(e) => handleToggleWatchlist(e, asset.ticker)}>
                      <Star className={`h-4 w-4 transition-all duration-300 ${isFavorite ? 'fill-yellow-400 text-yellow-500 scale-125' : 'text-muted-foreground/30 hover:text-muted-foreground/60'}`} />
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground">
                      {originalIndex + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-border">
                          <span className="text-xs font-bold text-primary">
                            {asset.ticker.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground whitespace-nowrap">{displayName || asset.ticker}</p>
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
                    {assetType !== 'commodities' && (
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {formatMarketCap(asset.market_capitalization)}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-mono text-foreground">
                      {formatPrice(asset.price)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${asset.ghl_change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.ghl_change_percent >= 0 ? '+' : ''}{asset.ghl_change_percent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
