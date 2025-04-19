import { supabase } from './supabase';

// Helper function to count words in text
function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  // Split by whitespace and filter out empty strings
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Interface for multilingual story content
 */
export interface MultilingualStoryContent {
  title: string;        // Finnish title
  content: string;      // Finnish content
  title_en?: string;    // English title
  content_en?: string;  // English content
  "word-count"?: number; // Finnish word count (optional, will be calculated if not provided)
  "word-count-en"?: number; // English word count (optional, will be calculated if not provided)
}

/**
 * Updates a story with multilingual content
 * @param storyId The ID of the story to update
 * @param content The multilingual content to update
 * @returns True if the update was successful, false otherwise
 */
export async function updateStoryContent(
  storyId: string, 
  content: MultilingualStoryContent
): Promise<boolean> {
  try {
    // Calculate word counts if not provided
    const wordCount = content["word-count"] || countWords(content.content);
    const wordCountEn = content["word-count-en"] || countWords(content.content_en);
    
    const { error } = await supabase
      .from('stories')
      .update({
        title: content.title,
        content: content.content,
        "word-count": wordCount,
        title_en: content.title_en || null,
        content_en: content.content_en || null,
        "word-count-en": wordCountEn || null
      })
      .eq('id', storyId);

    if (error) {
      console.error('Error updating story content:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating story content:', error);
    return false;
  }
}

/**
 * Fetch story content with all available languages
 * @param storyId The ID of the story to fetch
 * @returns The multilingual story content or null if not found
 */
export async function getMultilingualStoryContent(
  storyId: string
): Promise<MultilingualStoryContent | null> {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('title, content, "word-count", title_en, content_en, "word-count-en"')
      .eq('id', storyId)
      .single();

    if (error || !data) {
      console.error('Error fetching multilingual story content:', error);
      return null;
    }

    return {
      title: data.title,
      content: data.content,
      "word-count": data["word-count"],
      title_en: data.title_en || undefined,
      content_en: data.content_en || undefined,
      "word-count-en": data["word-count-en"] || undefined
    };
  } catch (error) {
    console.error('Exception fetching multilingual story content:', error);
    return null;
  }
} 