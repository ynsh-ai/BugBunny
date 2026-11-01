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
        return <AlertTriangle className="h-3.5 w-3.5 text-[#D65B56]" />;
      case "code_reference":
        return <FileCode className="h-3.5 w-3.5 text-[#D99A37]" />;
      case "test_output":
        return <Terminal className="h-3.5 w-3.5 text-[#6388D9]" />;
      default:
        return <Code2 className="h-3.5 w-3.5 text-[#777D71]" />;
    }
  };

  return (
    <div className="space-y-3">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden"
        >
          {/* Card header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              {getIcon(item.type)}
              <span className="font-semibold text-[#171916]">{item.title}</span>
              {item.location && (
                <span className="rounded-2xs bg-[#FFFFFF] px-1.5 py-0.5 font-mono text-[10px] text-[#171916] border border-[#DADDD3]">
                  {item.location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {item.timestamp && (
                <span className="text-[10px] font-mono text-[#777D71]">
                  {item.timestamp}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.snippet)}
                className="flex items-center gap-1 rounded-xs border border-[#DADDD3] bg-[#FFFFFF] px-2 py-0.5 text-[10px] font-mono text-[#171916] hover:bg-[#DADDD3] transition-colors"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="h-3 w-3 text-[#35A56A]" />
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

          {/* Snippet body */}
          <div className="bg-[#1F221E] p-3 text-xs font-mono text-[#F5F5F0] overflow-x-auto select-text leading-relaxed">
            <pre className="whitespace-pre">{item.snippet}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}
