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
    <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#DADDD3] pb-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#171916]">
          Autonomous Pipeline Stages
        </h3>
        {isInvestigating && (
          <span className="flex items-center gap-1.5 text-xs text-[#D99A37] font-mono font-semibold">
            <span className="h-2 w-2 rounded-full bg-[#D99A37] animate-pulse" />
            <span>Running</span>
          </span>
        )}
      </div>

      {/* Simple Vertical Stage Timeline */}
      <div className="space-y-3.5">
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
            const prevRun = idx > 0 ? getRunForStage(STANDARD_STAGES[idx - 1]) : null;
            if (idx === 0 || (prevRun && prevRun.status === "complete")) {
              displayStatus = "Running";
            }
          }

          const statusColor = {
            Complete: "text-[#227247] bg-[#35A56A]/12 border-[#35A56A]/35",
            Running: "text-[#9E6A1B] bg-[#D99A37]/15 border-[#D99A37]/40",
            Failed: "text-[#B33833] bg-[#D65B56]/12 border-[#D65B56]/35",
            Blocked: "text-[#4C43C7] bg-[#756CF5]/12 border-[#756CF5]/35",
            "Not started": "text-[#777D71] bg-[#E8EAE3] border-[#DADDD3]",
          }[displayStatus];

          const statusIcon = {
            Complete: <CheckCircle2 className="h-4 w-4 text-[#35A56A]" />,
            Running: <CircleDot className="h-4 w-4 text-[#D99A37] animate-pulse" />,
            Failed: <AlertCircle className="h-4 w-4 text-[#D65B56]" />,
            Blocked: <MinusCircle className="h-4 w-4 text-[#756CF5]" />,
            "Not started": <Clock className="h-4 w-4 text-[#777D71]" />,
          }[displayStatus];

          return (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="pt-0.5 shrink-0">{statusIcon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[#777D71]" />
                    <span className="text-xs font-semibold text-[#171916]">
                      {stage.name}
                    </span>
                  </div>
                  <span
                    className={`rounded-2xs px-2 py-0.5 text-[10px] font-mono border ${statusColor}`}
                  >
                    {displayStatus}
                  </span>
                </div>

                {/* Show summary only if returned by API */}
                {run && run.summary && run.summary.trim().length > 0 && (
                  <p className="mt-1 text-xs text-[#777D71] leading-relaxed">
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
