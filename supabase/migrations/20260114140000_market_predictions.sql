-- Create market_predictions table
CREATE TABLE public.market_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  sentiment NUMERIC NOT NULL, -- 0-100 scale
  target_price NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Index for performance
CREATE INDEX idx_market_predictions_asset ON public.market_predictions(asset_ticker, asset_type);
CREATE INDEX idx_market_predictions_user_asset ON public.market_predictions(user_id, asset_ticker);
CREATE INDEX idx_market_predictions_active ON public.market_predictions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.market_predictions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active predictions" 
ON public.market_predictions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can insert their own predictions" 
ON public.market_predictions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" 
ON public.market_predictions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to archive old predictions when a new one is inserted
CREATE OR REPLACE FUNCTION public.archive_old_market_predictions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.market_predictions
  SET is_active = false
  WHERE user_id = NEW.user_id 
    AND asset_ticker = NEW.asset_ticker 
    AND id <> NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically archive old predictions
CREATE TRIGGER archive_old_market_predictions_trigger
AFTER INSERT ON public.market_predictions
FOR EACH ROW
EXECUTE FUNCTION public.archive_old_market_predictions();

-- Comments
COMMENT ON TABLE public.market_predictions IS 'Market consciousness layer - individual asset price tips';
COMMENT ON COLUMN public.market_predictions.sentiment IS '0-100 scale, where 0 is extremely bearish and 100 is extremely bullish';
COMMENT ON COLUMN public.market_predictions.target_price IS 'The user defined price target for the next 7 days';
COMMENT ON COLUMN public.market_predictions.entry_price IS 'The price of the asset at the time the prediction was made';
