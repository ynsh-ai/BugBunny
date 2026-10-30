import React, { Suspense } from "react";
import { IssueDetailClient } from "@/components/IssueDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function IssueDetailWrapper({ params }: PageProps) {
  const { id } = await params;
  return <IssueDetailClient issueId={id} />;
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center font-mono text-xs text-[#8b949e]">
          Loading investigation...
        </div>
      }
    >
      <IssueDetailWrapper params={params} />
    </Suspense>
  );
}
