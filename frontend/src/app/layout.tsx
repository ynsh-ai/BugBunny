import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BugBunny — Autonomous Multi-Agent Software Engineering Assistant",
  description:
    "From GitHub issue to implementation-ready change. An autonomous multi-agent pipeline for requirements analysis, codebase investigation, automated patching, testing, and PR generation.",
  icons: {
    icon: "/bugbunny-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#0d1117] text-[#c9d1d9] antialiased font-sans selection:bg-[#264f78] selection:text-white flex flex-col md:flex-row`}
      >
        <Suspense
          fallback={
            <div className="hidden md:block w-64 border-r border-[#30363d] bg-[#0d1117]" />
          }
        >
          <Sidebar />
        </Suspense>
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <div className="flex-1">{children}</div>

          <footer className="border-t border-[#30363d] bg-[#0d1117] py-4 text-center text-xs text-[#8b949e]">
            <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#f0f6fc]">BugBunny</span>
                <span>&bull;</span>
                <span>BugBunny proposes changes; the developer stays in control.</span>
              </div>
              <div className="flex items-center gap-4 text-[#8b949e]">
                <span>FastAPI</span>
                <span>PostgreSQL</span>
                <span>OpenAI Agents SDK</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
