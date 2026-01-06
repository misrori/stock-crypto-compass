import { Lock, TrendingUp, TrendingDown, Minus, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  type PredictionHorizon,
  type AggregatedPredictions as AggregatedPredictionsType,
  HORIZON_LABELS,
  REASONING_LABELS,
  type PredictionReasoning
} from '@/types/prediction';

interface AggregatedPredictionsProps {
  aggregatedData: Record<PredictionHorizon, AggregatedPredictionsType | null>;
  hasActivePrediction: (horizon: PredictionHorizon) => boolean;
  currentPrice: number;
}

export function AggregatedPredictions({ 
  aggregatedData, 
  hasActivePrediction,
  currentPrice 
}: AggregatedPredictionsProps) {
  const horizons: PredictionHorizon[] = ['1_week', '1_month', '3_months', '1_year'];
  
  const firstUnlockedHorizon = horizons.find(h => hasActivePrediction(h)) || '1_week';

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Users className="h-5 w-5 text-primary" />
          Collective Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={firstUnlockedHorizon}>
          <TabsList className="grid grid-cols-4 mb-4">
            {horizons.map(horizon => (
              <TabsTrigger 
                key={horizon} 
                value={horizon}
                disabled={!hasActivePrediction(horizon)}
                className="relative text-xs"
              >
                {HORIZON_LABELS[horizon]}
                {!hasActivePrediction(horizon) && (
                  <Lock className="absolute -top-1 -right-1 h-3 w-3 text-muted-foreground" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {horizons.map(horizon => (
            <TabsContent key={horizon} value={horizon}>
              {!hasActivePrediction(horizon) ? (
                <LockedView horizon={horizon} />
              ) : aggregatedData[horizon] ? (
                <UnlockedView 
                  data={aggregatedData[horizon]!} 
                  currentPrice={currentPrice}
                />
              ) : (
                <EmptyView horizon={horizon} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function LockedView({ horizon }: { horizon: PredictionHorizon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Lock className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-medium text-foreground mb-2">Predictions Locked</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Submit your own {HORIZON_LABELS[horizon]} prediction to unlock collective insights for this time horizon.
      </p>
    </div>
  );
}

function EmptyView({ horizon }: { horizon: PredictionHorizon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="font-medium text-foreground mb-2">No Predictions Yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Be the first to submit a {HORIZON_LABELS[horizon]} prediction for this asset.
      </p>
    </div>
  );
}

function UnlockedView({ 
  data, 
  currentPrice 
}: { 
  data: AggregatedPredictionsType; 
  currentPrice: number;
}) {
  const total = data.directionDistribution.long + data.directionDistribution.short + data.directionDistribution.neutral;
  const longPercent = total > 0 ? (data.directionDistribution.long / total) * 100 : 0;
  const shortPercent = total > 0 ? (data.directionDistribution.short / total) * 100 : 0;
  const neutralPercent = total > 0 ? (data.directionDistribution.neutral / total) * 100 : 0;

  const sortedBuckets = Object.entries(data.bucketDistribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));
  const maxBucketCount = Math.max(...Object.values(data.bucketDistribution), 1);

  const sortedReasonings = Object.entries(data.reasoningBreakdown)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);
  const maxReasoningCount = Math.max(...Object.values(data.reasoningBreakdown), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Predictions:</span>
        <Badge variant="secondary">{data.totalCount}</Badge>
      </div>

      {/* Direction Distribution */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Direction Sentiment</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs w-16">Long</span>
            <Progress value={longPercent} className="flex-1 h-2" />
            <span className="text-xs font-mono w-12 text-right">{longPercent.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs w-16">Short</span>
            <Progress value={shortPercent} className="flex-1 h-2 [&>div]:bg-red-500" />
            <span className="text-xs font-mono w-12 text-right">{shortPercent.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs w-16">Neutral</span>
            <Progress value={neutralPercent} className="flex-1 h-2 [&>div]:bg-muted-foreground" />
            <span className="text-xs font-mono w-12 text-right">{neutralPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Expected Move Buckets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Expected Move Distribution</h4>
        <div className="space-y-1">
          {sortedBuckets.map(([bucket, count]) => (
            <div key={bucket} className="flex items-center gap-2">
              <span className="text-xs font-mono w-12 text-right">
                {parseInt(bucket) > 0 ? '+' : ''}{bucket}%
              </span>
              <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
                <div 
                  className={`h-full ${parseInt(bucket) >= 0 ? 'bg-green-500/70' : 'bg-red-500/70'}`}
                  style={{ width: `${(count / maxBucketCount) * 100}%` }}
                />
              </div>
              <span className="text-xs w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Price Statistics */}
      {data.targetPrices.median && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Target Price Consensus</h4>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price:</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Median Target:</span>
              <span className="font-mono font-medium text-primary">
                ${data.targetPrices.median.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            {data.targetPrices.percentile25 && data.targetPrices.percentile75 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">25-75th Percentile:</span>
                <span className="font-mono text-xs">
                  ${data.targetPrices.percentile25.toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                  — ${data.targetPrices.percentile75.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Score */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Average Risk Perception</h4>
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${
            data.avgRiskScore <= 2 ? 'text-green-500' : 
            data.avgRiskScore <= 3 ? 'text-yellow-500' : 
            'text-red-500'
          }`} />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <div
                key={score}
                className={`w-6 h-2 rounded-sm ${
                  score <= Math.round(data.avgRiskScore)
                    ? score <= 2 ? 'bg-green-500' : score === 3 ? 'bg-yellow-500' : 'bg-red-500'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({data.avgRiskScore.toFixed(1)}/5)
          </span>
        </div>
      </div>

      {/* Reasoning Breakdown */}
      {sortedReasonings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Reasoning Categories</h4>
          <div className="space-y-1">
            {sortedReasonings.map(([reasoning, count]) => (
              <div key={reasoning} className="flex items-center gap-2">
                <span className="text-xs w-32 truncate">
                  {REASONING_LABELS[reasoning as PredictionReasoning]}
                </span>
                <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden">
                  <div 
                    className="h-full bg-primary/70"
                    style={{ width: `${(count / maxReasoningCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs w-6">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
