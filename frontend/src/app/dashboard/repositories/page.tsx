"use client";

import React from "react";
import Link from "next/link";

export default function RepositoriesPage() {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-bold mb-4">Repositories</h1>
      <p className="mb-4">No repositories connected yet.</p>
      <Link href="/dashboard" className="text-blue-600 underline">
        ← Back to Dashboard
      </Link>
    </section>
  );
}
