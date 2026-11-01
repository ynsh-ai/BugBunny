"use client";

import React, { useState } from "react";
import { DocumentationData } from "@/mock/types";
import { GitPullRequest, Copy, Check } from "lucide-react";

interface DocPreviewProps {
  doc: DocumentationData;
}

export function DocPreview({ doc }: DocPreviewProps) {
  const [copied, setCopied] = useState<boolean>(false);

  if (!doc) {
    return (
      <div className="p-8 text-center text-xs text-[#777D71]">
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
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DADDD3] pb-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-[#35A56A]" />
            <span className="text-xs font-bold text-[#171916]">
              Pull Request Draft
            </span>
          </div>

          <div className="flex items-center gap-2">
            {doc.branchName && (
              <span className="font-mono text-[11px] text-[#171916] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
                {doc.branchName} &rarr; {doc.targetBranch || "main"}
              </span>
            )}
            {doc.prBody && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-xs border border-[#DADDD3] bg-[#E8EAE3] px-2.5 py-1 text-[11px] font-mono text-[#171916] hover:bg-[#DADDD3] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-[#35A56A]" />
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

        {/* PR Title */}
        <div className="mt-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#777D71] mb-1">
            Suggested PR Title
          </div>
          <div className="font-mono text-xs font-bold text-[#171916] bg-[#E8EAE3] p-2 rounded-2xs border border-[#DADDD3]">
            {doc.prTitle || "fix: resolve reported issue with verified patch"}
          </div>
        </div>

        {/* PR Body Markdown Container */}
        {doc.prBody && (
          <div className="mt-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#777D71] mb-1">
              Generated Pull Request Body
            </div>
            <div className="bg-[#1F221E] border border-[#3A4037] rounded-xs p-4 text-xs font-mono text-[#F5F5F0] overflow-x-auto select-text whitespace-pre-wrap leading-relaxed">
              {doc.prBody}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
