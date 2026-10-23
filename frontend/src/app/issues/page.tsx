"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_ISSUES_LIST } from "@/mock/issues-data";
import { IssueRow } from "@/components/IssueRow";
import { Search, ArrowRight } from "lucide-react";

export default function IssuesListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repoFilter, setRepoFilter] = useState<string>("all");

  const repos = Array.from(new Set(MOCK_ISSUES_LIST.map((i) => i.repository)));

  const filteredIssues = MOCK_ISSUES_LIST.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.repository.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "complete"
        ? issue.status === "Investigation complete"
        : statusFilter === "in_progress"
        ? issue.status === "In progress" || issue.status === "Testing"
        : statusFilter === "review"
        ? issue.status === "Review required"
        : true;

    const matchesRepo =
      repoFilter === "all" ? true : issue.repository === repoFilter;

    return matchesSearch && matchesStatus && matchesRepo;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22252e] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-[#f0f2f5]">
              Issue Investigations
            </h1>
            <span className="rounded bg-[#1d2027] px-2 py-0.5 font-mono text-xs text-[#9aa1b0] border border-[#2b2f3a]">
              {filteredIssues.length} of {MOCK_ISSUES_LIST.length} total
            </span>
          </div>
          <p className="mt-1 text-xs text-[#9aa1b0]">
            Browse automated investigation runs, root-cause analyses, and
            implementation patches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/issues/PP-101"
            className="flex items-center gap-2 rounded border border-emerald-800/80 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 transition-colors"
          >
            <span>Featured Case: PP-101</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded border border-[#22252e] bg-[#13151a] p-3 space-y-3">
        {/* Top Controls: Search and Repo Selector */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#626875]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by issue title, ID (e.g. PP-101), or repository..."
              className="w-full rounded border border-[#22252e] bg-[#0d0e12] py-1.5 pl-9 pr-3 text-xs text-[#f0f2f5] placeholder-[#555b68] focus:border-[#383d4a] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#626875] text-[11px] font-mono">
              Repository:
            </span>
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="rounded border border-[#262933] bg-[#1a1c23] px-2.5 py-1.5 text-xs font-mono text-[#f0f2f5] focus:outline-none focus:border-[#383d4a]"
            >
              <option value="all">all repositories</option>
              {repos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filter bar */}
        <div className="flex flex-wrap items-center gap-1 border-t border-[#1f2229] pt-2 text-xs">
          {[
            { id: "all", label: "All Issues", count: MOCK_ISSUES_LIST.length },
            {
              id: "complete",
              label: "Investigation Complete",
              count: MOCK_ISSUES_LIST.filter(
                (i) => i.status === "Investigation complete"
              ).length,
            },
            {
              id: "in_progress",
              label: "Active Pipeline",
              count: MOCK_ISSUES_LIST.filter(
                (i) => i.status === "In progress" || i.status === "Testing"
              ).length,
            },
            {
              id: "review",
              label: "Review Required",
              count: MOCK_ISSUES_LIST.filter(
                (i) => i.status === "Review required"
              ).length,
            },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#1d2027] text-white"
                    : "text-[#9aa1b0] hover:bg-[#181a21] hover:text-[#f0f2f5]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded bg-[#252832] px-1.5 py-0.2 font-mono text-[10px] text-[#9aa1b0]">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Issues Table List */}
      <div className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#626875] font-mono">
            No issues match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-[#1f2229]">
            {filteredIssues.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
