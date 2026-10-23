"use client";

import React, { useState } from "react";
import { DocumentationData } from "@/mock/types";
import { GitPullRequest, Copy, Check, FileText, Tag, Layers } from "lucide-react";

interface DocPreviewProps {
  doc: DocumentationData;
}

export function DocPreview({ doc }: DocPreviewProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(doc.prBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* PR Title & Branch Header */}
      <div className="rounded border border-[#22252e] bg-[#13151a] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22252e] pb-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[#f0f2f5]">
              Pull Request Draft
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#9aa1b0] bg-[#1d2027] border border-[#262933] px-2 py-0.5 rounded">
              {doc.branchName} &rarr; {doc.targetBranch}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 rounded border border-[#22252e] bg-[#1a1c23] px-2.5 py-1 text-[11px] font-mono text-[#9aa1b0] hover:text-[#f0f2f5] hover:border-[#2f333f] transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Copied PR</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy PR Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>

        <h3 className="mt-3 font-mono text-sm font-semibold text-[#f0f2f5]">
          {doc.prTitle}
        </h3>
      </div>

      {/* Generated PR Body Markdown Box */}
      <div className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
        <div className="border-b border-[#22252e] bg-[#16181f] px-3.5 py-2 text-xs font-semibold text-[#f0f2f5] flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-[#9aa1b0]" />
          <span>PR Description (GitHub Flavored Markdown)</span>
        </div>
        <div className="bg-[#0b0c0f] p-4 font-mono text-xs text-[#cbd0dc] leading-relaxed whitespace-pre-wrap select-text">
          {doc.prBody}
        </div>
      </div>

      {/* Changelog & Release Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded border border-[#22252e] bg-[#13151a] p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f2f5] mb-2">
            <Tag className="h-3.5 w-3.5 text-[#9aa1b0]" />
            <span>Changelog Entry</span>
          </div>
          <p className="text-xs text-[#9aa1b0] font-mono leading-relaxed bg-[#0e0f13] p-2.5 rounded border border-[#1f2229]">
            {doc.changelogEntry}
          </p>
        </div>

        <div className="rounded border border-[#22252e] bg-[#13151a] p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#f0f2f5] mb-2">
            <Layers className="h-3.5 w-3.5 text-[#9aa1b0]" />
            <span>Affected Components</span>
          </div>
          <div className="space-y-1">
            {doc.affectedComponents.map((comp) => (
              <div
                key={comp}
                className="font-mono text-[11px] text-[#9aa1b0] bg-[#0e0f13] px-2 py-1 rounded border border-[#1f2229]"
              >
                {comp}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
