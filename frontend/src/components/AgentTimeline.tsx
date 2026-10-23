"use client";

import React, { useState } from "react";
import { TimelineStep } from "@/mock/types";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Search,
  Code2,
  TestTube2,
  ShieldCheck,
  FileText,
} from "lucide-react";

interface AgentTimelineProps {
  timeline: TimelineStep[];
}

export function AgentTimeline({ timeline }: AgentTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "Requirements Analysis":
        return <Search className="h-3.5 w-3.5" />;
      case "Bug Investigation":
        return <Layers className="h-3.5 w-3.5" />;
      case "Coding Assistant":
        return <Code2 className="h-3.5 w-3.5" />;
      case "Testing":
        return <TestTube2 className="h-3.5 w-3.5" />;
      case "Code Review":
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case "Documentation":
        return <FileText className="h-3.5 w-3.5" />;
      default:
        return <Cpu className="h-3.5 w-3.5" />;
    }
  };

  const getStatusBadge = (status: TimelineStep["status"]) => {
    switch (status) {
      case "complete":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Passed</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Running</span>
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400">
            <span>Failed</span>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono text-[#626875]">
            <span>Queued</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded border border-[#22252e] bg-[#13151a]">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#22252e] bg-[#16181f] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#9aa1b0]" />
          <h3 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider">
            Multi-Agent Pipeline Progression
          </h3>
        </div>
        <div className="text-[11px] font-mono text-[#9aa1b0]">
          {timeline.filter((s) => s.status === "complete").length} of{" "}
          {timeline.length} stages complete
        </div>
      </div>

      {/* Pipeline Stages Sequence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 divide-y lg:divide-y-0 lg:divide-x divide-[#1f2229]">
        {timeline.map((step, idx) => {
          const isExpanded = expandedIndex === idx;
          const isComplete = step.status === "complete";
          const isInProgress = step.status === "in_progress";

          return (
            <div
              key={step.stage}
              className={`flex flex-col justify-between p-3 transition-colors ${
                isComplete
                  ? "bg-[#13151a] hover:bg-[#161820]"
                  : isInProgress
                  ? "bg-amber-950/10 hover:bg-amber-950/20"
                  : "bg-[#111216] opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#626875]">
                    0{idx + 1}
                  </span>
                  {getStatusBadge(step.status)}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <div
                    className={`rounded p-1 ${
                      isComplete
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                        : isInProgress
                        ? "bg-amber-950/60 text-amber-400 border border-amber-900/60"
                        : "bg-[#1c1f26] text-[#626875]"
                    }`}
                  >
                    {getStageIcon(step.stage)}
                  </div>
                  <span className="text-xs font-medium text-[#f0f2f5] leading-snug">
                    {step.stage}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#626875]">
                  <span>{step.duration || "—"}</span>
                  <span className="truncate max-w-[80px]" title={step.model}>
                    {step.model.replace("Gemini ", "G-")}
                  </span>
                </div>
              </div>

              {/* Toggle info button */}
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="mt-3 flex w-full items-center justify-between border-t border-[#1f2229] pt-1.5 text-[10px] text-[#9aa1b0] hover:text-[#f0f2f5] transition-colors"
              >
                <span>{isExpanded ? "Hide notes" : "Inspect"}</span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Expanded stage detail drawer */}
      {expandedIndex !== null && (
        <div className="border-t border-[#22252e] bg-[#16181f] p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22252e] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-emerald-400">
                Stage 0{expandedIndex + 1}:
              </span>
              <span className="font-semibold text-white">
                {timeline[expandedIndex].stage}
              </span>
              <span className="text-[#626875]">&bull;</span>
              <span className="font-mono text-[#9aa1b0]">
                {timeline[expandedIndex].agentName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[#626875]">
              <span>Model: {timeline[expandedIndex].model}</span>
              {timeline[expandedIndex].duration && (
                <span>Duration: {timeline[expandedIndex].duration}</span>
              )}
            </div>
          </div>
          <p className="mt-2 text-[#cbd0dc] leading-relaxed font-sans">
            {timeline[expandedIndex].summary}
          </p>
        </div>
      )}
    </div>
  );
}
