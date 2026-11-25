import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicNavbar } from "@/components/PublicNavbar";
import { AppFooter } from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "BugBunny – Public",
};

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F0] text-[#171916] antialiased font-sans flex flex-col selection:bg-[#C6F36B] selection:text-[#171916]">
        <Suspense fallback={null}>
          <PublicNavbar />
        </Suspense>
        <div className="flex-1 w-full min-w-0 p-4">{children}</div>
        <Suspense fallback={null}>
          <AppFooter />
        </Suspense>
      </body>
    </html>
  );
}
