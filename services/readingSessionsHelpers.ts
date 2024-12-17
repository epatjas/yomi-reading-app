import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ReadingSession {
  id?: string;
  user_id: string;
  story_id: string;
  story_title?: string;
  start_time: string;
  end_time: string;
  duration: number;
  energy_gained: number;
  reading_points: number;
  audio_url: string;
  progress: number;
  completed: boolean;
}

export const saveReadingSessionToDatabase = async (readingSession: Omit<ReadingSession, 'id'>): Promise<ReadingSession> => {
  const { data, error } = await supabase
    .from('reading_sessions')
    .insert(readingSession)
    .select()
    .single();

  if (error) {
    console.error('Error saving reading session:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No data returned from insert operation');
  }

  return data;
};

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

const renderReadingHistoryItem = ({ item }: { item: ReadingSession }) => {
  console.log('Audio URL for item:', item.audio_url);
  // ... rest of the function
};
