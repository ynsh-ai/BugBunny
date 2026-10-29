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
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { GitHubIcon } from "@/components/GitHubIcon";
import { importGitHubIssue, importGitHubRepo } from "@/lib/api";
import { IssueDetail, RepositoryItem } from "@/mock/types";

interface ImportGitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueImported?: (issue: IssueDetail) => void;
  onRepoImported?: (repo: RepositoryItem) => void;
}

export function ImportGitHubModal({
  isOpen,
  onClose,
  onIssueImported,
  onRepoImported,
}: ImportGitHubModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"issue" | "repo">("issue");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importedRepoResult, setImportedRepoResult] = useState<RepositoryItem | null>(null);

  if (!isOpen) return null;

  const handleQuickFill = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleReset = () => {
    setUrl("");
    setErrorMsg(null);
    setSuccessMsg(null);
    setImportedRepoResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setImportedRepoResult(null);

    try {
      if (activeTab === "issue") {
        const issue = await importGitHubIssue(url.trim());
        setSuccessMsg(`Successfully imported issue ${issue.id}: "${issue.title}"`);
        if (onIssueImported) {
          onIssueImported(issue);
        }
        setTimeout(() => {
          onClose();
          router.push(`/issues/${encodeURIComponent(issue.id)}`);
        }, 1000);
      } else {
        const repo = await importGitHubRepo(url.trim());
        setImportedRepoResult(repo);
        setSuccessMsg(`Successfully imported repository ${repo.owner}/${repo.name} with ${repo.fileCount ?? 0} safe files.`);
        if (onRepoImported) {
          onRepoImported(repo);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import from GitHub.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-lg border border-[#2b2f3a] bg-[#121419] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#22252e] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#2b2f3a] bg-[#1a1c24] text-white">
              <GitHubIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Import from GitHub</h2>
              <p className="text-[11px] font-mono text-[#9aa1b0]">
                Connected Read-Only Integration (Zero Write Access)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#626875] hover:bg-[#1f222b] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="mt-4 flex items-start gap-2.5 rounded border border-sky-900/60 bg-sky-950/30 p-3 text-xs text-sky-200">
          <ShieldCheck className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-sky-300">Read-Only Safety Guarantee:</span>
            <p className="text-[11px] text-sky-200/80 leading-relaxed font-sans">
              BugBunny only requests read-only metadata and bounded file trees. It never asks for write permissions, creates branches, commits, or modifies GitHub issues.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex border-b border-[#22252e]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("issue");
              handleReset();
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "issue"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#9aa1b0] hover:text-white"
            }`}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            <span>Public Issue</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("repo");
              handleReset();
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "repo"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-[#9aa1b0] hover:text-white"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Public Repository</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c0c5d0] mb-1.5">
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
                  ? "https://github.com/psf/requests/issues/6440"
                  : "https://github.com/pallets/flask"
              }
              className="w-full rounded border border-[#2b2f3a] bg-[#0d0e12] px-3 py-2 text-xs font-mono text-white placeholder-[#525763] focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#626875]">
            <span>Try example:</span>
            {activeTab === "issue" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/psf/requests/issues/6440")}
                  className="rounded bg-[#1a1c24] px-2 py-0.5 text-emerald-400 hover:bg-[#222530] border border-[#2d313d]"
                >
                  psf/requests #6440
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/pallets/flask/issues/5000")}
                  className="rounded bg-[#1a1c24] px-2 py-0.5 text-emerald-400 hover:bg-[#222530] border border-[#2d313d]"
                >
                  pallets/flask #5000
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/psf/requests")}
                  className="rounded bg-[#1a1c24] px-2 py-0.5 text-emerald-400 hover:bg-[#222530] border border-[#2d313d]"
                >
                  psf/requests
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/pallets/flask")}
                  className="rounded bg-[#1a1c24] px-2 py-0.5 text-emerald-400 hover:bg-[#222530] border border-[#2d313d]"
                >
                  pallets/flask
                </button>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="font-mono text-[11px]">{errorMsg}</div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-start gap-2 rounded border border-emerald-900/60 bg-emerald-950/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="font-mono text-[11px]">{successMsg}</div>
            </div>
          )}

          {/* Imported Repo Summary Card */}
          {importedRepoResult && (
            <div className="rounded border border-[#2b2f3a] bg-[#171922] p-3 text-xs font-mono space-y-1.5 text-[#cbd0dc]">
              <div className="flex items-center justify-between text-white font-semibold">
                <span>{importedRepoResult.owner}/{importedRepoResult.name}</span>
                <span className="text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/60">
                  connected_read_only
                </span>
              </div>
              <div className="text-[11px] text-[#9aa1b0]">
                Default branch: <span className="text-white">{importedRepoResult.defaultBranch}</span>
              </div>
              <div className="text-[11px] text-[#9aa1b0]">
                Safe filtered files: <span className="text-emerald-400 font-semibold">{importedRepoResult.fileCount ?? 0}</span>
                <span className="text-[10px] text-[#626875] ml-1">(sensitive/large files excluded)</span>
              </div>
              <div className="pt-2 flex items-center justify-end">
                <a
                  href={importedRepoResult.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#22252e] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded border border-[#2b2f3a] bg-[#181a22] px-3.5 py-1.5 text-xs font-medium text-[#9aa1b0] hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-1.5 rounded border border-emerald-600 bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {isLoading
                  ? "Importing..."
                  : activeTab === "issue"
                  ? "Import Issue"
                  : "Import Repository"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
