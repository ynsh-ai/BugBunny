import React from "react";
import { ReviewData } from "@/mock/types";
import { CheckCircle2, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "./Badge";

interface ReviewChecklistProps {
  review: ReviewData;
}

export function ReviewChecklist({ review }: ReviewChecklistProps) {
  if (!review) {
    return (
      <div className="p-8 text-center text-xs text-[#8b949e]">
        No review audit data available for this investigation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reviewer Score & Recommendation banner */}
      <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-[#f0f6fc]">
              {review.reviewerName || "Code Reviewer Agent"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {review.overallScore > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-[#8b949e]">Quality Score:</span>
                <span className="font-bold text-emerald-400">
                  {review.overallScore}/100
                </span>
              </div>
            )}
            <Badge variant={review.recommendation === "Approve" ? "success" : "warning"}>
              Recommendation: {review.recommendation}
            </Badge>
          </div>
        </div>

        {review.automatedSummary && (
          <p className="mt-3 text-xs text-[#c9d1d9] leading-relaxed">
            {review.automatedSummary}
          </p>
        )}
      </div>

      {/* Review audit items */}
      {review.checks && review.checks.length > 0 && (
        <div className="space-y-2.5">
          {review.checks.map((check, idx) => {
            return (
              <div
                key={idx}
                className="rounded-lg border border-[#30363d] bg-[#161b22] p-3.5 transition-colors hover:border-[#383d4a]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {check.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-[#f0f2f5]">
                      {check.title}
                    </span>
                  </div>
                  {check.category && <Badge variant="neutral">{check.category}</Badge>}
                </div>

                {check.details && (
                  <p className="mt-2 text-xs text-[#8b949e] leading-relaxed pl-6">
                    {check.details}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
