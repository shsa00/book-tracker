"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Book, BookStatus } from "@/types/book";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    
    // 1. Fetch from Google Books (Internet)
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=6`);
    const webData = await res.json();
    const internetBooks = webData.items || [];

    // 2. Fetch from your Supabase Monitoring list
    const { data: dbBooks } = await supabase.from("books").select("*");

    // 3. Merge logic
    const merged = internetBooks.map((item: any) => {
      const info = item.volumeInfo;
      const googleId = item.id;
      const existing = dbBooks?.find(db => db.source_url === googleId);

      return {
        googleId,
        title: info.title,
        author: info.authors?.[0] || "Unknown",
        cover: info.imageLinks?.thumbnail,
        status: existing ? existing.status : 'discovery',
        isMonitored: !!existing,
        hasAudio: info.description?.toLowerCase().includes("аудио") || false
      };
    });

    setResults(merged);
    setLoading(false);
  };

  const addToMonitor = async (book: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please log in first");

    const { error } = await supabase.from("books").insert([{
      user_id: user.id,
      title: book.title,
      author: book.author,
      source_url: book.googleId,
      status: 'queue', // Default to queue when added
      has_audiobook: book.hasAudio,
      cover_url: book.cover
    }]);

    if (!error) handleSearch(new Event('submit') as any); 
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md" />
          <span className="font-bold tracking-tight text-lg">BookTrack.ru</span>
        </div>
        <nav className="space-y-1">
          {['Dashboard', 'My Library', 'Audiobooks', 'Settings'].map((item) => (
            <button key={item} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="max-w-5xl mx-auto mb-10">
          <h1 className="text-2xl font-semibold mb-2">Global Search</h1>
          <p className="text-zinc-500 text-sm">Search the internet for Russian titles to start monitoring.</p>
          
          <form onSubmit={handleSearch} className="mt-6 flex gap-3">
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter book title or author..."
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button className="bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity">
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </header>

        {/* Results Grid */}
        <section className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          {results.map((book) => (
            <div key={book.googleId} className="group relative flex gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm">
              <div className="w-24 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-400">No Cover</div>
                )}
              </div>
              
              <div className="flex flex-col flex-1 justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{book.title}</h3>
                    <StatusBadge status={book.status} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{book.author}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {book.hasAudio && (
                      <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-200/50">🎧 Audio</span>
                    )}
                  </div>
                  
                  {!book.isMonitored ? (
                    <button 
                      onClick={() => addToMonitor(book)}
                      className="text-[11px] font-bold text-blue-600 hover:underline underline-offset-4"
                    >
                      + ADD TO MONITOR
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-zinc-400">IN SYSTEM</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

// Minimalist Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    discovery: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    queue: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    done: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${styles