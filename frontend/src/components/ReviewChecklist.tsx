import React from "react";
import { ReviewData } from "@/mock/types";
import { CheckCircle2, Shield } from "lucide-react";
import { Badge } from "./Badge";

interface ReviewChecklistProps {
  review: ReviewData;
}

export function ReviewChecklist({ review }: ReviewChecklistProps) {
  return (
    <div className="space-y-4">
      {/* Reviewer Score & Recommendation banner */}
      <div className="rounded border border-[#22252e] bg-[#13151a] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22252e] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[#f0f2f5]">
              {review.reviewerName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#9aa1b0]">Quality Score:</span>
              <span className="font-bold text-emerald-400">
                {review.overallScore}/100
              </span>
            </div>
            <Badge variant="success">Recommendation: {review.recommendation}</Badge>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#cbd0dc] leading-relaxed">
          {review.automatedSummary}
        </p>
      </div>

      {/* Review audit items */}
      <div className="space-y-2.5">
        {review.checks.map((check, idx) => {
          return (
            <div
              key={idx}
              className="rounded border border-[#22252e] bg-[#13151a] p-3.5 transition-colors hover:border-[#2d313d]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-[#f0f2f5]">
                    {check.title}
                  </span>
                </div>
                <Badge variant="neutral">{check.category}</Badge>
              </div>

              <p className="mt-2 text-xs text-[#9aa1b0] leading-relaxed pl-6">
                {check.details}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
