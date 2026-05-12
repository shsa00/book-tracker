"use client";
import { useState, useEffect, useMemo } from "react";
import { getOrUpdateSynopsis } from "@/lib/synopsisManager";
import { ChevronLeft, ChevronRight, ExternalLink, X, Bookmark, Download } from "lucide-react";
import { createClient } from "@/lib/supabase"; // Import your supabase client

export default function ReaderModal({ book, onClose }: { book: any; onClose: () => void }) {
  const [synopsisPage, setSynopsisPage] = useState(0);
  const [synopsis, setSynopsis] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Track save state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sourceLink, setSourceLink] = useState<string | null>(book?.source_url || null);

  const supabase = createClient();

  const synopsisPages = useMemo(() => {
    if (!synopsis && !isSyncing) return ["No content available."];
    if (!synopsis) return [];
    if (synopsis.includes("<h3>") || synopsis.includes("<h2>")) {
      return synopsis.split(/(?=<h3>|<h2>)/g).map(s => s.trim()).filter(s => s.length > 0);
    }
    return synopsis.match(/.{1,900}(\s|$)/g) || [synopsis];
  }, [synopsis, isSyncing]);

  // NEW: Save Function
 // Ensure 'sourceUrl' is added here as a second parameter
const handleAddToLibrary = async (
  freshSynopsis: string, 
  sourceUrl: string, 
  olId: string, 
  synSource: string // Add this parameter
) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase
    .from("books")
    .upsert({
      external_id: olId,
      user_id: session.user.id,
      title: book.title,
      author: book.author,
      cover_url: book.cover || book.cover_url,
      synopsis: freshSynopsis,
      synopsis_source: synSource, // ✅ Saved here
      source_url: sourceUrl,
      is_downloaded: true
    }, {
      onConflict: 'external_id' 
    });
};

useEffect(() => {
  let isMounted = true;

  async function syncBookData() {
    if (!book) return;
    
    const openLibraryId = book.external_id || book.id;
    if (!openLibraryId) return;

    setIsSyncing(true);
    
    try {
      const { data: existingBook } = await supabase
        .from("books")
        .select("*")
        .eq("external_id", openLibraryId)
        .maybeSingle();

      if (existingBook) {
        if (isMounted) {
          setSynopsis(existingBook.synopsis);
          setSourceLink(existingBook.source_url);
          setIsSyncing(false);
        }
        return; 
      }

      // --- FIX HERE: Destructure the object from the manager ---
      const { synopsis: freshSynopsis, source: freshSource } = await getOrUpdateSynopsis(
        openLibraryId, 
        book.title, 
        book.author, 
        book.synopsis
      );
      
      if (isMounted) {
        // Set the state to just the STRING, not the whole object
        setSynopsis(freshSynopsis);
        
        let finalLink = book.source_url || "";
        if (!finalLink || !finalLink.includes('http')) {
          const searchQuery = `${book.title} ${book.author}`;
          const gutenRes = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(searchQuery)}`);
          const gutenData = await gutenRes.json();
          finalLink = gutenData.results?.[0] 
            ? `https://gutenberg.org/ebooks/${gutenData.results[0].id}`
            : `https://openlibrary.org/works/${openLibraryId}`;
        }
        setSourceLink(finalLink);

        // Save everything including the source
        await handleAddToLibrary(freshSynopsis, finalLink, openLibraryId, freshSource);
      }

    } catch (err) {
      console.error("Resource fetch failed", err);
    } finally {
      if (isMounted) setIsSyncing(false);
    }
  }

  syncBookData();
  return () => { isMounted = false; };
}, [book?.id, book?.external_id]);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 bg-zinc-50/50 dark:bg-zinc-900/20 border-r border-zinc-100 dark:border-zinc-900 flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-between p-6 lg:p-10 h-full">
              
              <div className="w-full flex flex-col items-center flex-shrink min-h-0">
                <div className="relative w-full aspect-[2/3] max-w-[180px] lg:max-w-[220px] shadow-2xl rounded-xl overflow-hidden flex-shrink min-h-0">
                  <img 
                    src={book.cover || book.cover_url || "/api/placeholder/300/450"} 
                    className="w-full h-full object-cover" 
                    alt={book.title} 
                  />
                  {/* Saving indicator overlay */}
                  {isSaving && (
                    <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center">
                      <Download className="text-white animate-bounce" size={24} />
                    </div>
                  )}
                </div>

                <div className="text-center w-full mt-4 lg:mt-6">
                  <h2 className="text-base lg:text-lg font-black uppercase tracking-tighter leading-tight dark:text-zinc-100 line-clamp-2">
                    {book.title}
                  </h2>
                  <p className="text-[8px] lg:text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-2">
                    {book.author}
                  </p>
                </div>
              </div>

              <div className="w-full space-y-2 mt-6 flex-shrink-0">
                <button 
                  disabled={isSaving}
                  className="w-full py-2.5 lg:py-3 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 transition-all group bg-white dark:bg-zinc-900"
                >
                  <Bookmark size={12} className={isSaving ? "animate-pulse" : ""} />
                  <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-zinc-500">
                    {isSaving ? "Archiving..." : "In Collection"}
                  </span>
                </button>
                
                {/* NEW: The modified button that now acts as a direct source link */}
                <a 
                  href={sourceLink || book.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 lg:py-3 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 ${!sourceLink && 'opacity-50 pointer-events-none'}`}
                >
                  Open Source
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>

          <div className="w-2/3 flex flex-col bg-white dark:bg-zinc-950">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-end">
               <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 p-14 pt-8 overflow-y-auto flex flex-col">
              {isSyncing ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-60">
                  <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-800 dark:border-t-zinc-200 rounded-full animate-spin"></div>
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em]">Syncing Plot & Characters...</p>
                </div>
              ) : (
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <style jsx global>{`
                      .synopsis-text h3 { font-size: 0.75rem; letter-spacing: 0.3em; text-transform: uppercase; color: #3b82f6; margin-bottom: 1.25rem; font-weight: 900; }
                      .synopsis-text p { font-size: 1.05rem; line-height: 1.85; color: #52525b; font-medium; }
                    `}</style>
                  <div className="synopsis-text" dangerouslySetInnerHTML={{ __html: synopsisPages[synopsisPage] }} />
                </div>
              )}
              
            </div>

            {!isSyncing && synopsisPages.length > 0 && (
              <div className="p-10 pt-0 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">Folio {synopsisPage + 1} of {synopsisPages.length}</span>
                </div>
                <div className="flex gap-3">
                  <button disabled={synopsisPage === 0} onClick={() => setSynopsisPage(p => p - 1)} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 disabled:opacity-10 shadow-sm"><ChevronLeft size={20} /></button>
                  <button disabled={synopsisPage === synopsisPages.length - 1} onClick={() => setSynopsisPage(p => p + 1)} className="p-4 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-10 shadow-lg"><ChevronRight size={20} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}