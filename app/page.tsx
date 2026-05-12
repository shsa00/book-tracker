"use client";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase";
import ReaderModal from "@/components/ReaderModal";

export default function Dashboard() {
  const [view, setView] = useState<"search" | "local">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [localBooks, setLocalBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  
  const supabase = createClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&fields=key,title,author_name,cover_i&limit=12`);
      const olData = await olRes.json();
      
      const mappedResults = (olData.docs || []).map((doc: any) => ({
        id: doc.key.split('/').pop(),
        title: doc.title,
        author: doc.author_name ? doc.author_name[0] : "Unknown Author",
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
        source_url: `https://openlibrary.org${doc.key}`,
        is_downloaded: false
      }));

      setResults(mappedResults);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: false });
    if (!error) setLocalBooks(data);
    setLoading(false);
  };

  useEffect(() => { if (view === "local") fetchLocalBooks(); }, [view]);

  return (
<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">      {/* STICKY TOP NAVIGATION */}
      
      {/* Sidebar */}
      {/* <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 p-8 flex flex-col fixed h-full bg-white dark:bg-[#09090b]">
        <div className="font-black text-xl italic mb-12 tracking-tighter">LIBRARIAN</div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setView("search")} className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${view==='search' ? 'bg-zinc-100 dark:bg-zinc-900 text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600'}`}>Online Archive</button>
          <button onClick={() => setView("local")} className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${view==='local' ? 'bg-zinc-100 dark:bg-zinc-900 text-blue-600 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600'}`}>Local Library</button>
        </nav>
        <ThemeToggle />
      </aside> */}

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
        {/* <header className="mb-16">
          <h1 className="text-6xl font-black uppercase tracking-tighter">Inventory <span className="text-zinc-200 dark:text-zinc-800">/</span> {view}</h1>
        </header> */}

        {view === "search" && (
          <form onSubmit={handleSearch} className="flex gap-4 mb-16">
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search by title or author..." 
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-8 py-5 text-sm outline-none focus:ring-4 ring-blue-500/5 transition-all shadow-sm" 
            />
            <button className="bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white px-12 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
              {loading ? "Searching..." : "Execute Query"}
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(view === "search" ? results : localBooks).map((book) => (
            <button 
              key={book.id} 
              onClick={() => setSelectedBook(book)}
              className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl flex items-center gap-6 text-left hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all"
            >
              <div className="relative w-16 h-24 flex-shrink-0">
                <img src={book.cover || "/api/placeholder/150/200"} className="w-full h-full object-cover rounded-xl shadow-md grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate mb-1">{book.title}</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-blue-500 transition-colors">{book.author}</p>
                <div className="mt-3">
                   <span className={`text-[7px] font-black px-2 py-1 rounded-md uppercase border ${book.is_downloaded ? 'bg-green-500/5 border-green-500/20 text-green-600' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-400'}`}>
                     {book.is_downloaded ? "Verified Local" : "External Repository"}
                   </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>

      {selectedBook && (
        <ReaderModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}