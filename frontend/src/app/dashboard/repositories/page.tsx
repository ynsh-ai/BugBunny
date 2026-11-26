"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Plus,
  RefreshCw,
} from "lucide-react";

import { fetchRepositories } from "@/lib/api";
import { RepositoryItem } from "@/mock/types";
import { Badge, SourceBadge } from "@/components/Badge";
import { ImportGitHubModal } from "@/components/ImportGitHubModal";

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<RepositoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const loadRepositories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRepositories();
      setRepositories(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load repositories.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchRepositories()
      .then((data) => {
        if (isMounted) {
          setRepositories(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load repositories.";
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#171916]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DADDD3] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#171916]">
              Connected Repositories
            </h1>
            {repositories.length > 0 && (
              <span className="rounded-xs bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 font-mono text-xs text-[#171916]">
                {repositories.length}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[#777D71]">
            Read-only repositories tracked in your BugBunny workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-3.5 py-1.5 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Repository</span>
          </button>
          <button
            type="button"
            onClick={loadRepositories}
            title="Refresh Repositories"
            aria-label="Refresh Repositories"
            className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-1.5 text-[#777D71] hover:text-[#171916] hover:bg-[#DADDD3] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-6 w-6 mb-3 animate-spin rounded-full border-2 border-[#DADDD3] border-t-[#171916]" />
          <p className="text-xs font-mono text-[#777D71]">
            Loading repositories...
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xs border border-[#D65B56]/40 bg-[#D65B56]/10 p-4 text-xs text-[#B33833] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadRepositories}
            className="font-mono underline hover:text-[#171916] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && repositories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4 hover:border-[#171916] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/dashboard/repositories/${encodeURIComponent(repo.id)}`}
                      className="font-mono text-sm font-bold text-[#171916] hover:underline block truncate"
                    >
                      {repo.owner}/{repo.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-[#777D71] font-mono">
                      <GitBranch className="h-3 w-3" />
                      <span>{repo.defaultBranch || "main"}</span>
                    </div>
                  </div>
                  <Badge variant={repo.isActive ? "success" : "neutral"}>
                    {repo.isActive ? "Connected" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SourceBadge mode={repo.mode} />
                  <span className="font-mono text-[11px] text-[#777D71]">
                    {repo.fileCount ?? "—"} files cached
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#DADDD3]">
                {repo.githubUrl ? (
                  <a
                    href={repo.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#777D71] hover:text-[#171916]"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span />
                )}

                <Link
                  href={`/dashboard/repositories/${encodeURIComponent(repo.id)}`}
                  className="inline-flex items-center gap-1.5 rounded-xs bg-[#171916] px-3 py-1.5 text-xs font-semibold text-[#F5F5F0] hover:bg-[#292D27] transition-colors"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && repositories.length === 0 && (
        <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-12 text-center space-y-3">
          <FolderGit2 className="mx-auto h-8 w-8 text-[#777D71]" />
          <h2 className="text-sm font-bold text-[#171916]">
            No repositories connected yet
          </h2>
          <p className="text-xs text-[#777D71] max-w-sm mx-auto">
            Import a public GitHub repository to index its file tree and track
            issues in your BugBunny workspace.
          </p>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xs bg-[#C6F36B] px-4 py-2 text-xs font-bold text-[#171916] border border-[#AEE64E] hover:bg-[#B5E856] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Import Repository</span>
          </button>
        </div>
      )}

      <ImportGitHubModal
        isOpen={isImportModalOpen}
        initialTab="repo"
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          void loadRepositories();
        }}
      />
    </main>
  );
}
