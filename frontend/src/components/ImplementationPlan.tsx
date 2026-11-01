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
            className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-4 transition-colors hover:border-[#171916]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-2xs bg-[#C6F36B] font-mono text-[11px] font-bold text-[#171916] border border-[#AEE64E]">
                  {step.stepNumber}
                </span>
                <h4 className="text-xs font-bold text-[#171916]">
                  {step.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#777D71] bg-[#E8EAE3] border border-[#DADDD3] px-2 py-0.5 rounded-2xs">
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

            <p className="mt-2 text-xs text-[#777D71] leading-relaxed">
              {step.description}
            </p>

            <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-[#777D71] pt-2 border-t border-[#DADDD3]">
              <FileCode2 className="h-3.5 w-3.5 text-[#171916]" />
              <span className="text-[#171916] font-semibold">{step.targetFile}</span>
              <span>•</span>
              <span className="capitalize text-[#777D71]">
                Action: {step.action}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
