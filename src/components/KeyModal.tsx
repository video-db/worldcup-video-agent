"use client";

type KeyModalProps = {
  tfKey: string;
  vdbKey: string;
  onTfKeyChange: (value: string) => void;
  onVdbKeyChange: (value: string) => void;
  onSave: () => void;
  validating: boolean;
  error: string;
  onClose: () => void;
};

export default function KeyModal({
  tfKey,
  vdbKey,
  onTfKeyChange,
  onVdbKeyChange,
  onSave,
  validating,
  error,
  onClose,
}: KeyModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-[18px] backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-[430px] rounded-[20px] border border-white/10 bg-[#161616] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="key-modal-title" className="text-[19px] font-bold tracking-[-0.01em] text-white">Add your API keys</h2>
            <p className="mt-[7px] text-[13px] leading-relaxed text-white/55">
              Stored in your browser only. Never sent to our servers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={validating}
            aria-label="Close"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-full border-0 bg-white/[0.06] text-[15px] text-white/55 hover:text-white/80 disabled:opacity-50"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {error ? (
          <div className="animate-rise mt-4 rounded-[11px] border border-[#E5484D]/40 bg-[#E5484D]/10 px-[13px] py-[11px] text-[13px] text-[#E5484D]">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <div className="mb-[7px] flex items-center justify-between">
              <label htmlFor="tf-key" className="ds-field-label ds-field-label--on-dark">TinyFish API key</label>
              <a
                href="https://agent.tinyfish.ai/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-[#F24E1E] no-underline hover:underline"
              >
                Get a key →
              </a>
            </div>
            <input
              id="tf-key"
              type="password"
              value={tfKey}
              onChange={(e) => onTfKeyChange(e.target.value)}
              placeholder="tf-..."
              autoComplete="off"
              disabled={validating}
              className="ds-input ds-input--dark w-full disabled:opacity-50"
            />
          </div>
          <div>
            <div className="mb-[7px] flex items-center justify-between">
              <label htmlFor="vdb-key" className="ds-field-label ds-field-label--on-dark">VideoDB API key</label>
              <a
                href="https://console.videodb.io"
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-[#F24E1E] no-underline hover:underline"
              >
                Get a key →
              </a>
            </div>
            <input
              id="vdb-key"
              type="password"
              value={vdbKey}
              onChange={(e) => onVdbKeyChange(e.target.value)}
              placeholder="vdb-..."
              autoComplete="off"
              disabled={validating}
              className="ds-input ds-input--dark w-full disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-[22px] flex gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            disabled={validating}
            className="ds-btn ds-btn--ghost-dark shrink-0 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={validating || !tfKey.trim() || !vdbKey.trim()}
            className="ds-btn ds-btn--primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {validating ? "Checking keys..." : "Save keys"}
          </button>
        </div>
      </div>
    </div>
  );
}
