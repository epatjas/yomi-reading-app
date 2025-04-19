#!/bin/bash

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print script header
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}   Multilingual Stories Migration   ${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Check that .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found. Please create it with your Supabase credentials.${NC}"
  exit 1
fi

# Source the .env file to get environment variables
source .env

echo -e "${YELLOW}Applying migration to add multilingual support for stories...${NC}"

# Create the migration file if it doesn't exist
MIGRATION_FILE="supabase/migrations/20240622_add_multilingual_support.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${YELLOW}Creating migration file...${NC}"
  mkdir -p supabase/migrations
  cat > "$MIGRATION_FILE" << 'EOF'
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
EOF
  echo -e "${GREEN}Migration file created successfully.${NC}"
else
  echo -e "${YELLOW}Migration file already exists, using existing file.${NC}"
fi

# Check required environment variables
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo -e "${RED}Error: Supabase environment variables are not set.${NC}"
  echo "Please make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are defined in .env file."
  exit 1
fi

# Apply the migration using Supabase REST API
echo -e "${YELLOW}Applying migration to Supabase database...${NC}"
echo -e "${YELLOW}This may take a few moments...${NC}"

# Extract the Supabase URL without the /auth/v1 part if it's present
SUPABASE_URL=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/\/auth\/v1//g')

# Read the migration file
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Use curl to apply the migration
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/pg_execute_sql" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql_string\": \"$SQL_CONTENT\"}" \
)

# Check if the migration was successful
if [[ $RESPONSE == *"error"* ]]; then
  echo -e "${RED}Error applying migration:${NC}"
  echo $RESPONSE
  exit 1
else
  echo -e "${GREEN}Migration applied successfully!${NC}"
  echo -e "${BLUE}Your database now supports multilingual stories.${NC}"
  echo -e "${YELLOW}Remember to update your existing stories with English translations.${NC}"
fi

echo ""
echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}          MIGRATION COMPLETE        ${NC}"
echo -e "${BLUE}====================================${NC}"
