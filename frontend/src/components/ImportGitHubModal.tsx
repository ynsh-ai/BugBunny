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
  initialTab?: "issue" | "repo";
  onIssueImported?: (issue: IssueDetail) => void;
  onRepoImported?: (repo: RepositoryItem) => void;
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importedRepoResult, setImportedRepoResult] = useState<RepositoryItem | null>(null);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }

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
        }, 800);
      } else {
        const repo = await importGitHubRepo(url.trim());
        setImportedRepoResult(repo);
        setSuccessMsg(`Successfully imported repository ${repo.owner}/${repo.name} (${repo.fileCount ?? 0} files).`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-lg border border-[#30363d] bg-[#161b22] p-6 shadow-2xl text-[#c9d1d9]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#30363d] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#f0f6fc]">
              <GitHubIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#f0f6fc]">Import from GitHub</h2>
              <p className="text-[11px] font-mono text-[#8b949e]">
                Connected Read-Only Integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#8b949e] hover:bg-[#21262d] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-[#30363d] bg-[#0d1117] p-3 text-xs text-[#8b949e]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#f0f6fc]">Strict Safety Guarantee:</span>
            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              BugBunny operates strictly read-only and never modifies your repository without your explicit approval.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex border-b border-[#30363d]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("issue");
              handleReset();
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "issue"
                ? "border-[#58a6ff] text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
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
                ? "border-[#58a6ff] text-[#58a6ff]"
                : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
            }`}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span>Public Repository</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#c9d1d9] mb-1.5">
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
              className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-xs font-mono text-[#f0f6fc] placeholder-[#6e7681] focus:border-[#58a6ff] focus:outline-none"
            />
          </div>

          {/* Quick Examples */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#8b949e]">
            <span>Try example:</span>
            {activeTab === "issue" ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/psf/requests/issues/6440")}
                  className="rounded bg-[#21262d] px-2 py-0.5 text-[#58a6ff] hover:bg-[#30363d] border border-[#30363d]"
                >
                  psf/requests #6440
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/pallets/flask/issues/5000")}
                  className="rounded bg-[#21262d] px-2 py-0.5 text-[#58a6ff] hover:bg-[#30363d] border border-[#30363d]"
                >
                  pallets/flask #5000
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/psf/requests")}
                  className="rounded bg-[#21262d] px-2 py-0.5 text-[#58a6ff] hover:bg-[#30363d] border border-[#30363d]"
                >
                  psf/requests
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("https://github.com/pallets/flask")}
                  className="rounded bg-[#21262d] px-2 py-0.5 text-[#58a6ff] hover:bg-[#30363d] border border-[#30363d]"
                >
                  pallets/flask
                </button>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-md border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="font-mono text-[11px]">{errorMsg}</div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="font-mono text-[11px]">{successMsg}</div>
            </div>
          )}

          {/* Imported Repo Summary Card */}
          {importedRepoResult && (
            <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3 text-xs font-mono space-y-1.5 text-[#c9d1d9]">
              <div className="flex items-center justify-between text-[#f0f6fc] font-semibold">
                <span>{importedRepoResult.owner}/{importedRepoResult.name}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                  connected_read_only
                </span>
              </div>
              <div className="text-[11px] text-[#8b949e]">
                Default branch: <span className="text-[#f0f6fc]">{importedRepoResult.defaultBranch}</span>
              </div>
              <div className="text-[11px] text-[#8b949e]">
                Safe indexed files: <span className="text-[#58a6ff] font-semibold">{importedRepoResult.fileCount ?? 0}</span>
                <span className="text-[10px] text-[#6e7681] ml-1">(sensitive/large excluded)</span>
              </div>
              <div className="pt-2 flex items-center justify-end">
                <a
                  href={importedRepoResult.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#30363d] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-[#30363d] bg-[#21262d] px-3.5 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-1.5 rounded-md border border-[#2ea043] bg-[#238636] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#2ea043] transition-colors disabled:opacity-50"
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
