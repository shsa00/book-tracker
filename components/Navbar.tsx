"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
        
        {/* LEFT: Logo & Navigation */}
        <div className="flex items-center gap-12">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">Librarian</h1>
          <nav className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
            <Link href="/" className={`text-[10px] px-6 py-2 rounded-full font-black uppercase tracking-widest transition-all ${pathname === "/" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}>
              Online Archive
            </Link>
            <Link href="/library" className={`text-[10px] px-6 py-2 rounded-full font-black uppercase tracking-widest transition-all ${pathname === "/library" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}>
              Local Library
            </Link>
          </nav>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2" />

          <div className="flex items-center gap-2 relative">
            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                className={`p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
              >
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Notifications</span>
                    <span className="text-[8px] font-bold text-blue-500 cursor-pointer">Mark all read</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-4 border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer">
                        <p className="text-[11px] font-bold dark:text-zinc-200">System Update</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Archived 5 new titles to the "Alchemist" collection.</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              >
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-300 dark:border-zinc-700">
                  <User size={16} className="text-zinc-500" />
                </div>
                <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group">
                    <Settings size={16} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white">Settings</span>
                  </button>
                  <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 my-1" />
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group">
                    <LogOut size={16} className="text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}