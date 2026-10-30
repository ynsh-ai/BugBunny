import React from "react";
import { TestResultData } from "@/mock/types";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "./Badge";

interface TestResultsViewerProps {
  testResults: TestResultData;
}

export function TestResultsViewer({ testResults }: TestResultsViewerProps) {
  if (!testResults) {
    return (
      <div className="p-8 text-center text-xs text-[#8b949e]">
        No test results recorded for this investigation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Test summary header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <div className="text-[11px] text-[#8b949e]">Total Executed</div>
          <div className="mt-1 font-mono text-lg font-bold text-[#f0f6fc]">
            {testResults.totalTests} tests
          </div>
          <div className="text-[10px] text-[#8b949e] font-mono">
            {testResults.passed} passed &bull; {testResults.failed} failed
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <div className="text-[11px] text-[#8b949e]">Execution Runtime</div>
          <div className="mt-1 font-mono text-lg font-bold text-[#f0f6fc]">
            {testResults.durationSeconds ? `${testResults.durationSeconds}s` : "—"}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {testResults.failed === 0 ? "All assertions verified" : "Failures detected"}
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <div className="text-[11px] text-[#8b949e]">Passed Tests</div>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-400">
            {testResults.passed}
          </div>
          <div className="text-[10px] text-[#8b949e] font-mono">
            {testResults.skipped} skipped
          </div>
        </div>

        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-3">
          <div className="text-[11px] text-[#8b949e]">Test Framework</div>
          <div className="mt-1 font-mono text-sm font-semibold text-[#f0f6fc] truncate">
            {testResults.suiteName || "Pytest"}
          </div>
          <div className="text-[10px] text-[#8b949e] font-mono">
            Automated execution
          </div>
        </div>
      </div>

      {/* Test cases list */}
      {testResults.testCases && testResults.testCases.length > 0 && (
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#30363d] bg-[#161b22] px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-[#f0f6fc]">
                {testResults.suiteName}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#8b949e]">
              {testResults.testCases.length} case{testResults.testCases.length === 1 ? "" : "s"} reported
            </div>
          </div>

          <div className="divide-y divide-[#21262d]">
            {testResults.testCases.map((tc) => (
              <div
                key={tc.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs hover:bg-[#21262d]/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {tc.status === "passed" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  )}
                  <span className="font-mono text-xs font-medium text-[#f0f6fc] truncate">
                    {tc.name}
                  </span>
                  {tc.isNewRegressionTest && (
                    <Badge variant="purple">regression test</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-[#8b949e]">
                  <span className="truncate max-w-[200px] text-[#8b949e]">
                    {tc.file}
                  </span>
                  {tc.durationMs > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tc.durationMs}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
