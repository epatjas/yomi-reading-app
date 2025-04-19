import { supabase } from './supabase';
import i18n from '../translation';

export interface Story {
  id: string;
  title: string;
  content: string;
  "word-count": number;
  difficulty: string;
  cover_image_url: string;
}

// Database record type
interface StoryRecord {
  id: string;
  title: string;
  title_en?: string | null;
  content: string;
  content_en?: string | null;
  "word-count": number;
  "word-count-en"?: number | null;
  "difficulty-level": string;
  cover_image_url: string;
}

/**
 * Fetches all stories from the database in the current app language
 */
export async function getStories(): Promise<Story[]> {
  const currentLanguage = i18n.language;
  
  // We need to select all possible columns to handle content in different languages
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, title_en, content, content_en, "word-count", "word-count-en", "difficulty-level", cover_image_url')
    .order('title');

  if (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
  
  if (!data) return [];
  
  // Map the data to ensure consistency with the Story interface
  const mappedData = data.map((story: StoryRecord) => ({
    id: story.id,
    // Use English title if language is English and title_en exists, otherwise use Finnish title
    title: currentLanguage === 'en' && story.title_en ? story.title_en : story.title,
    // Use English content if language is English and content_en exists, otherwise use Finnish content
    content: currentLanguage === 'en' && story.content_en ? story.content_en : story.content,
    // Use English word count if language is English and word-count-en exists, otherwise use Finnish word count
    "word-count": currentLanguage === 'en' && story["word-count-en"] ? story["word-count-en"] : story["word-count"],
    difficulty: story["difficulty-level"],
    cover_image_url: story.cover_image_url
  }));

  return mappedData;
}

/**
 * Fetches a single story by ID in the current app language
 */
export async function getStoryById(storyId: string): Promise<Story | null> {
  const currentLanguage = i18n.language;
  
  const { data, error } = await supabase
    .from('stories')
    .select('id, title, title_en, content, content_en, "word-count", "word-count-en", "difficulty-level", cover_image_url')
    .eq('id', storyId)
    .single();

  if (error || !data) {
    console.error('Error fetching story by ID:', error);
    return null;
  }
  
  const story = data as StoryRecord;
  
  return {
    id: story.id,
    title: currentLanguage === 'en' && story.title_en ? story.title_en : story.title,
    content: currentLanguage === 'en' && story.content_en ? story.content_en : story.content,
    "word-count": currentLanguage === 'en' && story["word-count-en"] ? story["word-count-en"] : story["word-count"],
    difficulty: story["difficulty-level"],
    cover_image_url: story.cover_image_url
  };
}
