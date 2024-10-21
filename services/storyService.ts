import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Story {
  id: string;
  title: string;
  content: string;
  "word-count": number;
  "difficulty-level": string;
  cover_image_url: string; // Make sure this matches exactly with your Supabase column name
}

export async function getStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, content, "word-count", "difficulty-level", cover_image_url')
    .order('title');

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
  return data || [];
}
