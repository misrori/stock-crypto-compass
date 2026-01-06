import { Clock, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isPast } from 'date-fns';
import { 
  type Prediction,
  HORIZON_LABELS,
  REASONING_LABELS,
  type PredictionReasoning
} from '@/types/prediction';

interface UserPredictionsProps {
  predictions: Prediction[];
  currentPrice: number;
}

export function UserPredictions({ predictions, currentPrice }: UserPredictionsProps) {
  if (predictions.length === 0) {
    return null;
  }

  const activePredictions = predictions.filter(p => !isPast(new Date(p.valid_until)));
  const expiredPredictions = predictions.filter(p => isPast(new Date(p.valid_until)));

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Clock className="h-5 w-5 text-primary" />
          Your Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activePredictions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Active</h4>
            {activePredictions.map(prediction => (
              <PredictionCard 
                key={prediction.id} 
                prediction={prediction} 
                currentPrice={currentPrice}
                isActive 
              />
            ))}
          </div>
        )}

        {expiredPredictions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Expired</h4>
            {expiredPredictions.slice(0, 5).map(prediction => (
              <PredictionCard 
                key={prediction.id} 
                prediction={prediction} 
                currentPrice={currentPrice}
                isActive={false}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PredictionCard({ 
  prediction, 
  currentPrice,
  isActive 
}: { 
  prediction: Prediction; 
  currentPrice: number;
  isActive: boolean;
}) {
  const DirectionIcon = prediction.direction === 'long' 
    ? TrendingUp 
    : prediction.direction === 'short' 
      ? TrendingDown 
      : Minus;

  const directionColor = prediction.direction === 'long' 
    ? 'text-green-500' 
    : prediction.direction === 'short' 
      ? 'text-red-500' 
      : 'text-muted-foreground';

  const targetPrice = prediction.precise_target_price 
    || prediction.current_price_at_prediction * (1 + prediction.expected_move_bucket / 100);

  const priceChange = ((currentPrice - prediction.current_price_at_prediction) / prediction.current_price_at_prediction) * 100;

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${isActive ? 'border-border' : 'border-border/50 opacity-60'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DirectionIcon className={`h-4 w-4 ${directionColor}`} />
          <span className="font-medium capitalize">{prediction.direction}</span>
          <Badge variant="outline" className="text-xs">
            {HORIZON_LABELS[prediction.horizon as keyof typeof HORIZON_LABELS]}
          </Badge>
        </div>
        {isActive ? (
          <span className="text-xs text-muted-foreground">
            Expires {formatDistanceToNow(new Date(prediction.valid_until), { addSuffix: true })}
          </span>
        ) : (
          <Badge variant={prediction.direction_correct ? 'default' : 'destructive'} className="text-xs">
            {prediction.is_evaluated ? (
              prediction.direction_correct ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Correct</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Wrong</>
              )
            ) : (
              'Pending'
            )}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">Entry Price:</span>
          <p className="font-mono">${prediction.current_price_at_prediction.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">Target ({prediction.expected_move_bucket > 0 ? '+' : ''}{prediction.expected_move_bucket}%):</span>
          <p className="font-mono">${targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Current Change:</span>
          <span className={`font-mono font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
      )}

      {prediction.reasoning_tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {prediction.reasoning_tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {REASONING_LABELS[tag as PredictionReasoning]}
            </Badge>
          ))}
        </div>
      )}

      {prediction.comment && (
        <p className="text-xs text-muted-foreground italic">"{prediction.comment}"</p>
      )}
    </div>
  );
}
