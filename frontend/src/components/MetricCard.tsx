import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning";
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  badge,
  badgeVariant = "default",
}: MetricCardProps) {
  const badgeClasses = {
    default: "bg-[#22252e] text-[#9aa1b0]",
    success: "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50",
    warning: "bg-amber-950/70 text-amber-300 border border-amber-800/50",
  }[badgeVariant];

  return (
    <div className="rounded border border-[#22252e] bg-[#13151a] p-3.5 transition-colors hover:border-[#2d313d]">
      <div className="flex items-center justify-between text-xs text-[#9aa1b0]">
        <span className="font-medium">{label}</span>
        {icon && <span className="text-[#626875]">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xl font-bold font-mono tracking-tight text-[#f0f2f5]">
          {value}
        </span>
        {badge && (
          <span
            className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-medium ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-[11px] text-[#626875] leading-tight">
          {subtext}
        </p>
      )}
    </div>
  );
}
