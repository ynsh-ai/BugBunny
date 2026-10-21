import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  description: "From GitHub issue to implementation-ready change. An autonomous multi-agent pipeline for requirements analysis, codebase investigation, automated patching, testing, and PR generation.",
  keywords: ["AI agent", "software engineering", "FastAPI", "Next.js", "OpenAI Agents SDK", "Gemini", "automated code patching"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500/30 selection:text-indigo-200`}
      >
        {children}
      </body>
    </html>
  );
}
