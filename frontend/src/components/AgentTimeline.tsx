"use client";

import React from "react";
import { TimelineStep } from "@/mock/types";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  MinusCircle,
  Search,
  Layers,
  Code2,
  TestTube2,
  ShieldCheck,
} from "lucide-react";

interface AgentTimelineProps {
  timeline: TimelineStep[];
  isInvestigating?: boolean;
}

interface StandardStage {
  name: string;
  key: string;
  aliases: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const STANDARD_STAGES: StandardStage[] = [
  {
    name: "Requirements analysis",
    key: "requirements",
    aliases: ["requirements analysis", "requirementsanalystagent", "requirements"],
    icon: Search,
  },
  {
    name: "Codebase investigation",
    key: "investigation",
    aliases: ["bug investigation", "codebase investigation", "codeinvestigatoragent", "investigation"],
    icon: Layers,
  },
  {
    name: "Solution planning",
    key: "planning",
    aliases: ["solution planning", "solutionplanneragent", "planning"],
    icon: Code2,
  },
  {
    name: "Patch proposal",
    key: "patch",
    aliases: ["coding assistant", "patch engineering", "patchengineeragent", "patch proposal"],
    icon: Code2,
  },
  {
    name: "Test review",
    key: "testing",
    aliases: ["testing", "testrunneragent", "test review"],
    icon: TestTube2,
  },
  {
    name: "Code review and documentation",
    key: "review",
    aliases: ["code review", "coderevieweragent", "documentation", "docgeneratoragent", "code review and documentation"],
    icon: ShieldCheck,
  },
];

export function AgentTimeline({ timeline, isInvestigating = false }: AgentTimelineProps) {
  // Map incoming runs to standard stages
  const getRunForStage = (stage: StandardStage) => {
    if (!timeline || timeline.length === 0) return null;
    return timeline.find((run) => {
      const runStage = (run.stage || "").toLowerCase();
      const runAgent = (run.agentName || "").toLowerCase();
      return (
        stage.aliases.some((alias) => runStage.includes(alias) || runAgent.includes(alias))
      );
    });
  };

  return (
    <div className="rounded-lg border border-[#22252e] bg-[#13151a] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#22252e] pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f0f2f5]">
          Investigation Pipeline
        </h3>
        {isInvestigating && (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Running</span>
          </span>
        )}
      </div>

      {/* Simple Vertical Stage Timeline */}
      <div className="space-y-4">
        {STANDARD_STAGES.map((stage, idx) => {
          const run = getRunForStage(stage);
          const Icon = stage.icon;

          let displayStatus: "Not started" | "Running" | "Complete" | "Failed" | "Blocked" = "Not started";
          if (run) {
            if (run.status === "complete") displayStatus = "Complete";
            else if (run.status === "in_progress") displayStatus = "Running";
            else if (run.status === "failed") displayStatus = "Failed";
            else if (run.status === "pending") displayStatus = "Not started";
          } else if (isInvestigating) {
            // If investigating and previous stage completed, this one might be active
            const prevRun = idx > 0 ? getRunForStage(STANDARD_STAGES[idx - 1]) : null;
            if (idx === 0 || (prevRun && prevRun.status === "complete")) {
              displayStatus = "Running";
            }
          }

          const statusColor = {
            Complete: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
            Running: "text-amber-400 bg-amber-950/40 border-amber-800/60",
            Failed: "text-rose-400 bg-rose-950/40 border-rose-800/60",
            Blocked: "text-purple-400 bg-purple-950/40 border-purple-800/60",
            "Not started": "text-[#626875] bg-[#0d0e12] border-[#22252e]",
          }[displayStatus];

          const statusIcon = {
            Complete: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
            Running: <CircleDot className="h-4 w-4 text-amber-400 animate-pulse" />,
            Failed: <AlertCircle className="h-4 w-4 text-rose-400" />,
            Blocked: <MinusCircle className="h-4 w-4 text-purple-400" />,
            "Not started": <Clock className="h-4 w-4 text-[#626875]" />,
          }[displayStatus];

          return (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="pt-0.5 shrink-0">{statusIcon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[#9aa1b0]" />
                    <span className="text-xs font-medium text-[#f0f2f5]">
                      {stage.name}
                    </span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono border ${statusColor}`}
                  >
                    {displayStatus}
                  </span>
                </div>

                {/* Show summary only if returned by API */}
                {run && run.summary && run.summary.trim().length > 0 && (
                  <p className="mt-1 text-xs text-[#9aa1b0] leading-relaxed">
                    {run.summary}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
