import React from "react";
import Link from "next/link";
import { IssueDetail } from "@/mock/types";
import { StatusBadge, PriorityBadge, SourceBadge } from "./Badge";
import { GitBranch, Clock, ChevronRight } from "lucide-react";

interface IssueRowProps {
  issue: IssueDetail;
  compact?: boolean;
}

export function IssueRow({ issue, compact = false }: IssueRowProps) {
  // Find current active or last completed stage (if runs exist)
  const activeTimelineStep =
    issue.timeline && issue.timeline.length > 0
      ? issue.timeline.find((t) => t.status === "in_progress") ||
        [...issue.timeline].reverse().find((t) => t.status === "complete") ||
        issue.timeline[0]
      : null;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30363d] bg-[#161b22] px-4 py-3 hover:bg-[#21262d]/50 transition-colors">
      {/* Left section: ID, Title, Repo */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Link
          href={`/issues/${encodeURIComponent(issue.id)}`}
          className="font-mono text-xs font-semibold text-[#58a6ff] hover:underline shrink-0 pt-0.5"
        >
          {issue.id}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/issues/${encodeURIComponent(issue.id)}`}
              className="text-xs sm:text-sm font-medium text-[#f0f6fc] hover:text-[#58a6ff] transition-colors truncate"
            >
              {issue.title}
            </Link>
            <span className="rounded bg-[#0d1117] px-1.5 py-0.5 text-[10px] font-mono text-[#8b949e] border border-[#30363d]">
              {issue.repository}
            </span>
          </div>

          {!compact && (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#8b949e] font-mono">
              {issue.branch && (
                <span className="flex items-center gap-1 text-[#8b949e]">
                  <GitBranch className="h-3 w-3 text-[#6e7681]" />
                  <span className="truncate max-w-[160px]">{issue.branch}</span>
                </span>
              )}
              {activeTimelineStep && (
                <>
                  <span>&bull;</span>
                  <span>
                    Stage:{" "}
                    <span className="text-[#c9d1d9]">
                      {activeTimelineStep.stage}
                    </span>
                  </span>
                </>
              )}
              {issue.updatedAt && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(issue.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Source, Status, Priority, Link */}
      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
        <SourceBadge mode={issue.mode} />
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />

        <Link
          href={`/issues/${encodeURIComponent(issue.id)}`}
          className="rounded-md border border-[#30363d] bg-[#21262d] p-1.5 text-[#8b949e] group-hover:border-[#383d4a] group-hover:text-[#f0f6fc] transition-colors"
          title={`View investigation ${issue.id}`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
