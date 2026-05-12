import { supabase } from './supabase';

export async function getOrUpdateSynopsis(
  externalId: string, 
  title: string, 
  author: string, 
  currentSynopsis?: string
) {
  try {
    // 1. CHECK DB ONLY
    const { data: existingBook } = await supabase
      .from('books')
      .select('synopsis, synopsis_source')
      .eq('external_id', externalId)
      .maybeSingle();

    if (existingBook?.synopsis) {
      return { 
        synopsis: existingBook.synopsis, 
        source: existingBook.synopsis_source || "database" 
      };
    }

    // 2. FETCH SYNOPSIS (Google Books)
    const query = encodeURIComponent(`intitle:${title}+inauthor:${author}`);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
    const data = await res.json();
    let synopsis = data.items?.[0]?.volumeInfo?.description || "";
    let source = "google_books";

    // 3. FALLBACK (Gemini AI)
    if (!synopsis || synopsis.length < 50) {
      const aiRes = await fetch('/api/ai/synopsis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author }),
      });
      const aiData = await aiRes.json();
      // Use the synopsis field from your AI response
      synopsis = aiData.summary || aiData.synopsis || "";
      source = "ai";
    }

    return { synopsis, source };
  } catch (error) {
    console.error("Manager Error:", error);
    return { 
      synopsis: currentSynopsis || "Description temporarily unavailable.", 
      source: "error" 
    };
  }
}