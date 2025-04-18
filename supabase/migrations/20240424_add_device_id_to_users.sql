-- Add device_id column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add a high-performance index on device_id to handle thousands of users
-- This will make filtering by device_id extremely fast
CREATE INDEX IF NOT EXISTS idx_users_device_id ON public.users (device_id);

-- Add comment explaining the purpose of this column
COMMENT ON COLUMN public.users.device_id IS 'Used to identify which device created this profile for privacy without authentication'; 