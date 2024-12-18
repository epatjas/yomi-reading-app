import { supabase } from './supabase';
import { INITIAL_ENERGY } from './yomiEnergyService';
import { ReadingSession } from './readingSessionsHelpers';

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
        current_energy: 60,
        max_energy: 100,
        reading_points: 0,
        evolution_stage: 'initial',
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
    // Calculate start of current week
    const today = new Date();
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - currentDayIndex);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('reading_sessions')
      .select(`
        *,
        stories:story_id (
          title
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', startOfWeek.toISOString())
      .order('start_time', { ascending: false });

    if (error) throw error;

    return data?.map(session => ({
      ...session,
      story_title: session.stories?.title || 'Unknown Story'
    })) || [];
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

    console.log('Fetched current energy:', userData.current_energy);
    console.log('Calculated new energy:', newEnergy);
    console.log('Energy update result:', data);

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

export const getTotalReadingTime = async (userId: string): Promise<number> => {
  try {
    console.log('Fetching total reading time for user:', userId);
    // First, let's check what's in the reading_sessions table for this user
    const { data: allSessions, error: checkError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', userId);
    
    console.log('All sessions for user:', allSessions); // This will show us all session data

    const { data, error } = await supabase
      .from('reading_sessions')
      .select('duration')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching reading time:', error);
      return 0;
    }

    const totalSeconds = data.reduce((sum, session) => sum + (session.duration || 0), 0);
    console.log('Total reading time (seconds):', totalSeconds);
    return totalSeconds;
  } catch (error) {
    console.error('Error in getTotalReadingTime:', error);
    return 0;
  }
};

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

// Reading stre

export async function getUserStreak(userId: string): Promise<number> {
  try {
    // First, get all reading sessions from the past week to check for streak
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: sessions, error } = await supabase
      .from('reading_sessions')
      .select('start_time')
      .eq('user_id', userId)
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: false });

    if (error) throw error;
    if (!sessions || sessions.length === 0) return 0;

    // Group sessions by date
    const readDates = sessions.reduce((dates: Set<string>, session) => {
      const date = new Date(session.start_time);
      dates.add(date.toDateString());
      return dates;
    }, new Set<string>());

    // Convert to array and sort in reverse chronological order
    const sortedDates = Array.from(readDates)
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 1; // Start with 1 for the most recent day
    const msPerDay = 24 * 60 * 60 * 1000;

    // Count consecutive days
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const currentDate = sortedDates[i];
      const nextDate = sortedDates[i + 1];
      
      // Calculate the difference in days
      const daysDiff = Math.round(
        (currentDate.getTime() - nextDate.getTime()) / msPerDay
      );

      if (daysDiff === 1) {
        streak++;
      } else {
        break; // Break if we find a gap
      }
    }

    // Update the streak in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ current_streak: streak })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating streak:', updateError);
    }

    return streak;
  } catch (error) {
    console.error('Error getting user streak:', error);
    return 0;
  }
}

export async function updateUserStreak(userId: string): Promise<number> {
  try {
    const now = new Date();
    const userTimeZone = await getUserTimeZone(userId);
    const userMidnight = new Date(now.toLocaleString('en-US', { timeZone: userTimeZone }));
    userMidnight.setHours(0, 0, 0, 0);

    // Get the user's current streak and last read date
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('current_streak, last_read_date')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    let newStreak = 1; // Default to 1 for the first reading
    
    if (userData?.last_read_date) {
      const lastReadDate = new Date(userData.last_read_date);
      const lastReadMidnight = new Date(lastReadDate.toLocaleString('en-US', { timeZone: userTimeZone }));
      lastReadMidnight.setHours(0, 0, 0, 0);

      const daysDifference = Math.floor((userMidnight.getTime() - lastReadMidnight.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference === 0) {
        // Same day reading - maintain current streak
        newStreak = userData.current_streak || 1;
        return newStreak; // Early return as no update needed
      } else if (daysDifference === 1) {
        // Consecutive day reading - increment streak
        newStreak = (userData.current_streak || 0) + 1;
      }
      // daysDifference > 1 means streak is broken, newStreak remains 1
    }

    // Update the streak and last read date
    const { error: updateError } = await supabase
      .from('users')
      .update({
        current_streak: newStreak,
        last_read_date: now.toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return newStreak;
  } catch (error) {
    console.error('Error updating user streak:', error);
    throw error;
  }
}

// New function to get user's time zone
async function getUserTimeZone(userId: string): Promise<string> {
  // Implement logic to fetch user's time zone from the database
  // For now, we'll return a default time zone
  return 'America/New_York';
}

export async function getLastReadDate(userId: string): Promise<Date | null> {
  const { data, error } = await supabase
    .from('users')
    .select('last_read_date')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching last read date:', error);
    return null;
  }

  return data?.last_read_date ? new Date(data.last_read_date) : null;
}

export async function saveReadingSession(
  userId: string, 
  sessionData: Partial<ReadingSession>
): Promise<ReadingSession | null> {
  try {
    console.log('Saving reading session:', { userId, sessionData });
    
    // Ensure required fields
    const session = {
      user_id: userId,
      ...sessionData,
      start_time: sessionData.start_time || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reading_sessions')
      .insert([session])
      .select(`
        *,
        stories:story_id (
          title
        )
      `)
      .single();

    if (error) {
      console.error('Database error saving session:', error);
      throw error;
    }

    console.log('Successfully saved reading session:', data);

    // Update the streak
    await updateUserStreak(userId);

    return data;
  } catch (error) {
    console.error('Error saving reading session:', error);
    throw error;
  }
}
