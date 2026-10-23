import React from "react";
import { TestResultData } from "@/mock/types";
import { CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "./Badge";

interface TestResultsViewerProps {
  testResults: TestResultData;
}

export function TestResultsViewer({ testResults }: TestResultsViewerProps) {
  return (
    <div className="space-y-4">
      {/* Test summary header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded border border-[#22252e] bg-[#13151a] p-3">
          <div className="text-[11px] text-[#9aa1b0]">Total Executed</div>
          <div className="mt-1 font-mono text-lg font-bold text-white">
            {testResults.totalTests} tests
          </div>
          <div className="text-[10px] text-[#626875] font-mono">
            {testResults.passed} passed &bull; {testResults.failed} failed
          </div>
        </div>

        <div className="rounded border border-[#22252e] bg-[#13151a] p-3">
          <div className="text-[11px] text-[#9aa1b0]">Execution Runtime</div>
          <div className="mt-1 font-mono text-lg font-bold text-white">
            {testResults.durationSeconds}s
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            Sandbox container runtime
          </div>
        </div>

        <div className="rounded border border-[#22252e] bg-[#13151a] p-3">
          <div className="text-[11px] text-[#9aa1b0]">Code Coverage</div>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {testResults.coverage.after}%
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            +{testResults.coverage.delta}% from baseline
          </div>
        </div>

        <div className="rounded border border-[#22252e] bg-[#13151a] p-3">
          <div className="text-[11px] text-[#9aa1b0]">Regression Status</div>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
            0 Regressions
          </div>
          <div className="text-[10px] text-[#626875] font-mono">
            100% assertions verified
          </div>
        </div>
      </div>

      {/* Test cases list */}
      <div className="rounded border border-[#22252e] bg-[#13151a] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#22252e] bg-[#16181f] px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-[#f0f2f5]">
              {testResults.suiteName}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#9aa1b0]">
            All {testResults.testCases.length} assertions passed
          </div>
        </div>

        <div className="divide-y divide-[#1d2028]">
          {testResults.testCases.map((tc) => (
            <div
              key={tc.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs hover:bg-[#161820] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs font-medium text-[#f0f2f5] truncate">
                  {tc.name}
                </span>
                {tc.isNewRegressionTest && (
                  <Badge variant="purple">new regression</Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px] font-mono text-[#626875]">
                <span className="truncate max-w-[200px] text-[#9aa1b0]">
                  {tc.file}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {tc.durationMs}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
