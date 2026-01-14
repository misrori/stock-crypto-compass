-- Create user_watchlist table
CREATE TABLE public.user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique per user/asset
  UNIQUE(user_id, asset_ticker, asset_type)
);

-- Indices for performance
CREATE INDEX idx_user_watchlist_user_id ON public.user_watchlist(user_id);

-- RLS Policies
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist"
ON public.user_watchlist FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert into their own watchlist
CREATE POLICY "Users can insert into their own watchlist"
ON public.user_watchlist FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own watchlist
CREATE POLICY "Users can delete from their own watchlist"
ON public.user_watchlist FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
