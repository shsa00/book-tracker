"use client";
import { useState, useEffect, useMemo } from "react";
import { getOrUpdateSynopsis } from "@/lib/synopsisManager";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

export default function ReaderModal({ book, onClose }: { book: any; onClose: () => void }) {
  const [synopsisPage, setSynopsisPage] = useState(0);
  const [synopsis, setSynopsis] = useState<string>(book?.synopsis || "");
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [sourceLink, setSourceLink] = useState<string | null>(book?.source_url || null);

  // Split synopsis into chunks to avoid scrolling
  const synopsisPages = useMemo(() => {
    if (!synopsis) return ["No content available."];
    
    // Split by headers if present, otherwise by character count
    if (synopsis.includes("<h3>") || synopsis.includes("<h2>")) {
      return synopsis
        .split(/(?=<h3>|<h2>)/g)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return synopsis.match(/.{1,900}(\s|$)/g) || [synopsis];
  }, [synopsis]);

  useEffect(() => {
    async function fetchGlobalResources() {
      if (!book) return;
      setLoading(true);
      try {
        // 1. Get Synopsis
        const freshSynopsis = await getOrUpdateSynopsis(book.id, book.title, book.author, book.synopsis);
        setSynopsis(freshSynopsis);

        // 2. Search for Source Link (if missing)
        const gutenRes = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(book.title)}`);
        const gutenData = await gutenRes.json();
        if (gutenData.results?.length > 0 && !sourceLink) {
          setSourceLink(`https://gutenberg.org/ebooks/${gutenData.results[0].id}`);
        }

        // 3. Audio Archive
        const audioRes = await fetch(`https://archive.org/advancedsearch.php?q=title:(${book.title}) AND collection:(librivoxaudio)&output=json`);
        const audioData = await audioRes.json();
        if (audioData.response.docs.length > 0) {
          const id = audioData.response.docs[0].identifier;
          setAudioUrl(`https://archive.org/download/${id}/${id}_64kb.mp3`);
        }
      } catch (err) {
        console.error("Resource fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGlobalResources();
  }, [book?.id]);

  if (!book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-5xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* Header - Simple Title & Close */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Archival Synopsis</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Main Display Area */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Synchronizing Archive</p>
            </div>
          ) : (
            <>
              {/* Left Column: Fixed Book Cover */}
              <div className="w-1/3 bg-zinc-50/50 dark:bg-zinc-900/20 p-12 flex flex-col items-center border-r border-zinc-100 dark:border-zinc-900">
                <div className="relative w-full aspect-[2/3] max-w-[240px] shadow-2xl rounded-xl overflow-hidden mb-8">
                  <img src={book.cover || "/api/placeholder/300/450"} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-tight dark:text-zinc-100">{book.title}</h2>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-3">{book.author}</p>
                </div>
              </div>

              {/* Right Column: Paginated Synopsis */}
              <div className="w-2/3 p-14 flex flex-col relative bg-white dark:bg-zinc-950">
                <div className="flex-1 overflow-y-auto">
                  <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <style jsx global>{`
                      .synopsis-text h3 { font-size: 0.75rem; letter-spacing: 0.3em; text-transform: uppercase; color: #3b82f6; margin-bottom: 1rem; font-weight: 900; }
                      .synopsis-text p { font-size: 1rem; line-height: 1.8; color: #52525b; }
                    `}</style>
                    <div className="synopsis-text" dangerouslySetInnerHTML={{ __html: synopsisPages[synopsisPage] }} />
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="mt-10 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-8">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                    Segment {synopsisPage + 1} <span className="mx-1 text-zinc-100">/</span> {synopsisPages.length}
                  </span>
                  
                  <div className="flex gap-3">
                    <button 
                      disabled={synopsisPage === 0}
                      onClick={() => setSynopsisPage(p => p - 1)}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-20 transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button 
                      disabled={synopsisPage === synopsisPages.length - 1}
                      onClick={() => setSynopsisPage(p => p + 1)}
                      className="p-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-105 disabled:opacity-20 transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer: Audio & Source */}
        <div className="p-8 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-5">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${audioUrl ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`}></span>
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Audio Stream</p>
              </div>
              {sourceLink && (
                <a href={sourceLink} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 flex items-center gap-2">
                  <ExternalLink size={10} />
                  <span>External Archive</span>
                </a>
              )}
            </div>
            {audioUrl && (
              <audio controls className="w-full h-8 accent-blue-600 opacity-90" src={audioUrl} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}