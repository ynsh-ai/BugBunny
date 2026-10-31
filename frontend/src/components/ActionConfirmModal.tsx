"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, X, AlertCircle } from "lucide-react";

interface ActionConfirmModalProps {
  isOpen: boolean;
  type: "approve" | "reject";
  issueId: string;
  repositoryName?: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function ActionConfirmModal({
  isOpen,
  type,
  issueId,
  repositoryName,
  onClose,
  onConfirm,
}: ActionConfirmModalProps) {
  const [note, setNote] = useState("");
  const isApprove = type === "approve";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-[#30363d] bg-[#161b22] p-5 shadow-2xl text-[#c9d1d9]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <h3 className="text-sm font-semibold text-[#f0f6fc]">
              {isApprove
                ? `Approve Investigation ${issueId}`
                : `Reject Investigation ${issueId}`}
              {repositoryName && (
                <span className="ml-1.5 text-xs font-normal text-[#8b949e]">
                  ({repositoryName})
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-3 text-xs text-[#9aa1b0] leading-relaxed space-y-3">
          {isApprove ? (
            <div className="space-y-2">
              <p className="font-semibold text-[#f0f2f5]">
                Approve this implementation proposal?
              </p>
              <p className="text-xs text-[#9aa1b0]">
                BugBunny will record your approval. It will not modify your repository
                or create a pull request unless you explicitly choose a future export action.
              </p>
            </div>
          ) : (
            <p>
              This will reject the current agent-generated solution and record your feedback in the investigation audit trail.
            </p>
          )}

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#c9d1d9] mb-1.5">
              Reviewer Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isApprove
                  ? "LGTM. Verified patch diff and test execution."
                  : "Needs revision or adjusted constraints."
              }
              className="w-full rounded-md border border-[#30363d] bg-[#0d1117] p-2.5 text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:border-[#58a6ff] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-start gap-2 rounded-md border border-[#30363d] bg-[#0d1117] p-2.5 text-[11px] text-[#8b949e]">
            <AlertCircle className="h-3.5 w-3.5 text-[#8b949e] shrink-0 mt-0.5" />
            <span>
              Approval transitions the audit record state to <strong>approved_for_export</strong>.
              Patches remain immutable artifacts; no code is applied directly to remote repositories.
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#30363d] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#30363d] bg-[#21262d] px-3 py-1.5 text-xs font-medium text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold text-white transition-colors ${
              isApprove
                ? "bg-[#238636] hover:bg-[#2ea043] border border-[#2ea043]"
                : "bg-rose-700 hover:bg-rose-600 border border-rose-600"
            }`}
          >
            {isApprove ? "Confirm Approval" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
