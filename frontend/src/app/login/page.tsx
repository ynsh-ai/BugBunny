"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { BugBunnyLogo } from "@/components/BugBunnyLogo";
import { GitHubBrandIcon, GitLabBrandIcon, GoogleBrandIcon } from "@/components/AuthIcons";
import { BugBunnyGraphicPanel } from "@/components/BugBunnyGraphicPanel";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";

  const [mode, setMode] = useState<"signup" | "login">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const userEmail = email.trim() || "developer@bugbunny.ai";
    const username = userEmail.split("@")[0];

    // Store session in localStorage for local workspace persistence
    try {
      localStorage.setItem(
        "bugbunny_user",
        JSON.stringify({
          email: userEmail,
          name: username,
          authenticatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/");
    }, 600);
  };

  const handleOAuth = (provider: "github" | "gitlab" | "google") => {
    setIsSubmitting(true);
    try {
      localStorage.setItem(
        "bugbunny_user",
        JSON.stringify({
          email: `developer@${provider}.local`,
          name: `${provider}-user`,
          provider,
          authenticatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/");
    }, 600);
  };

  const isSignUp = mode === "signup";

  return (
    <div className="min-h-screen w-full flex bg-[#171916] text-[#F5F5F0]">
      {/* Back to Workspace Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-1.5 text-xs font-mono text-[#9BA095] hover:text-[#F5F5F0] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Workspace</span>
      </Link>

      {/* Left Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-14 sm:px-12 relative z-10">
        <div className="w-full max-w-[360px] space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <div className="flex h-12 w-12 items-center justify-center rounded-xs bg-[#292D27] border border-[#3A4037] shadow-sm">
                <BugBunnyLogo size={30} />
              </div>
            </Link>
          </div>

          {/* Title & Mode Switcher */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F0]">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h1>
            <p className="text-xs text-[#9BA095]">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-[#6388D9] hover:underline font-medium cursor-pointer"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-[#C6F36B] hover:underline font-medium cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#9BA095] mb-1.5 font-mono">
                Enter work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="me@example.com"
                className="w-full rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2.5 text-xs text-[#F5F5F0] placeholder-[#575E54] focus:border-[#C6F36B] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-[#9BA095] mb-1.5 font-mono">
                Enter password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full rounded-xs border border-[#3A4037] bg-[#141613] px-3.5 py-2.5 text-xs text-[#F5F5F0] placeholder-[#575E54] focus:border-[#C6F36B] focus:outline-none transition-colors"
              />
            </div>

            {/* Primary Action Button (Signature BugBunny Lime) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xs bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] text-xs font-bold py-2.5 px-4 border border-[#AEE64E] shadow-2xs transition-all active:translate-y-px disabled:opacity-50 cursor-pointer"
            >
              <span>{isSignUp ? "Start for Free" : "Sign in to BugBunny"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* OAuth Buttons Stack */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 rounded-xs border border-[#3A4037] bg-[#222520] hover:bg-[#2A2E27] text-xs font-medium text-[#F5F5F0] py-2 px-4 transition-colors cursor-pointer"
            >
              <GitHubBrandIcon className="h-4 w-4 text-[#F5F5F0]" />
              <span>{isSignUp ? "Sign up with GitHub" : "Sign in with GitHub"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("gitlab")}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 rounded-xs border border-[#3A4037] bg-[#222520] hover:bg-[#2A2E27] text-xs font-medium text-[#F5F5F0] py-2 px-4 transition-colors cursor-pointer"
            >
              <GitLabBrandIcon className="h-4 w-4" />
              <span>{isSignUp ? "Sign up with GitLab" : "Sign in with GitLab"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2.5 rounded-xs border border-[#3A4037] bg-[#222520] hover:bg-[#2A2E27] text-xs font-medium text-[#F5F5F0] py-2 px-4 transition-colors cursor-pointer"
            >
              <GoogleBrandIcon className="h-4 w-4" />
              <span>{isSignUp ? "Sign up with Google" : "Sign in with Google"}</span>
            </button>
          </div>

          {/* Terms & Privacy Disclaimer */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-[#777D71] leading-relaxed">
              By signing up, you agree to the{" "}
              <Link href="/settings" className="underline hover:text-[#9BA095]">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/settings" className="underline hover:text-[#9BA095]">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Right Graphic Panel (Visible on Desktop) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <BugBunnyGraphicPanel />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#171916] text-[#F5F5F0]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3A4037] border-t-[#C6F36B]" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
