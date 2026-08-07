import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { NotebookBackground } from "@/components/backgrounds/NotebookBackground";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Talli",
    template: "%s | Talli",
  },
  description: "Smart classroom behavioral tracking.",
  icons: {
    icon: "/logo-transparent.png",
    shortcut: "/logo-transparent.png",
    apple: "/logo-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <head>
        <link rel="icon" href="/logo-transparent.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo-transparent.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-transparent.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#faf9f6] text-black relative min-h-screen overflow-x-hidden`}
      >
        <AppProvider>
          {/* Universal Interactive Animated Notebook Background */}
          <NotebookBackground speed={1} density={1} scribbliness={1} interactive={true} />
          
          {/* Page Content Layer */}
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
