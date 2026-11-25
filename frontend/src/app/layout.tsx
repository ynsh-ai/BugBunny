import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";

import { AppFooter } from "@/components/AppFooter";

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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F0] text-[#171916] antialiased font-sans flex flex-col selection:bg-[#C6F36B] selection:text-[#171916]">
          {/* Navbar rendered by group layouts */}
        <div className="flex-1 w-full min-w-0">{children}</div>
        <Suspense fallback={null}>
          <AppFooter />
        </Suspense>
      </body>
    </html>
  );
}
