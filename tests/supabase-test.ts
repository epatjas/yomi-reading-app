/**
 * Supabase Connection Test
 * 
 * This script tests the connection to Supabase and attempts to perform
 * basic read and write operations. It's currently not in use due to
 * Row Level Security (RLS) policy restrictions.
 * 
 * TODO: Revisit this test when implementing user authentication and
 * setting up proper RLS policies.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function testSupabaseConnection() {
  try {
    // Insert a new user
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert([
        { username: `testuser_${Date.now()}`, avatar_url: 'https://example.com/avatar.jpg' }
      ])
      .select()

    if (insertError) throw insertError

    console.log('User inserted successfully:', insertedUser)

    // Fetch users
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (selectError) throw selectError

    console.log('Users in the database:', users)

    return { success: true, message: 'Connection successful, user inserted and retrieved' }
  } catch (error) {
    console.error('Operation failed:', error)
    return { success: false, message: 'Operation failed' }
  }
}