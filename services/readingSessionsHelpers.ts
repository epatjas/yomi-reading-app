import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ReadingSession = {
  id?: string; // Make this optional
  user_id: string;
  story_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  energy_gained: number;
  reading_points: number;
  audio_url: string;
  progress: number;
  completed: boolean;
};

export async function saveReadingSessionToDatabase(session: Omit<ReadingSession, 'id'>) {
  console.log('Saving session to database:', JSON.stringify(session, null, 2));
  try {
    const { data, error } = await supabase
      .from('reading_sessions')
      .insert(session)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    console.log('Session saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving reading session:', error);
    throw error;
  }
}

export function calculateWordsPerMinute(
  wordCount: number, 
  startTime: Date, 
  endTime: Date
): number {
  const durationInMinutes = (endTime.getTime() - startTime.getTime()) / 60000; // Convert milliseconds to minutes
  const wordsPerMinute = wordCount / durationInMinutes;
  return Math.round(wordsPerMinute); // Round to nearest whole number
}

export function calculateComprehension(
  correctWords: number,
  totalWords: number
): number {
  const comprehensionScore = (correctWords / totalWords) * 100;
  return Math.round(comprehensionScore); // Round to nearest whole number
}
