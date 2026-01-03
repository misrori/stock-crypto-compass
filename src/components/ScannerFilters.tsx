import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { TrendFilter, Timeframe } from '@/hooks/useGoldHandData';

interface ScannerFiltersProps {
  trendFilter: TrendFilter;
  onTrendFilterChange: (filter: TrendFilter) => void;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
}

export const ScannerFilters = ({
  trendFilter,
  onTrendFilterChange,
  timeframe,
  onTimeframeChange,
}: ScannerFiltersProps) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Filter</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            onTrendFilterChange('all');
            onTimeframeChange('daily');
          }}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Trend
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={trendFilter === 'bullish' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTrendFilterChange(trendFilter === 'bullish' ? 'all' : 'bullish')}
            className={cn(
              'gap-1.5',
              trendFilter === 'bullish' && 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            BULLISH
          </Button>
          <Button
            variant={trendFilter === 'bearish' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTrendFilterChange(trendFilter === 'bearish' ? 'all' : 'bearish')}
            className={cn(
              'gap-1.5',
              trendFilter === 'bearish' && 'bg-rose-600 hover:bg-rose-700 text-white'
            )}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            BEARISH
          </Button>
          <Button
            variant={trendFilter === 'neutral' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTrendFilterChange(trendFilter === 'neutral' ? 'all' : 'neutral')}
            className={cn(
              'gap-1.5',
              trendFilter === 'neutral' && 'bg-slate-600 hover:bg-slate-700 text-white'
            )}
          >
            <Minus className="h-3.5 w-3.5" />
            NEUTRAL
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Timeframe
        </label>
        <ToggleGroup
          type="single"
          value={timeframe}
          onValueChange={(value) => value && onTimeframeChange(value as Timeframe)}
          className="justify-start"
        >
          <ToggleGroupItem 
            value="daily" 
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Daily
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="weekly"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            Weekly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
};
