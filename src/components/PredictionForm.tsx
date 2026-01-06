import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  type PredictionDirection, 
  type PredictionHorizon, 
  type PredictionReasoning,
  HORIZON_LABELS,
  REASONING_LABELS,
  MOVE_BUCKETS
} from '@/types/prediction';

interface PredictionFormProps {
  assetTicker: string;
  assetType: string;
  currentPrice: number;
  onSubmit: (data: {
    direction: PredictionDirection;
    horizon: PredictionHorizon;
    expectedMoveBucket: number;
    preciseTargetPrice: number | null;
    riskScore: number;
    reasoningTags: PredictionReasoning[];
    comment: string | null;
  }) => Promise<{ error: Error | null }>;
  hasActivePrediction: (horizon: PredictionHorizon) => boolean;
}

export function PredictionForm({ 
  assetTicker, 
  assetType, 
  currentPrice,
  onSubmit,
  hasActivePrediction 
}: PredictionFormProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<PredictionDirection | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<PredictionHorizon | null>(null);
  const [bucket, setBucket] = useState<number>(0);
  const [precisePrice, setPrecisePrice] = useState<number | null>(null);
  const [usePrecisePrice, setUsePrecisePrice] = useState(false);
  const [riskScore, setRiskScore] = useState(3);
  const [reasoningTags, setReasoningTags] = useState<PredictionReasoning[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const horizons: PredictionHorizon[] = ['1_week', '1_month', '3_months', '1_year'];
  const reasonings: PredictionReasoning[] = [
    'technical_analysis',
    'fundamental_analysis',
    'macro_rates',
    'news_events',
    'momentum_trend',
    'onchain_flow',
    'intuition_experience',
  ];

  const getAvailableBuckets = () => {
    if (direction === 'neutral') return [0];
    if (direction === 'short') return MOVE_BUCKETS.filter(b => b <= 0);
    if (direction === 'long') return MOVE_BUCKETS.filter(b => b >= 0);
    return MOVE_BUCKETS;
  };

  const calculateTargetPrice = (bucketPercent: number): number => {
    return currentPrice * (1 + bucketPercent / 100);
  };

  const getPrecisePriceRange = () => {
    const bucketPrice = calculateTargetPrice(bucket);
    const min = bucketPrice * 0.9;
    const max = bucketPrice * 1.1;
    return { min, max };
  };

  const toggleReasoning = (reasoning: PredictionReasoning) => {
    if (reasoningTags.includes(reasoning)) {
      setReasoningTags(reasoningTags.filter(r => r !== reasoning));
    } else if (reasoningTags.length < 2) {
      setReasoningTags([...reasoningTags, reasoning]);
    }
  };

  const handleSubmit = async () => {
    if (!direction || !selectedHorizon) return;

    setSubmitting(true);
    const result = await onSubmit({
      direction,
      horizon: selectedHorizon,
      expectedMoveBucket: bucket,
      preciseTargetPrice: usePrecisePrice ? precisePrice : null,
      riskScore,
      reasoningTags,
      comment: comment.trim() || null,
    });

    setSubmitting(false);

    if (result.error) {
      toast.error('Failed to submit prediction', { description: result.error.message });
    } else {
      toast.success('Prediction submitted!', { 
        description: `Your ${HORIZON_LABELS[selectedHorizon]} prediction for ${assetTicker} has been recorded.`
      });
      // Reset form
      setStep(1);
      setDirection(null);
      setSelectedHorizon(null);
      setBucket(0);
      setPrecisePrice(null);
      setUsePrecisePrice(false);
      setRiskScore(3);
      setReasoningTags([]);
      setComment('');
    }
  };

  const riskLabels = ['Very Low', 'Low', 'Medium', 'High', 'Extreme'];

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Clock className="h-5 w-5 text-primary" />
          Submit Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Direction */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Step 1: Direction
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={direction === 'long' ? 'default' : 'outline'}
              className={`gap-2 ${direction === 'long' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => { setDirection('long'); setBucket(10); setStep(Math.max(step, 2)); }}
            >
              <TrendingUp className="h-4 w-4" />
              Long
            </Button>
            <Button
              variant={direction === 'short' ? 'default' : 'outline'}
              className={`gap-2 ${direction === 'short' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={() => { setDirection('short'); setBucket(-10); setStep(Math.max(step, 2)); }}
            >
              <TrendingDown className="h-4 w-4" />
              Short
            </Button>
            <Button
              variant={direction === 'neutral' ? 'default' : 'outline'}
              className={`gap-2 ${direction === 'neutral' ? 'bg-muted-foreground hover:bg-muted-foreground/80' : ''}`}
              onClick={() => { setDirection('neutral'); setBucket(0); setStep(Math.max(step, 2)); }}
            >
              <Minus className="h-4 w-4" />
              Neutral
            </Button>
          </div>
        </div>

        {/* Step 2: Time Horizon */}
        {step >= 2 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Step 2: Time Horizon
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {horizons.map(horizon => {
                const isActive = hasActivePrediction(horizon);
                return (
                  <Button
                    key={horizon}
                    variant={selectedHorizon === horizon ? 'default' : 'outline'}
                    className="relative"
                    onClick={() => { setSelectedHorizon(horizon); setStep(Math.max(step, 3)); }}
                    disabled={isActive}
                  >
                    {HORIZON_LABELS[horizon]}
                    {isActive && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 text-[10px] px-1"
                      >
                        Active
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Expected Move Bucket */}
        {step >= 3 && selectedHorizon && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Step 3: Expected Move
            </Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Price:</span>
                <span className="font-mono font-medium">${currentPrice.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <Slider
                  value={[bucket]}
                  onValueChange={([val]) => { setBucket(val); setStep(Math.max(step, 4)); }}
                  min={direction === 'long' ? 0 : direction === 'short' ? -100 : -100}
                  max={direction === 'long' ? 100 : direction === 'short' ? 0 : 100}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{direction === 'long' ? '0%' : '-100%'}</span>
                  <span className="font-mono text-foreground font-medium">
                    {bucket > 0 ? '+' : ''}{bucket}% → ${calculateTargetPrice(bucket).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span>{direction === 'short' ? '0%' : '+100%'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Precise Target Price (Optional) */}
        {step >= 4 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="usePrecise"
                checked={usePrecisePrice}
                onCheckedChange={(checked) => {
                  setUsePrecisePrice(!!checked);
                  if (checked && !precisePrice) {
                    setPrecisePrice(calculateTargetPrice(bucket));
                  }
                }}
              />
              <Label htmlFor="usePrecise" className="text-sm font-medium text-muted-foreground cursor-pointer">
                Step 4: Precise Target Price (Optional)
              </Label>
            </div>
            {usePrecisePrice && (
              <div className="space-y-2 pl-6">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={precisePrice || ''}
                    onChange={(e) => setPrecisePrice(parseFloat(e.target.value) || null)}
                    placeholder="Enter target price"
                    className="font-mono"
                    min={getPrecisePriceRange().min}
                    max={getPrecisePriceRange().max}
                  />
                </div>
                <Slider
                  value={[precisePrice || calculateTargetPrice(bucket)]}
                  onValueChange={([val]) => setPrecisePrice(val)}
                  min={getPrecisePriceRange().min}
                  max={getPrecisePriceRange().max}
                  step={0.01}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Range: ${getPrecisePriceRange().min.toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                  — ${getPrecisePriceRange().max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Risk Perception */}
        {step >= 4 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Step 5: Risk Perception
            </Label>
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <Button
                    key={score}
                    variant={riskScore === score ? 'default' : 'outline'}
                    size="sm"
                    className={`flex-1 ${
                      riskScore === score 
                        ? score <= 2 ? 'bg-green-600' : score === 3 ? 'bg-yellow-600' : 'bg-red-600'
                        : ''
                    }`}
                    onClick={() => setRiskScore(score)}
                  >
                    <AlertTriangle className={`h-3 w-3 ${score >= 4 ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {riskLabels[riskScore - 1]} Risk
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Reasoning Tags */}
        {step >= 4 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Step 6: Reasoning (Select up to 2)
            </Label>
            <div className="flex flex-wrap gap-2">
              {reasonings.map(reasoning => (
                <Badge
                  key={reasoning}
                  variant={reasoningTags.includes(reasoning) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    reasoningTags.includes(reasoning) 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  } ${reasoningTags.length >= 2 && !reasoningTags.includes(reasoning) ? 'opacity-50' : ''}`}
                  onClick={() => toggleReasoning(reasoning)}
                >
                  {REASONING_LABELS[reasoning]}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Comment */}
        {step >= 4 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Step 7: Comment (Optional, max 240 chars)
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 240))}
              placeholder="Add brief reasoning or context..."
              className="resize-none h-20"
              maxLength={240}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/240
            </p>
          </div>
        )}

        {/* Submit */}
        {step >= 4 && selectedHorizon && (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !direction || !selectedHorizon || reasoningTags.length === 0}
            className="w-full"
          >
            {submitting ? 'Submitting...' : `Submit ${HORIZON_LABELS[selectedHorizon]} Prediction`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
