import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PatchPilot AI — Autonomous Multi-Agent Software Engineering Assistant",
  description:
    "From GitHub issue to implementation-ready change. An autonomous multi-agent pipeline for requirements analysis, codebase investigation, automated patching, testing, and PR generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0d0e12] text-[#f0f2f5] antialiased font-sans selection:bg-[#252833] selection:text-white flex flex-col`}
      >
        <Suspense
          fallback={
            <div className="h-13 border-b border-[#22252e] bg-[#0d0e12]" />
          }
        >
          <Navbar />
        </Suspense>
        <div className="flex-1">{children}</div>

        <footer className="border-t border-[#1d2027] bg-[#0d0e12] py-4 text-center text-xs text-[#626875]">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#9aa1b0]">
                PatchPilot AI v0.1.0-alpha
              </span>
              <span>&bull;</span>
              <span>Orchestrator: Multi-Agent Local Sandbox</span>
            </div>
            <div className="flex items-center gap-4 text-[#626875]">
              <span>FastAPI Gateway</span>
              <span>Next.js App Router</span>
              <span>Mock Data Mode</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
