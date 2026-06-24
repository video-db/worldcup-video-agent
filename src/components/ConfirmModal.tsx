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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-[380px] rounded-t-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(0,0,0,0.5)] sm:rounded-[18px] sm:pb-6 sm:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_20px_48px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="mb-3 text-[16px] font-semibold text-[var(--c-text)]">{title}</h3>
        <div className="mb-6 text-[13px] leading-relaxed text-[var(--c-text-muted)]">{children}</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="ds-btn ds-btn--ghost-dark disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`ds-btn flex-1 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
              danger ? "ds-btn--danger" : "ds-btn--primary"
            }`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
