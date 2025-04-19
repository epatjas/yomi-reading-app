-- Add English content columns to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS content_en TEXT;

-- Rename existing columns to clarify they are Finnish
COMMENT ON COLUMN public.stories.title IS 'Story title in Finnish';
COMMENT ON COLUMN public.stories.content IS 'Story content in Finnish';

-- Add comments for new columns
COMMENT ON COLUMN public.stories.title_en IS 'Story title in English';
COMMENT ON COLUMN public.stories.content_en IS 'Story content in English';

-- Create a view that provides stories in both languages
CREATE OR REPLACE VIEW public.multilingual_stories AS
SELECT 
  id,
  title AS title_fi,
  content AS content_fi,
  title_en,
  content_en,
  "word-count",
  "difficulty-level",
  cover_image_url,
  created_at
FROM public.stories; 