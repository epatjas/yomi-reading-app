import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ReadingSession {
  id: number;
  user_id: string;
  story_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  energy_gained: number;
  progress: number;
  completed: boolean;
  stories: {
    id: string;
    title: string;
  };
}

export async function saveReadingSessionToDatabase(session: ReadingSession): Promise<void> {
  try {
    const { error } = await supabase
      .from('reading_sessions')
      .insert(session);

    if (error) throw error;
    console.log('Reading session saved successfully');
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
