import React, { Suspense } from "react";
import { IssueDetailClient } from "@/components/IssueDetailClient";
import { MOCK_ISSUES_LIST } from "@/mock/issues-data";

export function generateStaticParams() {
  return MOCK_ISSUES_LIST.map((issue) => ({
    id: issue.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center font-mono text-xs text-[#9aa1b0]">
          Loading investigation {id}...
        </div>
      }
    >
      <IssueDetailClient issueId={id} />
    </Suspense>
  );
}
