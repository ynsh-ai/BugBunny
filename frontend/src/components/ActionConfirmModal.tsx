"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, X, AlertCircle } from "lucide-react";

interface ActionConfirmModalProps {
  isOpen: boolean;
  type: "approve" | "reject";
  issueId: string;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function ActionConfirmModal({
  isOpen,
  type,
  issueId,
  onClose,
  onConfirm,
}: ActionConfirmModalProps) {
  const [note, setNote] = useState("");
  const isApprove = type === "approve";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-[#2b2f3a] bg-[#14161c] p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22252e] pb-3">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <h3 className="text-sm font-semibold text-[#f0f2f5]">
              {isApprove
                ? `Approve Investigation ${issueId}`
                : `Reject Investigation ${issueId}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#626875] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-3 text-xs text-[#9aa1b0] leading-relaxed">
          {isApprove ? (
            <p>
              This will approve the proposed implementation plan and mark the
              code diff as ready for pull request synthesis into{" "}
              <code className="text-emerald-300 font-mono">
                demo-ecommerce-app:main
              </code>
              .
            </p>
          ) : (
            <p>
              This will reject the current agent-generated solution and flag the
              issue for human review or re-investigation with adjusted
              constraints.
            </p>
          )}

          <div className="mt-4">
            <label className="block text-[11px] font-mono font-medium text-[#f0f2f5] mb-1.5">
              Reviewer Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isApprove
                  ? "LGTM. Verified concurrency tests and row-locking logic."
                  : "Need to preserve backwards compatibility for legacy avatar format."
              }
              className="w-full rounded border border-[#262a34] bg-[#0c0d10] p-2.5 text-xs text-[#f0f2f5] placeholder-[#555b68] focus:border-[#424858] focus:outline-none font-mono"
            />
          </div>

          <div className="mt-3 flex items-start gap-2 rounded border border-[#22252e] bg-[#0f1115] p-2.5 text-[11px] text-[#626875]">
            <AlertCircle className="h-3.5 w-3.5 text-[#9aa1b0] shrink-0 mt-0.5" />
            <span>
              Mock mode active: This action updates frontend review state only.
              No live GitHub pull request is opened.
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#22252e] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#262a34] bg-[#1a1c22] px-3 py-1.5 text-xs font-medium text-[#9aa1b0] hover:text-[#f0f2f5] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            className={`rounded px-3.5 py-1.5 text-xs font-semibold text-white transition-colors ${
              isApprove
                ? "bg-emerald-700 hover:bg-emerald-600 border border-emerald-600/70"
                : "bg-rose-700 hover:bg-rose-600 border border-rose-600/70"
            }`}
          >
            {isApprove ? "Confirm Approval" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
