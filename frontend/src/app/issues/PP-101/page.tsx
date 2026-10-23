import React, { Suspense } from "react";
import { IssueDetailClient } from "@/components/IssueDetailClient";

export default function PP101Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center font-mono text-xs text-[#9aa1b0]">
          Loading investigation PP-101...
        </div>
      }
    >
      <IssueDetailClient issueId="PP-101" />
    </Suspense>
  );
}
