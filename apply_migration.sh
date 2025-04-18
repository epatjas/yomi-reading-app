#!/bin/bash

# Supabase project details
SUPABASE_URL="https://rkexvjlqjbqktwwipfmi.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZXh2amxxamJxa3R3d2lwZm1pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODU0MjI2MCwiZXhwIjoyMDQ0MTE4MjYwfQ.WKyta3yNow4l-fNmRm7ruWRaFHdkhyWtfurQqHF2YAE"

echo "This script will apply the migration to add device_id to your Supabase users table."
echo "Using Supabase project: $SUPABASE_URL"

# Construct the PSQL command
MIGRATION_FILE="supabase/migrations/20240424_add_device_id_to_users.sql"
echo "Applying migration from $MIGRATION_FILE..."

# Extract database details from the Supabase URL
# The URL format is: https://<project-id>.supabase.co
PROJECT_ID=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|.supabase.co||')
DB_HOST="db.$PROJECT_ID.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"

# Get the database password (this is secure way to prompt for the password)
read -sp "Enter your database password: " DB_PASSWORD
echo ""

# Run the migration using PSQL
echo "Running migration..."
export PGPASSWORD=$DB_PASSWORD
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE

echo "Migration complete!" 