import { supabase } from './supabase';

export async function getOrUpdateSynopsis(
  externalId: string, 
  title: string, 
  author: string, 
  currentSynopsis?: string
) {
  try {
    // 1. GET CURRENT USER
    // We need this because your DB requires user_id to save a row.
    const { data: { user } } = await supabase.auth.getUser();

    // 2. CHECK DB (Use maybeSingle to avoid PGRST116 error)
    const { data: existingBook } = await supabase
      .from('books')
      .select('synopsis')
      .eq('external_id', externalId)
      .maybeSingle(); // Returns null instead of an error if not found

    if (existingBook?.synopsis) {
      return existingBook.synopsis;
    }

    // 3. FETCH SYNOPSIS (Google Books)
    const query = encodeURIComponent(`intitle:${title}+inauthor:${author}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
    const data = await res.json();
    let synopsis = data.items?.[0]?.volumeInfo?.description || "";
    let source = 'google_books';

    // 4. FALLBACK (Gemini AI)
    if (!synopsis || synopsis.length < 50) {
      const aiRes = await fetch('/api/ai/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author }),
      });
      const aiData = await aiRes.json();
      synopsis = aiData.summary || "";
      source = 'gemini';
    }

    // 5. UPSERT (Including user_id to fix 23502 error)
    if (synopsis) {
      const { error: upsertError } = await supabase
        .from('books')
        .upsert({ 
          external_id: externalId,
          user_id: user?.id, // This provides the required identity
          title: title,
          author: author,
          synopsis: synopsis,
          synopsis_source: source,
          source_url: `https://openlibrary.org/works/${externalId}`,
          last_synced_at: new Date().toISOString() 
        }, { onConflict: 'external_id' });
        
      if (upsertError) console.error("Upsert failed:", upsertError);
    }

    return synopsis;
  } catch (error) {
    console.error("Manager Error:", error);
    return currentSynopsis || "Description temporarily unavailable.";
  }
}