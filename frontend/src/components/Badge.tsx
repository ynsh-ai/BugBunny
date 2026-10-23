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

  const variantClasses = {
    default:
      "bg-neutral-800/80 text-neutral-300 border border-neutral-700/60",
    success:
      "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60",
    warning:
      "bg-amber-950/60 text-amber-300 border border-amber-800/60",
    info:
      "bg-sky-950/60 text-sky-300 border border-sky-800/60",
    purple:
      "bg-purple-950/60 text-purple-300 border border-purple-800/60",
    danger:
      "bg-rose-950/60 text-rose-300 border border-rose-800/60",
    neutral:
      "bg-neutral-900 text-neutral-400 border border-neutral-800",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  switch (status) {
    case "Investigation complete":
    case "Approved":
      return <Badge variant="success">{status}</Badge>;
    case "In progress":
    case "Queued":
      return <Badge variant="warning">{status}</Badge>;
    case "Testing":
      return <Badge variant="info">{status}</Badge>;
    case "Review required":
      return <Badge variant="purple">{status}</Badge>;
    case "Failed":
    case "Rejected":
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
