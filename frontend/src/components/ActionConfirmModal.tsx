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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xs border border-[#3A4037] bg-[#1F221E] p-6 shadow-2xl text-[#F5F5F0]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#3A4037] pb-3.5">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle2 className="h-5 w-5 text-[#C6F36B]" />
            ) : (
              <XCircle className="h-5 w-5 text-[#D65B56]" />
            )}
            <h3 className="text-sm font-bold text-[#F5F5F0]">
              {isApprove
                ? `Approve Investigation ${issueId}`
                : `Reject Investigation ${issueId}`}
              {repositoryName && (
                <span className="ml-1.5 text-xs font-mono font-normal text-[#9BA095]">
                  ({repositoryName})
                </span>
              )}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xs p-1 text-[#9BA095] hover:text-[#F5F5F0] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 text-xs text-[#9BA095] leading-relaxed space-y-3.5">
          {isApprove ? (
            <div className="space-y-2">
              <p className="font-bold text-[#F5F5F0] text-sm">
                Approve this implementation proposal?
              </p>
              <p className="text-xs text-[#9BA095] leading-relaxed">
                BugBunny will record your approval. It will not modify your repository
                or create a pull request unless you explicitly choose a future export action.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#9BA095] leading-relaxed">
              This will reject the current agent-generated solution and record your feedback in the investigation audit trail.
            </p>
          )}

          <div>
            <label className="block text-[11px] font-mono font-bold text-[#F5F5F0] mb-1.5 uppercase tracking-wider">
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
              className="w-full rounded-xs border border-[#3A4037] bg-[#141613] p-2.5 text-xs text-[#F5F5F0] placeholder-[#777D71] focus:border-[#C6F36B] focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-start gap-2 rounded-xs border border-[#3A4037] bg-[#141613] p-3 text-[11px] text-[#9BA095]">
            <AlertCircle className="h-4 w-4 text-[#C6F36B] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Approval transitions the audit record state to <strong>approved_for_export</strong>.
              Patches remain immutable artifacts; no code is applied directly to remote repositories.
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#3A4037] pt-4 font-mono">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xs border border-[#3A4037] bg-[#292D27] px-3.5 py-2 text-xs font-medium text-[#F5F5F0] hover:bg-[#3A4037] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note)}
            className={`rounded-xs px-4 py-2 text-xs font-bold transition-all shadow-xs ${
              isApprove
                ? "bg-[#C6F36B] hover:bg-[#B5E856] text-[#171916] border border-[#AEE64E]"
                : "bg-[#D65B56] hover:bg-[#B33833] text-white border border-[#D65B56]"
            }`}
          >
            {isApprove ? "Confirm Approval" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
