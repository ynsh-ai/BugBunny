"use client";

import React, { useState } from "react";
import { DiffFile } from "@/mock/types";
import { FileCode, Plus, Minus, Copy, Check } from "lucide-react";

interface CodeDiffViewerProps {
  diffs: DiffFile[];
}

export function CodeDiffViewer({ diffs }: CodeDiffViewerProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  if (!diffs || diffs.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#777D71]">
        No patch diffs generated for this investigation.
      </div>
    );
  }

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="space-y-4">
      {diffs.map((diff) => {
        const fullDiffContent = diff.lines.map((l) => l.content).join("\n");

        return (
          <div
            key={diff.filename}
            className="rounded-xs border border-[#3A4037] bg-[#1F221E] overflow-hidden shadow-sm"
          >
            {/* Diff File Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3A4037] bg-[#292D27] px-3.5 py-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[#C6F36B]" />
                <span className="font-mono text-xs font-semibold text-[#F5F5F0]">
                  {diff.filename}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px]">
                  {diff.additions > 0 && (
                    <span className="flex items-center text-[#35A56A] font-semibold">
                      <Plus className="h-3 w-3" />
                      {diff.additions}
                    </span>
                  )}
                  {diff.deletions > 0 && (
                    <span className="flex items-center text-[#D65B56] font-semibold">
                      <Minus className="h-3 w-3" />
                      {diff.deletions}
                    </span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(diff.filename, fullDiffContent)}
                className="flex items-center gap-1 rounded-xs border border-[#3A4037] bg-[#1F221E] px-2 py-0.5 text-[10px] font-mono text-[#F5F5F0] hover:bg-[#3A4037] transition-colors"
              >
                {copiedFile === diff.filename ? (
                  <>
                    <Check className="h-3 w-3 text-[#35A56A]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Diff</span>
                  </>
                )}
              </button>
            </div>

            {/* Diff content view */}
            <div className="overflow-x-auto font-mono text-xs leading-relaxed select-text bg-[#141613]">
              <table className="w-full border-collapse">
                <tbody>
                  {diff.lines.map((line, idx) => {
                    const isAddition = line.type === "addition";
                    const isDeletion = line.type === "deletion";
                    const isHeader = line.type === "header";

                    let rowBg = "hover:bg-[#1F221E]/60";
                    let textColor = "text-[#E8EAE3]";
                    let linePrefix = " ";

                    if (isAddition) {
                      rowBg = "bg-[#35A56A]/15 hover:bg-[#35A56A]/25";
                      textColor = "text-[#AEE64E]";
                      linePrefix = "+";
                    } else if (isDeletion) {
                      rowBg = "bg-[#D65B56]/15 hover:bg-[#D65B56]/25";
                      textColor = "text-[#FFA39E]";
                      linePrefix = "-";
                    } else if (isHeader) {
                      rowBg = "bg-[#1F221E]";
                      textColor = "text-[#6388D9]";
                      linePrefix = " ";
                    }

                    return (
                      <tr key={idx} className={`${rowBg} transition-colors`}>
                        {/* Old line number */}
                        <td className="w-10 select-none border-r border-[#2B3128] pr-2 text-right font-mono text-[10px] text-[#777D71]">
                          {line.oldLineNumber || ""}
                        </td>
                        {/* New line number */}
                        <td className="w-10 select-none border-r border-[#2B3128] pr-2 text-right font-mono text-[10px] text-[#777D71]">
                          {line.newLineNumber || ""}
                        </td>
                        {/* Prefix symbol */}
                        <td className="w-4 select-none pl-2 text-center font-mono text-[11px] font-bold text-[#9BA095]">
                          {!isHeader && linePrefix}
                        </td>
                        {/* Code text */}
                        <td
                          className={`pl-1 pr-4 whitespace-pre font-mono text-[11px] ${textColor}`}
                        >
                          {line.content}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
