import React from "react";
import Link from "next/link";
import { IssueDetail } from "@/mock/types";
import { StatusBadge, PriorityBadge } from "./Badge";
import { GitBranch, Clock, ChevronRight } from "lucide-react";

interface IssueRowProps {
  issue: IssueDetail;
  compact?: boolean;
}

export function IssueRow({ issue, compact = false }: IssueRowProps) {
  // Find current active or last completed stage
  const activeTimelineStep =
    issue.timeline.find((t) => t.status === "in_progress") ||
    [...issue.timeline].reverse().find((t) => t.status === "complete") ||
    issue.timeline[0];

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2229] bg-[#13151a] px-4 py-3 hover:bg-[#171920] transition-colors">
      {/* Left section: ID, Title, Repo */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Link
          href={`/issues/${issue.id}`}
          className="font-mono text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0 pt-0.5"
        >
          {issue.id}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/issues/${issue.id}`}
              className="text-xs sm:text-sm font-medium text-[#f0f2f5] hover:text-white transition-colors truncate"
            >
              {issue.title}
            </Link>
            <span className="rounded bg-[#1c1f26] px-1.5 py-0.5 text-[10px] font-mono text-[#9aa1b0] border border-[#262933]">
              {issue.repository}
            </span>
          </div>

          {!compact && (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#626875] font-mono">
              <span className="flex items-center gap-1 text-[#9aa1b0]">
                <GitBranch className="h-3 w-3 text-[#626875]" />
                <span className="truncate max-w-[160px]">{issue.branch}</span>
              </span>
              <span>&bull;</span>
              <span>
                Stage:{" "}
                <span className="text-[#9aa1b0]">
                  {activeTimelineStep?.stage}
                </span>
              </span>
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
            </div>
          )}
        </div>
      </div>

      {/* Right section: Status, Priority, Link */}
      <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
        <StatusBadge status={issue.status} />
        <PriorityBadge priority={issue.priority} />

        <Link
          href={`/issues/${issue.id}`}
          className="rounded border border-[#22252e] bg-[#171920] p-1.5 text-[#626875] group-hover:border-[#2f333f] group-hover:text-[#f0f2f5] transition-colors"
          title={`View investigation ${issue.id}`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
