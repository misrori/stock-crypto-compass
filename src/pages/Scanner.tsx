import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart3, Bitcoin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useGoldHandData, type AssetType, type Timeframe, type TrendFilter } from '@/hooks/useGoldHandData';
import { ScannerStats } from '@/components/ScannerStats';
import { ScannerFilters } from '@/components/ScannerFilters';
import { ScannerTable } from '@/components/ScannerTable';

const Scanner = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [assetType, setAssetType] = useState<AssetType>('stocks');
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('all');

  const { data, loading, error, lastUpdate, stats, refetch } = useGoldHandData(
    assetType,
    timeframe,
    trendFilter
  );

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const assetTypeLabels: Record<AssetType, string> = {
    stocks: 'Stocks',
    crypto: 'Crypto',
    commodities: 'Commodities',
  };

  const formatLastUpdate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return `Last Update: ${date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gold Hand Scanner</h1>
                <p className="text-sm text-muted-foreground">
                  Track market trends with Gold Hand Line indicator
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Asset Type Tabs */}
        <Tabs 
          value={assetType} 
          onValueChange={(v) => setAssetType(v as AssetType)}
          className="w-full"
        >
          <TabsList className="bg-card/50 border border-border">
            <TabsTrigger value="crypto" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bitcoin className="h-4 w-4" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="stocks" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
              Stocks
            </TabsTrigger>
            <TabsTrigger value="commodities" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-4 w-4" />
              Commodities
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats */}
        <ScannerStats 
          total={stats.total}
          bullish={stats.bullish}
          bearish={stats.bearish}
          neutral={stats.neutral}
          assetType={assetTypeLabels[assetType]}
        />

        {/* Last update info */}
        {lastUpdate && (
          <p className="text-sm text-muted-foreground text-right">
            {formatLastUpdate(lastUpdate)}
          </p>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
            <p>Error loading data: {error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
              Try Again
            </Button>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <ScannerTable 
              data={data} 
              assetType={assetType}
              loading={loading}
            />
          </div>

          {/* Filters sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <ScannerFilters
              trendFilter={trendFilter}
              onTrendFilterChange={setTrendFilter}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Scanner;
