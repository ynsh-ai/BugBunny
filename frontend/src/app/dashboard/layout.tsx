import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { AppFooter } from "@/components/AppFooter";

export const metadata: Metadata = {
  title: "BugBunny Dashboard",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F5F5F0] text-[#171916] antialiased font-sans flex flex-col selection:bg-[#C6F36B] selection:text-[#171916]">
        {/* Dashboard navigation */}
        <Suspense fallback={null}>
          <DashboardNavbar />
        </Suspense>
        <div className="flex-1 w-full min-w-0 p-4">{children}</div>
        <Suspense fallback={null}>
          <AppFooter />
        </Suspense>
      </body>
    </html>
  );
}
