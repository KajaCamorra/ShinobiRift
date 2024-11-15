import type { Metadata } from "next";
import { Syne, Goldman } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

// Load fonts
const syne = Syne({ 
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const goldman = Goldman({ 
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-goldman",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shinobi Rift",
  description: "A text-based ninja MMORPG set in a fractured reality",
  icons: {
    icon: "/favicon.ico",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${goldman.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}