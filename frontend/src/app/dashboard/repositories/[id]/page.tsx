import React, { Suspense } from "react";
import { RepositoryDetailClient } from "@/components/RepositoryDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function RepositoryDetailWrapper({ params }: PageProps) {
  const { id } = await params;
  return <RepositoryDetailClient repositoryId={id} />;
}

export default function DashboardRepositoryDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 text-center font-mono text-xs text-[#777D71]">
          Loading repository workspace...
        </div>
      }
    >
      <RepositoryDetailWrapper params={params} />
    </Suspense>
  );
}
