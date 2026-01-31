'use client';

import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

// Pages that don't need the navbar
const noNavbarPages = ['/login', '/signup'];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showNavbar = !noNavbarPages.includes(pathname);

  return (
    <html lang="en" className="dark">
      <head>
        <title>StonksBro Pro - Institutional Trading Terminal</title>
        <meta name="description" content="Professional-grade fintech platform with advanced analytics, technical indicators, and portfolio management" />
      </head>
      <body className={`${jetbrainsMono.variable} ${inter.variable} font-sans antialiased bg-[#0a0a0a] text-white min-h-screen`}>
        <AuthProvider>
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#141414',
                color: '#fff',
                border: '1px solid #2a2a2a',
                fontFamily: 'var(--font-mono)',
              },
              className: 'font-mono',
            }}
            theme="dark"
          />

          {showNavbar && <Navbar />}
          <main className={showNavbar ? "ml-56 min-h-screen" : "min-h-screen"}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
