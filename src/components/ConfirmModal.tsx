"use client";

import type { ReactNode } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-[380px] rounded-t-2xl bg-white px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(32,32,31,0.18)] sm:rounded-[18px] sm:pb-6 sm:shadow-[0_1px_2px_rgba(32,32,31,0.06),0_20px_48px_rgba(32,32,31,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="mb-3 text-[16px] font-semibold text-[#1f1f1e]">{title}</h3>
        <div className="mb-6 text-[13px] leading-relaxed text-[#625d55]">{children}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:border-[#FECB8B] hover:text-[#20201f] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-full px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              danger
                ? "bg-[#b14a3e] hover:bg-[#9a3d33]"
                : "bg-[#FF6700] hover:bg-[#e35c00]"
            }`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
