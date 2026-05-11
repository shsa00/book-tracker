export type BookStatus = 'discovery' | 'queue' | 'in_progress' | 'done';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url?: string;
  has_audiobook: boolean;
  status: BookStatus;
  created_at: string;
  content?: string; // Holds the Russian text
  audio_url?: string;
  
  // --- New Fields for the Synopsis Logic ---
  synopsis?: string;         // The HTML/Text description
  synopsis_source?: string;  // e.g., 'gemini', 'google_books', 'manual'
  last_synced_at?: string;   // Timestamp to check for updates
}