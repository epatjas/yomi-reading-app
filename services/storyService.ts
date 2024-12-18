import { supabase } from './supabase';

export interface Story {
  id: string;
  title: string;
  content: string;
  "word-count": number;
  difficulty: string; // This should be renamed to 'difficulty'
  cover_image_url: string;
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
  
  // Map the data to ensure consistency with the Story interface
  const mappedData = data?.map(story => ({
    ...story,
    difficulty: story["difficulty-level"] // Map 'difficulty-level' to 'difficulty'
  })) || [];

  return mappedData;
}
