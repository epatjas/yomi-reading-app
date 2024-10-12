import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserReadingHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('reading_history')
      .select(`
        id,
        progress,
        completed,
        created_at,
        updated_at,
        stories:story_id (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user reading history:', error);
    throw error;
  }
}
