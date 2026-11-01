import React from "react";
import { ReviewData } from "@/mock/types";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";

interface ReviewChecklistProps {
  review: ReviewData;
}

export function ReviewChecklist({ review }: ReviewChecklistProps) {
  if (!review) {
    return (
      <div className="p-8 text-center text-xs text-[#777D71]">
        No review audit data available for this investigation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reviewer Score & Recommendation banner */}
      <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DADDD3] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#35A56A]" />
            <span className="text-xs font-bold text-[#171916]">
              {review.reviewerName || "Code Reviewer Agent"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {review.overallScore > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-[#777D71]">Quality Score:</span>
                <span className="font-bold text-[#171916] bg-[#C6F36B] px-2 py-0.5 rounded-2xs border border-[#AEE64E]">
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
          <p className="mt-3 text-xs text-[#777D71] leading-relaxed">
            {review.automatedSummary}
          </p>
        )}
      </div>

      {/* Review audit items */}
      {review.checks && review.checks.length > 0 && (
        <div className="space-y-2.5">
          {review.checks.map((check, idx) => {
            const isPass = check.status === "pass";

            return (
              <div
                key={idx}
                className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] p-3.5 transition-colors hover:border-[#171916]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isPass ? (
                      <CheckCircle2 className="h-4 w-4 text-[#35A56A]" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-[#D99A37]" />
                    )}
                    <span className="text-xs font-bold text-[#171916]">
                      {check.title}
                    </span>
                  </div>

                  <Badge variant={isPass ? "success" : "warning"}>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>

                {check.details && (
                  <p className="mt-1.5 text-xs text-[#777D71] leading-relaxed">
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
