"use client";

import React, { useState } from "react";
import { DocumentationData } from "@/mock/types";
import { GitPullRequest, Copy, Check, FileText, Tag, Layers } from "lucide-react";

interface DocPreviewProps {
  doc: DocumentationData;
}

export function DocPreview({ doc }: DocPreviewProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!doc) {
    return (
      <div className="p-8 text-center text-xs text-[#8b949e]">
        No documentation draft available for this investigation.
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.prBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* PR Title & Branch Header */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[#f0f6fc]">
              Pull Request Draft
            </span>
          </div>

          <div className="flex items-center gap-2">
            {doc.branchName && (
              <span className="font-mono text-[11px] text-[#8b949e] bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded">
                {doc.branchName} &rarr; {doc.targetBranch || "main"}
              </span>
            )}
            {doc.prBody && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2.5 py-1 text-[11px] font-mono text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {doc.prTitle && (
          <h3 className="mt-3 font-mono text-sm font-semibold text-[#f0f6fc]">
            {doc.prTitle}
          </h3>
        )}
      </div>

      {/* Generated PR Body Markdown Box */}
      {doc.prBody && (
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
          <div className="border-b border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs font-semibold text-[#f0f6fc] flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-[#8b949e]" />
            <span>PR Description (GitHub Markdown)</span>
          </div>
          <div className="bg-[#0d1117] p-4 font-mono text-xs text-[#c9d1d9] leading-relaxed whitespace-pre-wrap select-text">
            {doc.prBody}
          </div>
        </div>
      )}

      {/* Changelog & Release Notes */}
      {(doc.changelogEntry || (doc.affectedComponents && doc.affectedComponents.length > 0)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doc.changelogEntry && (
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc] mb-2">
                <Tag className="h-3.5 w-3.5 text-[#8b949e]" />
                <span>Changelog Entry</span>
              </div>
              <p className="text-xs text-[#8b949e] font-mono leading-relaxed bg-[#0d1117] p-2.5 rounded border border-[#30363d]">
                {doc.changelogEntry}
              </p>
            </div>
          )}

          {doc.affectedComponents && doc.affectedComponents.length > 0 && (
            <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f6fc] mb-2">
                <Layers className="h-3.5 w-3.5 text-[#8b949e]" />
                <span>Affected Components</span>
              </div>
              <div className="space-y-1">
                {doc.affectedComponents.map((comp) => (
                  <div
                    key={comp}
                    className="font-mono text-[11px] text-[#8b949e] bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]"
                  >
                    {comp}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
