import { createClient } from '@supabase/supabase-js'
import { INITIAL_ENERGY } from './yomiEnergyService';
import { ReadingSession } from './readingSessionsHelpers';

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
  console.log('Attempting to create profile:', { username, avatarUrl });
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ 
        username, 
        avatar_url: avatarUrl,
        current_energy: INITIAL_ENERGY,
        max_energy: 100, // or whatever your max energy value is
        reading_points: 0,
        evolution_stage: 'initial', // or whatever your initial stage is
        last_energy_update: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Supabase upsert response:', { data, error });

    if (error) throw error;

    if (!data) {
      console.log('No data returned from upsert operation');
      return null;
    }

    console.log('Profile created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
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
      .select()
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

export async function getUserReadingHistory(userId: string): Promise<ReadingSession[]> {
  try {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select(`
        *,
        stories:story_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) throw error;

    // Transform the data to include the story title
    const transformedData = data?.map(session => ({
      ...session,
      story_title: session.stories?.title || 'Unknown Story'
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error fetching user reading history:', error);
    throw error;
  }
}

export async function getUserTotalEnergy(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('current_energy')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return Math.round(data?.current_energy) || 0;
  } catch (error) {
    console.error('Error fetching user current energy:', error);
    return 0;
  }
}

export async function updateUserEnergy(userId: string, energyToAdd: number): Promise<number> {
  try {
    // First, get the current energy
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('current_energy')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!userData) throw new Error('User not found');

    const currentEnergy = userData.current_energy || 0;
    const newEnergy = Math.round(currentEnergy + energyToAdd);

    // Then, update with the new total
    const { data, error } = await supabase
      .from('users')
      .update({ current_energy: newEnergy })
      .eq('id', userId)
      .select('current_energy')
      .single();

    if (error) throw error;
    return data?.current_energy || 0;
  } catch (error) {
    console.error('Error updating user energy:', error);
    throw error;
  }
}

export async function updateUserReadingPoints(userId: string, pointsToAdd: number): Promise<void> {
  try {
    // First, get the current reading points
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('reading_points')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    if (!userData) throw new Error('User not found');

    const currentPoints = userData.reading_points || 0;
    const newPoints = currentPoints + pointsToAdd;

    // Then, update with the new total
    const { error: updateError } = await supabase
      .from('users')
      .update({ reading_points: newPoints })
      .eq('id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating user reading points:', error);
    throw error;
  }
}

export async function getTotalReadingTime(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('duration')
      .eq('user_id', userId);

    if (error) throw error;

    console.log('Reading sessions data:', data); // Add this log

    const totalSeconds = data.reduce((sum, session) => sum + (session.duration || 0), 0);
    console.log('Total reading time (seconds):', totalSeconds); // Add this log
    return totalSeconds;
  } catch (error) {
    console.error('Error fetching total reading time:', error);
    throw error;
  }
}

export async function getTotalReadingPoints(userId: string): Promise<number> {
  console.log('Fetching total reading points for user:', userId);
  const { data, error } = await supabase
    .from('reading_sessions')
    .select('reading_points')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching total reading points:', error);
    return 0;
  }

  const totalPoints = data.reduce((sum, session) => sum + (session.reading_points || 0), 0);
  console.log('Calculated total reading points:', totalPoints);
  return totalPoints;
}
