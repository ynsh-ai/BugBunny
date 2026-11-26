import React, { Suspense } from "react";
import { InvestigationDetailClient } from "@/components/InvestigationDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function InvestigationDetailWrapper({ params }: PageProps) {
  const { id } = await params;
  return <InvestigationDetailClient investigationId={id} />;
}

export default function DashboardInvestigationDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center font-mono text-xs text-[#777D71]">
          Loading investigation workspace...
        </div>
      }
    >
      <InvestigationDetailWrapper params={params} />
    </Suspense>
  );
}
