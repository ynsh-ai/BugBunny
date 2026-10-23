"use client";

import React, { useState } from "react";
import { EvidenceItem } from "@/mock/types";
import { Copy, Check, Terminal, Code2, AlertTriangle, FileCode } from "lucide-react";

interface EvidenceViewerProps {
  evidence: EvidenceItem[];
}

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type: EvidenceItem["type"]) => {
    switch (type) {
      case "stack_trace":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />;
      case "code_reference":
        return <FileCode className="h-3.5 w-3.5 text-amber-400" />;
      case "test_output":
        return <Terminal className="h-3.5 w-3.5 text-sky-400" />;
      default:
        return <Code2 className="h-3.5 w-3.5 text-[#9aa1b0]" />;
    }
  };

  return (
    <div className="space-y-3">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden"
        >
          {/* Card header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22252e] bg-[#16181f] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              {getIcon(item.type)}
              <span className="font-semibold text-[#f0f2f5]">{item.title}</span>
              {item.location && (
                <span className="rounded bg-[#1d2027] px-1.5 py-0.5 font-mono text-[10px] text-[#9aa1b0] border border-[#2b2f3a]">
                  {item.location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {item.timestamp && (
                <span className="text-[10px] font-mono text-[#626875]">
                  {item.timestamp}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.snippet)}
                className="flex items-center gap-1 rounded border border-[#22252e] bg-[#1a1c23] px-2 py-0.5 text-[10px] font-mono text-[#9aa1b0] hover:text-[#f0f2f5] hover:border-[#2f333f] transition-colors"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="px-3.5 py-2 text-xs text-[#9aa1b0] border-b border-[#1c1f26] bg-[#13151a]">
            {item.description}
          </div>

          {/* Code/Log Snippet */}
          <div className="bg-[#0b0c0f] p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-[#d1d5db]">
            <pre className="whitespace-pre">{item.snippet}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
