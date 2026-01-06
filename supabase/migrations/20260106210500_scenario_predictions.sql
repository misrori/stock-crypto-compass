-- Create scenario_predictions table
CREATE TABLE public.scenario_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  bullish_target_price NUMERIC NOT NULL,
  bearish_target_price NUMERIC NOT NULL,
  bullish_bucket TEXT NOT NULL,
  bearish_bucket TEXT NOT NULL,
  bullish_probability NUMERIC NOT NULL,
  bearish_probability NUMERIC NOT NULL,
  reasoning_tags TEXT[] NOT NULL,
  risk_score INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Index for performance
CREATE INDEX idx_scenario_predictions_asset ON public.scenario_predictions(asset_ticker, asset_type);
CREATE INDEX idx_scenario_predictions_user_asset ON public.scenario_predictions(user_id, asset_ticker);

-- Enable RLS
ALTER TABLE public.scenario_predictions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active predictions" 
ON public.scenario_predictions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can insert their own predictions" 
ON public.scenario_predictions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" 
ON public.scenario_predictions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to archive old predictions when a new one is inserted
CREATE OR REPLACE FUNCTION public.archive_old_predictions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.scenario_predictions
  SET is_active = false
  WHERE user_id = NEW.user_id 
    AND asset_ticker = NEW.asset_ticker 
    AND id <> NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically archive old predictions
CREATE TRIGGER archive_old_predictions_trigger
AFTER INSERT ON public.scenario_predictions
FOR EACH ROW
EXECUTE FUNCTION public.archive_old_predictions();
