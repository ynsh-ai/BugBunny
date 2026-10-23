import React from "react";
import { PlanStep } from "@/mock/types";
import { FileCode2 } from "lucide-react";
import { Badge } from "./Badge";

interface ImplementationPlanProps {
  steps: PlanStep[];
}

export function ImplementationPlan({ steps }: ImplementationPlanProps) {
  return (
    <div className="space-y-3">
      {steps.map((step) => {
        return (
          <div
            key={step.stepNumber}
            className="rounded border border-[#22252e] bg-[#13151a] p-3.5 transition-colors hover:border-[#2d313d]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1d2027] font-mono text-[11px] font-bold text-emerald-400 border border-[#2b2f3a]">
                  {step.stepNumber}
                </span>
                <h4 className="text-xs font-semibold text-[#f0f2f5]">
                  {step.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#9aa1b0] bg-[#1a1c22] border border-[#262933] px-2 py-0.5 rounded">
                  Risk: {step.risk}
                </span>

                <Badge
                  variant={
                    step.status === "verified"
                      ? "success"
                      : step.status === "applied"
                      ? "info"
                      : "neutral"
                  }
                >
                  {step.status}
                </Badge>
              </div>
            </div>

            <p className="mt-2 text-xs text-[#9aa1b0] leading-relaxed">
              {step.description}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-[#626875]">
              <FileCode2 className="h-3.5 w-3.5 text-[#9aa1b0]" />
              <span className="text-[#f0f2f5]">{step.targetFile}</span>
              <span>&bull;</span>
              <span className="capitalize text-[#9aa1b0]">
                Action: {step.action}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
