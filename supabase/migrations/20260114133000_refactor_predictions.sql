-- Migration to add simplified prediction columns
ALTER TABLE public.scenario_predictions 
ADD COLUMN IF NOT EXISTS sentiment NUMERIC,
ADD COLUMN IF NOT EXISTS target_price NUMERIC,
ADD COLUMN IF NOT EXISTS entry_price NUMERIC;

-- Make old columns nullable to avoid breaking insert logic
ALTER TABLE public.scenario_predictions 
ALTER COLUMN bullish_target_price DROP NOT NULL,
ALTER COLUMN bearish_target_price DROP NOT NULL,
ALTER COLUMN bullish_bucket DROP NOT NULL,
ALTER COLUMN bearish_bucket DROP NOT NULL,
ALTER COLUMN bullish_probability DROP NOT NULL,
ALTER COLUMN bearish_probability DROP NOT NULL;

COMMENT ON COLUMN public.scenario_predictions.sentiment IS '0-100 scale, where 0 is extremely bearish and 100 is extremely bullish';
COMMENT ON COLUMN public.scenario_predictions.target_price IS 'The user defined price target for the next 7 days';
COMMENT ON COLUMN public.scenario_predictions.entry_price IS 'The price of the asset at the time the prediction was made';