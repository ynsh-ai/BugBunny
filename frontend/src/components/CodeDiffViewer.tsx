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
      <div className="p-8 text-center text-xs text-[#8b949e]">
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
            className="rounded-lg border border-[#30363d] bg-[#0d1117] overflow-hidden"
          >
            {/* Diff File Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] bg-[#161b22] px-3.5 py-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[#8b949e]" />
                <span className="font-mono text-xs font-semibold text-[#f0f6fc]">
                  {diff.filename}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  {diff.additions > 0 && (
                    <span className="flex items-center text-emerald-400">
                      <Plus className="h-3 w-3" />
                      {diff.additions}
                    </span>
                  )}
                  {diff.deletions > 0 && (
                    <span className="flex items-center text-rose-400">
                      <Minus className="h-3 w-3" />
                      {diff.deletions}
                    </span>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(diff.filename, fullDiffContent)}
                className="flex items-center gap-1 rounded-md border border-[#30363d] bg-[#21262d] px-2 py-0.5 text-[10px] font-mono text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
              >
                {copiedFile === diff.filename ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
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
            <div className="overflow-x-auto font-mono text-xs leading-relaxed select-text">
              <table className="w-full border-collapse">
                <tbody>
                  {diff.lines.map((line, idx) => {
                    const isAddition = line.type === "addition";
                    const isDeletion = line.type === "deletion";
                    const isHeader = line.type === "header";

                    let rowBg = "hover:bg-[#161b22]/50";
                    let textColor = "text-[#c9d1d9]";
                    let linePrefix = " ";

                    if (isAddition) {
                      rowBg = "bg-emerald-950/25 hover:bg-emerald-950/40";
                      textColor = "text-emerald-300";
                      linePrefix = "+";
                    } else if (isDeletion) {
                      rowBg = "bg-rose-950/25 hover:bg-rose-950/40";
                      textColor = "text-rose-300";
                      linePrefix = "-";
                    } else if (isHeader) {
                      rowBg = "bg-[#161b22]";
                      textColor = "text-[#58a6ff]";
                      linePrefix = " ";
                    }

                    return (
                      <tr key={idx} className={`${rowBg} transition-colors`}>
                        {/* Old line number */}
                        <td className="w-10 select-none border-r border-[#21262d] pr-2 text-right font-mono text-[10px] text-[#6e7681]">
                          {line.oldLineNumber || ""}
                        </td>
                        {/* New line number */}
                        <td className="w-10 select-none border-r border-[#21262d] pr-2 text-right font-mono text-[10px] text-[#6e7681]">
                          {line.newLineNumber || ""}
                        </td>
                        {/* Prefix symbol */}
                        <td className="w-4 select-none pl-2 text-center font-mono text-[11px] font-bold text-[#8b949e]">
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
