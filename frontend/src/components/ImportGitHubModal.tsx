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
  onSuccess?: () => void;
}

type RequestState = "idle" | "validating" | "importing" | "success" | "error";

export function ImportGitHubModal({
  isOpen,
  onClose,
  initialTab = "issue",
  onIssueImported,
  onRepoImported,
  onSuccess,
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
      if (segments.length < 4 || segments[2] !== "issues" || !/^\d+$/.test(segments[3])) {
        return "Issue URL must match: https://github.com/owner/repository/issues/123";
      }
    } else {
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
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const repo = await importGitHubRepo(url.trim());
        setImportedRepo(repo);
        setRequestState("success");
        if (onRepoImported) {
          onRepoImported(repo);
        }
        if (onSuccess) {
          onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs text-[#F5F5F0]">
      <div className="relative w-full max-w-lg rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#3A4037] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xs border border-[#3A4037] bg-[#141613] text-[#C6F36B]">
              {activeTab === "issue" ? (
                <GitPullRequest className="h-4 w-4" />
              ) : (
                <FolderGit2 className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F5F5F0]">
                {activeTab === "issue" ? "Import GitHub Issue" : "Import Repository"}
              </h2>
              <p className="text-[11px] font-mono text-[#9BA095]">
                Connected Read-Only Inspection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xs p-1 text-[#9BA095] hover:bg-[#292D27] hover:text-[#F5F5F0] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#3A4037]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("issue");
              handleReset();
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-mono transition-colors ${
              activeTab === "issue"
                ? "border-[#C6F36B] text-[#F5F5F0] font-bold"
                : "border-transparent text-[#9BA095] hover:text-[#F5F5F0]"
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
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-mono transition-colors ${
              activeTab === "repo"
                ? "border-[#C6F36B] text-[#F5F5F0] font-bold"
                : "border-transparent text-[#9BA095] hover:text-[#F5F5F0]"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>GitHub Repository</span>
          </button>
        </div>

        {/* Success State */}
        {requestState === "success" && (
          <div className="rounded-xs border border-[#AEE64E] bg-[#C6F36B]/15 p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#C6F36B] font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {activeTab === "issue"
                  ? "Issue successfully imported"
                  : "Repository successfully indexed"}
              </span>
            </div>

            {importedIssue && (
              <div className="rounded-xs bg-[#141613] border border-[#3A4037] p-3 text-xs space-y-1">
                <div className="font-bold text-[#F5F5F0]">{importedIssue.title}</div>
                <div className="font-mono text-[11px] text-[#9BA095]">
                  Repository: {importedIssue.repository} • ID: {importedIssue.id}
                </div>
              </div>
            )}

            {importedRepo && (
              <div className="rounded-xs bg-[#141613] border border-[#3A4037] p-3 text-xs space-y-1">
                <div className="font-bold text-[#F5F5F0]">
                  {importedRepo.owner}/{importedRepo.name}
                </div>
                <div className="font-mono text-[11px] text-[#9BA095]">
                  Default branch: {importedRepo.defaultBranch} • Files indexed: {importedRepo.fileCount ?? 0}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 font-mono">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xs border border-[#3A4037] bg-[#292D27] px-3.5 py-1.5 text-xs text-[#F5F5F0] hover:bg-[#3A4037]"
              >
                Close
              </button>
              {activeTab === "issue" && (
                <button
                  type="button"
                  onClick={handleOpenIssue}
                  className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-3.5 py-1.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856]"
                >
                  <span>Open issue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
              {activeTab === "repo" && (
                <button
                  type="button"
                  onClick={handleOpenRepoIssues}
                  className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-3.5 py-1.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856]"
                >
                  <span>View repository issues</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form State */}
        {requestState !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#F5F5F0] mb-1.5 font-mono uppercase tracking-wider">
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
                className="w-full rounded-xs border border-[#3A4037] bg-[#141613] px-3 py-2 text-xs font-mono text-[#F5F5F0] placeholder-[#777D71] focus:border-[#C6F36B] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[#9BA095]">
                Only public repositories are supported. Private repositories are not supported yet.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/15 p-3 text-xs text-[#FFA39E]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D65B56] mt-0.5" />
                <span className="font-mono text-[11px]">{errorMsg}</span>
              </div>
            )}

            {/* Safety Note */}
            <div className="flex items-center gap-2 rounded-xs border border-[#3A4037] bg-[#141613] p-2.5 text-[11px] text-[#9BA095] font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-[#35A56A] shrink-0" />
              <span>BugBunny proposes changes. Your repository stays under your control.</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#3A4037] font-mono">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-xs border border-[#3A4037] bg-[#292D27] px-3.5 py-1.5 text-xs font-medium text-[#F5F5F0] hover:bg-[#3A4037] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !url.trim()}
                className="flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-4 py-1.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] transition-colors disabled:opacity-50"
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
