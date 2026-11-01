import React from "react";
import { IssueStatus } from "@/mock/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "info"
    | "purple"
    | "danger"
    | "lime"
    | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] leading-tight"
      : "px-2.5 py-1 text-xs leading-normal";

  // Uses the Greptile-inspired status palette
  const variantClasses = {
    default:
      "bg-[#E8EAE3] text-[#171916] border border-[#DADDD3]",
    success:
      "bg-[#35A56A]/12 text-[#227247] border border-[#35A56A]/35",
    warning:
      "bg-[#D99A37]/15 text-[#9E6A1B] border border-[#D99A37]/40",
    info:
      "bg-[#6388D9]/12 text-[#3D5F9E] border border-[#6388D9]/35",
    purple:
      "bg-[#756CF5]/12 text-[#4C43C7] border border-[#756CF5]/35",
    danger:
      "bg-[#D65B56]/12 text-[#B33833] border border-[#D65B56]/35",
    lime:
      "bg-[#C6F36B]/35 text-[#171916] border border-[#AEE64E] font-semibold",
    neutral:
      "bg-[#E8EAE3] text-[#777D71] border border-[#DADDD3]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded-xs ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: IssueStatus | string }) {
  switch (status) {
    case "Investigation complete":
    case "Approved":
    case "approved_for_export":
      return <Badge variant="success">{status}</Badge>;
    case "In progress":
    case "in_progress":
    case "Queued":
      return <Badge variant="warning">{status}</Badge>;
    case "Testing":
      return <Badge variant="info">{status}</Badge>;
    case "Review required":
    case "awaiting_approval":
      return <Badge variant="lime">{status}</Badge>;
    case "Failed":
    case "Rejected":
    case "rejected":
      return <Badge variant="danger">{status}</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function PriorityBadge({
  priority,
}: {
  priority: "critical" | "high" | "medium" | "low";
}) {
  switch (priority) {
    case "critical":
      return <Badge variant="danger">critical</Badge>;
    case "high":
      return <Badge variant="warning">high</Badge>;
    case "medium":
      return <Badge variant="neutral">medium</Badge>;
    case "low":
      return <Badge variant="neutral">low</Badge>;
  }
}

export function SourceBadge({ mode }: { mode?: string }) {
  if (mode === "connected_read_only") {
    return (
      <Badge variant="info">
        <span className="h-1.5 w-1.5 rounded-full bg-[#6388D9]" />
        <span>github:read-only</span>
      </Badge>
    );
  }
  return (
    <Badge variant="neutral">
      <span>demo</span>
    </Badge>
  );
}
