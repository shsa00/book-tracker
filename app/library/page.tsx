"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ReaderModal from "@/components/ReaderModal";

export default function LocalLibrary() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  useEffect(() => {
    async function fetchLibrary() {
      setLoading(true);
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setBooks(data);
      setLoading(false);
    }
    fetchLibrary();
  }, []);

  return (
    <div className="p-8 lg:p-12 max-w-[1600px] mx-auto w-full">
      <div className="mb-16">
        <h2 className="text-6xl font-black uppercase tracking-tighter dark:text-white">
          Inventory <span className="text-zinc-300 dark:text-zinc-700 mx-4">/</span> Library
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mt-4">
          {books.length} VOLUMES REGISTERED
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 animate-pulse uppercase text-[10px] font-black tracking-widest">
          Scanning Archives...
        </div>
      ) : (
        /* The Grid: Using smaller columns for a 'shelf' look */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-y-12 gap-x-8">
          {books.map((book) => (
            <div 
              key={book.id} 
              className="group perspective-1000 h-[280px] w-full cursor-pointer"
              onClick={() => setSelectedBook(book)}
            >
              {/* The Flip Container */}
              <div className="relative w-full h-full transition-transform duration-500 preserve-3d group-hover:rotate-y-180">
                
                {/* FRONT: The Cover alone */}
                <div className="absolute inset-0 backface-hidden shadow-md rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                  <img 
                    src={book.cover_url} 
                    className="w-full h-full object-cover" 
                    alt="" 
                  />
                  {/* Subtle paper gloss effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-50" />
                </div>

                {/* BACK: Title and Author (The 'Back Cover') */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-6 flex flex-col justify-between border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl">
                  <div className="space-y-4">
                    <div className="h-1 w-8 bg-blue-500 rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-tighter leading-tight dark:text-white">
                      {book.title}
                    </h3>
                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                      {book.author}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400">
                      View Synopsis →
                    </span>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBook && (
        <ReaderModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      {/* Global CSS for the 3D Effect */}
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}