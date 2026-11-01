import React from "react";
import { TestResultData } from "@/mock/types";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "./Badge";

interface TestResultsViewerProps {
  testResults: TestResultData;
}

export function TestResultsViewer({ testResults }: TestResultsViewerProps) {
  if (!testResults) {
    return (
      <div className="p-8 text-center text-xs text-[#777D71]">
        No test results recorded for this investigation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Test summary header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
          <div className="text-[11px] font-mono text-[#777D71] uppercase tracking-wider">Total Tests</div>
          <div className="font-mono text-lg font-bold text-[#171916]">
            {testResults.totalTests} tests
          </div>
          <div className="text-[10px] text-[#777D71] font-mono">
            {testResults.passed} passed • {testResults.failed} failed
          </div>
        </div>

        <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
          <div className="text-[11px] font-mono text-[#777D71] uppercase tracking-wider">Runtime</div>
          <div className="font-mono text-lg font-bold text-[#171916]">
            {testResults.durationSeconds ? `${testResults.durationSeconds}s` : "—"}
          </div>
          <div className="text-[10px] text-[#35A56A] font-mono font-semibold">
            {testResults.failed === 0 ? "All assertions verified" : "Failures detected"}
          </div>
        </div>

        <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
          <div className="text-[11px] font-mono text-[#777D71] uppercase tracking-wider">Passed</div>
          <div className="font-mono text-lg font-bold text-[#35A56A]">
            {testResults.passed}
          </div>
          <div className="text-[10px] text-[#777D71] font-mono">
            {testResults.skipped} skipped
          </div>
        </div>

        <div className="rounded-xs border border-[#DADDD3] bg-[#E8EAE3] p-3 space-y-1">
          <div className="text-[11px] font-mono text-[#777D71] uppercase tracking-wider">Framework</div>
          <div className="font-mono text-sm font-bold text-[#171916] truncate">
            {testResults.suiteName || "Pytest"}
          </div>
          <div className="text-[10px] text-[#777D71] font-mono">
            Automated test suite
          </div>
        </div>
      </div>

      {/* Test Cases List */}
      {testResults.testCases && testResults.testCases.length > 0 && (
        <div className="rounded-xs border border-[#DADDD3] bg-[#FFFFFF] overflow-hidden">
          <div className="border-b border-[#DADDD3] bg-[#E8EAE3] px-3.5 py-2 text-xs font-mono font-bold text-[#171916]">
            Detailed Assertions ({testResults.testCases.length})
          </div>
          <div className="divide-y divide-[#DADDD3]">
            {testResults.testCases.map((tc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 text-xs font-mono hover:bg-[#F5F5F0] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {tc.status === "passed" ? (
                    <CheckCircle2 className="h-4 w-4 text-[#35A56A]" />
                  ) : (
                    <XCircle className="h-4 w-4 text-[#D65B56]" />
                  )}
                  <span className="font-medium text-[#171916]">{tc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {tc.durationMs && (
                    <span className="text-[11px] text-[#777D71]">
                      {tc.durationMs}ms
                    </span>
                  )}
                  <Badge variant={tc.status === "passed" ? "success" : "danger"}>
                    {tc.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
