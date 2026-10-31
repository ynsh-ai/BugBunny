"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  GitPullRequest,
  FolderGit2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { importGitHubIssue, importGitHubRepo } from "@/lib/api";
import { IssueDetail, RepositoryItem } from "@/mock/types";

interface ImportGitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "issue" | "repo";
  onIssueImported?: (issue: IssueDetail) => void;
  onRepoImported?: (repo: RepositoryItem) => void;
}

type RequestState = "idle" | "validating" | "importing" | "success" | "error";

export function ImportGitHubModal({
  isOpen,
  onClose,
  initialTab = "issue",
  onIssueImported,
  onRepoImported,
}: ImportGitHubModalProps) {
  const router = useRouter();
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [activeTab, setActiveTab] = useState<"issue" | "repo">(initialTab);
  const [url, setUrl] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedIssue, setImportedIssue] = useState<IssueDetail | null>(null);
  const [importedRepo, setImportedRepo] = useState<RepositoryItem | null>(null);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

  if (!isOpen) return null;

  const handleReset = () => {
    setUrl("");
    setRequestState("idle");
    setErrorMsg(null);
    setImportedIssue(null);
    setImportedRepo(null);
  };

  const validateUrl = (rawUrl: string, type: "issue" | "repo"): string | null => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return "URL cannot be empty.";
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return "Please enter a valid URL (e.g. https://github.com/owner/repository).";
    }

    if (parsed.hostname !== "github.com") {
      return "Only public github.com URLs are supported.";
    }

    const segments = parsed.pathname.split("/").filter(Boolean);

    if (type === "issue") {
      // Must be /owner/repo/issues/123
      if (segments.length < 4 || segments[2] !== "issues" || !/^\d+$/.test(segments[3])) {
        return "Issue URL must match: https://github.com/owner/repository/issues/123";
      }
    } else {
      // Must be /owner/repo
      if (segments.length < 2) {
        return "Repository URL must match: https://github.com/owner/repository";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validating
    setRequestState("validating");
    const validationError = validateUrl(url, activeTab);
    if (validationError) {
      setRequestState("error");
      setErrorMsg(validationError);
      return;
    }

    // 2. Importing
    setRequestState("importing");
    try {
      if (activeTab === "issue") {
        const issue = await importGitHubIssue(url.trim());
        setImportedIssue(issue);
        setRequestState("success");
        if (onIssueImported) {
          onIssueImported(issue);
        }
      } else {
        const repo = await importGitHubRepo(url.trim());
        setImportedRepo(repo);
        setRequestState("success");
        if (onRepoImported) {
          onRepoImported(repo);
        }
      }
    } catch (err: unknown) {
      setRequestState("error");
      const msg =
        err instanceof Error ? err.message : "Failed to import from GitHub.";
      setErrorMsg(msg);
    }
  };

  const handleOpenIssue = () => {
    if (importedIssue) {
      onClose();
      router.push(`/issues/${encodeURIComponent(importedIssue.id)}`);
    }
  };

  const handleOpenRepoIssues = () => {
    if (importedRepo) {
      onClose();
      router.push(`/issues?repo=${encodeURIComponent(importedRepo.name)}`);
    }
  };

  const isPending = requestState === "validating" || requestState === "importing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm text-[#c9d1d9]">
      <div className="relative w-full max-w-lg rounded-lg border border-[#22252e] bg-[#13151a] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#22252e] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#22252e] bg-[#0d0e12] text-[#f0f2f5]">
              {activeTab === "issue" ? (
                <GitPullRequest className="h-4 w-4" />
              ) : (
                <FolderGit2 className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f0f2f5]">
                {activeTab === "issue" ? "Import GitHub Issue" : "Import Repository"}
              </h2>
              <p className="text-[11px] text-[#9aa1b0]">
                Connected Read-Only Inspection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#9aa1b0] hover:bg-[#181b21] hover:text-[#f0f2f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#22252e]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("issue");
              handleReset();
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "issue"
                ? "border-[#58a6ff] text-[#f0f2f5] font-semibold"
                : "border-transparent text-[#9aa1b0] hover:text-[#f0f2f5]"
            }`}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            <span>GitHub Issue</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("repo");
              handleReset();
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "repo"
                ? "border-[#58a6ff] text-[#f0f2f5] font-semibold"
                : "border-transparent text-[#9aa1b0] hover:text-[#f0f2f5]"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>GitHub Repository</span>
          </button>
        </div>

        {/* Success State */}
        {requestState === "success" && (
          <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {activeTab === "issue"
                  ? "Issue successfully imported"
                  : "Repository successfully indexed"}
              </span>
            </div>

            {importedIssue && (
              <div className="rounded bg-[#0d0e12] border border-[#22252e] p-3 text-xs space-y-1">
                <div className="font-semibold text-[#f0f2f5]">{importedIssue.title}</div>
                <div className="font-mono text-[11px] text-[#9aa1b0]">
                  Repository: {importedIssue.repository} &bull; ID: {importedIssue.id}
                </div>
              </div>
            )}

            {importedRepo && (
              <div className="rounded bg-[#0d0e12] border border-[#22252e] p-3 text-xs space-y-1">
                <div className="font-semibold text-[#f0f2f5]">
                  {importedRepo.owner}/{importedRepo.name}
                </div>
                <div className="font-mono text-[11px] text-[#9aa1b0]">
                  Default branch: {importedRepo.defaultBranch} &bull; Files indexed: {importedRepo.fileCount ?? 0}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#22252e] bg-[#181b21] px-3 py-1.5 text-xs text-[#c9d1d9] hover:bg-[#22252e]"
              >
                Close
              </button>
              {activeTab === "issue" && (
                <button
                  type="button"
                  onClick={handleOpenIssue}
                  className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043]"
                >
                  <span>Open issue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              {activeTab === "repo" && (
                <button
                  type="button"
                  onClick={handleOpenRepoIssues}
                  className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043]"
                >
                  <span>View repository issues</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form State (Idle, Validating, Importing, Error) */}
        {requestState !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#f0f2f5] mb-1.5">
                {activeTab === "issue"
                  ? "Public GitHub Issue URL"
                  : "Public GitHub Repository URL"}
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  activeTab === "issue"
                    ? "https://github.com/owner/repository/issues/123"
                    : "https://github.com/owner/repository"
                }
                className="w-full rounded-md border border-[#22252e] bg-[#0d0e12] px-3 py-2 text-xs font-mono text-[#f0f2f5] placeholder-[#626875] focus:border-[#58a6ff] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[#626875]">
                Only public repositories are supported. Private repositories are not supported yet.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-md border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="font-mono text-[11px]">{errorMsg}</span>
              </div>
            )}

            {/* Safety Note */}
            <div className="flex items-center gap-2 rounded-md border border-[#22252e] bg-[#0d0e12] p-2.5 text-[11px] text-[#9aa1b0]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>BugBunny proposes changes. Your repository stays under your control.</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#22252e]">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-md border border-[#22252e] bg-[#181b21] px-3.5 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#22252e] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !url.trim()}
                className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors disabled:opacity-50"
              >
                {isPending && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {requestState === "validating"
                    ? "Validating URL..."
                    : requestState === "importing"
                    ? "Importing..."
                    : activeTab === "issue"
                    ? "Import issue"
                    : "Import repository"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
