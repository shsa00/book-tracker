import { createBrowserClient } from '@supabase/ssr'

// 1. Create the instance once
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 2. This remains for compatibility if your other files call createClient()
export const createClient = () => supabase;

// 3. Now 'supabase' is defined and won't be red!
export const updateBookSynopsis = async (
  bookId: string, 
  synopsis: string, 
  source: string
) => {
  const { data, error } = await supabase
    .from('books')
    .update({ 
      synopsis: synopsis,
      synopsis_source: source,
      last_synced_at: new Date().toISOString() 
    })
    .eq('id', bookId);

  if (error) throw error;
  return data;
};