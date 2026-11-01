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
  title: "BugBunny — Autonomous Multi-Agent AI Engineering Platform",
  description:
    "From public GitHub issue to verified patch. An autonomous multi-agent engineering team that reads code, diagnoses root causes, generates git diffs, and verifies tests with human approval.",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#F5F5F0] text-[#171916] antialiased font-sans flex flex-col selection:bg-[#C6F36B] selection:text-[#171916]`}
      >
        <Suspense
          fallback={
            <div className="h-14 border-b border-[#DADDD3] bg-[#F5F5F0]" />
          }
        >
          <Navbar />
        </Suspense>

        <div className="flex-1 w-full min-w-0">{children}</div>

        <footer className="border-t border-[#DADDD3] bg-[#E8EAE3] py-6 text-xs text-[#777D71]">
          <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 font-mono text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#171916]">BugBunny</span>
              <span>/</span>
              <span>AI Engineering Team</span>
              <span>/</span>
              <span className="text-[#171916] font-medium bg-[#C6F36B]/60 px-2 py-0.5 rounded-xs border border-[#AEE64E]">
                BugBunny proposes changes. Your repository stays under your control.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#777D71]">
              <span className="hover:text-[#171916] transition-colors">FastAPI Core</span>
              <span>•</span>
              <span className="hover:text-[#171916] transition-colors">PostgreSQL</span>
              <span>•</span>
              <span className="hover:text-[#171916] transition-colors">Gemini 1.5</span>
              <span>•</span>
              <span className="hover:text-[#171916] transition-colors">Read-Only Sandbox</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
