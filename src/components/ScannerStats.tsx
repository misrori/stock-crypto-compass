import { cn } from '@/lib/utils';

interface ScannerStatsProps {
  total: number;
  bullish: number;
  bearish: number;
  neutral: number;
  assetType: string;
}

export const ScannerStats = ({ total, bullish, bearish, neutral, assetType }: ScannerStatsProps) => {
  const bullishPercent = total > 0 ? Math.round((bullish / total) * 100) : 0;
  const bearishPercent = total > 0 ? Math.round((bearish / total) * 100) : 0;
  const neutralPercent = total > 0 ? Math.round((neutral / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Total {assetType}
        </p>
        <p className="text-3xl font-bold text-foreground">{total}</p>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bullish</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-sm text-emerald-400">({bullishPercent}%)</span>
          <span className="text-3xl font-bold text-emerald-400">{bullish}</span>
        </div>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bearish</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-sm text-rose-400">({bearishPercent}%)</span>
          <span className="text-3xl font-bold text-rose-400">{bearish}</span>
        </div>
      </div>
      
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Neutral</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-sm text-slate-400">({neutralPercent}%)</span>
          <span className="text-3xl font-bold text-slate-400">{neutral}</span>
        </div>
      </div>
    </div>
  );
};
