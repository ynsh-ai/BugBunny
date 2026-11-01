"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { BugBunnyLogo } from "./BugBunnyLogo";
import { getStoredUser, StoredUser } from "@/lib/auth";

export function PublicNavbar() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const checkUser = () => {
      setUser(getStoredUser());
    };
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => {
      window.removeEventListener("storage", checkUser);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#DADDD3] bg-[#F5F5F0]/95 backdrop-blur-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-[#171916] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171916] rounded-xs"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xs border border-[#DADDD3] bg-[#E8EAE3] shadow-2xs">
              <BugBunnyLogo size={20} />
            </div>
            <span className="font-bold text-base tracking-tight text-[#171916]">
              BugBunny
            </span>
          </Link>

          {/* Marketing Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-[#777D71]">
            <a
              href="#product"
              className="hover:text-[#171916] transition-colors"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[#171916] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="hover:text-[#171916] transition-colors"
            >
              Features
            </a>
            <a
              href="#security"
              className="hover:text-[#171916] transition-colors"
            >
              Security
            </a>
            <a
              href="#docs"
              className="hover:text-[#171916] transition-colors"
            >
              Docs
            </a>
          </nav>
        </div>

        {/* Right Action Stack */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xs bg-[#171916] px-3.5 py-1.5 text-xs font-mono font-medium text-[#F5F5F0] hover:bg-[#292D27] shadow-2xs transition-colors"
            >
              <User className="h-3.5 w-3.5 text-[#C6F36B]" />
              <span className="truncate max-w-[120px]">{user.name}</span>
              <span className="text-[#9BA095]">/</span>
              <span className="text-[#C6F36B] font-bold">Dashboard</span>
              <ArrowRight className="h-3 w-3 text-[#C6F36B]" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-xs font-mono text-[#171916] hover:text-[#575E54] px-2.5 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-3.5 py-1.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] shadow-2xs transition-colors"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
