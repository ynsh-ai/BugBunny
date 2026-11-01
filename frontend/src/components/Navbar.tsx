"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PublicNavbar } from "./PublicNavbar";
import { DashboardNavbar } from "./DashboardNavbar";

export function Navbar() {
  const pathname = usePathname();

  // Hide navbars on standalone auth & onboarding screens
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/onboarding")
  ) {
    return null;
  }

  // Dashboard & internal workspace routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/issues") ||
    pathname.startsWith("/investigations") ||
    pathname.startsWith("/settings")
  ) {
    return <DashboardNavbar />;
  }

  // Public marketing landing page
  return <PublicNavbar />;
}
