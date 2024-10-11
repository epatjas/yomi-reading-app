import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id: string;
  username: string;
  avatar_url: string;
  current_energy: number;
  max_energy: number;
  reading_points: number;
  evolution_stage: string;
}

export async function createUserProfile(username: string, avatarUrl: string): Promise<User | null> {
  try {
    console.log('Attempting to create profile:', { username, avatarUrl });
    
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      console.error('Error checking existing user:', checkError);
      throw checkError;
    }

    if (existingUser) {
      throw new Error('USERNAME_TAKEN');
    }

    // Proceed with profile creation
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        avatar_url: avatarUrl,
        current_energy: 100,
        max_energy: 100,
        reading_points: 0,
        evolution_stage: 'egg'
      })
      .single();

    console.log('Insert response:', { insertData, insertError });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return insertData || null;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error; // Re-throw the error to be handled in the component
  }
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

// Add this function to userService.ts
export async function getUserProfiles(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('username');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    throw error;
  }
}

export async function getUserReadingHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select(`
        id,
        progress,
        completed,
        created_at,
        updated_at,
        stories:story_id (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user reading history:', error);
    throw error;
  }
}
