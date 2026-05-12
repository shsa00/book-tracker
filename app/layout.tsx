import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // Import is correct
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookTrack.ru",
  description: "Modern Russian Book Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Changed min-h-full to min-h-screen for better sticky behavior */}
      <body className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Providers>
          {/* Header/Navigation is now a separate component */}
          <Navbar />
          
          {/* Main content area */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}