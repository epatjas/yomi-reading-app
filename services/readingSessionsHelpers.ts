import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ReadingSession {
  id?: string;
  user_id: string;
  story_id: string;
  story_title?: string;
  audio_url: string;
  start_time: string;
  duration?: number;
  end_time?: string;
  energy_gained?: number;
  reading_points?: number;
  progress?: number;
  completed?: boolean;
}

export const saveReadingSessionToDatabase = async (
  userId: string,
  storyId: string,
  audioUrl: string,
  startTime: string,
  duration?: number,
  endTime?: string,
  energyGained?: number,
  readingPoints?: number,
  progress?: number,
  completed?: boolean
) => {
  try {
    const session: ReadingSession = {
      user_id: userId,
      story_id: storyId,
      audio_url: audioUrl,
      start_time: startTime,
      duration,
      end_time: endTime,
      energy_gained: energyGained,
      reading_points: readingPoints,
      progress,
      completed
    };

    const { data, error } = await supabase
      .from('reading_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving reading session:', error);
    throw error;
  }
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
