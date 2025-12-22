-- Polar Payment Integration Migration
-- Run this in Supabase SQL Editor

-- Add Polar-related columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS polar_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_id text;

-- Create subscription history table for auditing
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled'
  from_tier text,
  to_tier text NOT NULL,
  subscription_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription history
CREATE POLICY "Users can view own subscription history"
  ON public.subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_polar_customer_id ON public.profiles(polar_customer_id);

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') AND (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
    INSERT INTO public.subscription_history (user_id, event_type, from_tier, to_tier, subscription_id)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.subscription_tier = 'free' THEN 'canceled'
        WHEN OLD.subscription_tier = 'free' THEN 'created'
        WHEN OLD.subscription_tier = 'pro' AND NEW.subscription_tier = 'team' THEN 'upgraded'
        WHEN OLD.subscription_tier = 'team' AND NEW.subscription_tier = 'pro' THEN 'downgraded'
        ELSE 'updated'
      END,
      OLD.subscription_tier,
      NEW.subscription_tier,
      NEW.subscription_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for subscription change logging
DROP TRIGGER IF EXISTS on_subscription_change ON public.profiles;
CREATE TRIGGER on_subscription_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();





