-- Create activation_tokens table
CREATE TABLE IF NOT EXISTS activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activation_tokens_user_id ON activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_token ON activation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_expires_at ON activation_tokens(expires_at);

-- Enable RLS
ALTER TABLE activation_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own activation tokens
CREATE POLICY "Users can view their own activation tokens" ON activation_tokens
  FOR SELECT USING (user_id = auth.uid());

-- Service role can insert activation tokens
CREATE POLICY "Service role can insert activation tokens" ON activation_tokens
  FOR INSERT WITH CHECK (true);

-- Service role can update activation tokens
CREATE POLICY "Service role can update activation tokens" ON activation_tokens
  FOR UPDATE USING (true);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_activation_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM activation_tokens 
  WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired tokens (runs daily)
-- Note: This requires pg_cron extension which might not be available in all Supabase plans
-- For now, we'll handle cleanup manually or through application logic 