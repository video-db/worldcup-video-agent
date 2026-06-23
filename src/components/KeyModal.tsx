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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,20,19,0.42)] p-[18px] backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className="animate-rise w-full max-w-[430px] rounded-[20px] bg-white p-6 shadow-[0_24px_60px_rgba(20,20,19,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="key-modal-title" className="text-[19px] font-bold tracking-[-0.01em] text-[#1f1f1e]">Add your API keys</h2>
            <p className="mt-[7px] text-[13px] leading-relaxed text-[#8a857c]">
              Stored in your browser only. Never sent to our servers.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={validating}
            aria-label="Close"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-full border-0 bg-[#f3f1ea] text-[15px] text-[#8a857c] hover:text-[#625d55] disabled:opacity-50"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {error ? (
          <div className="animate-rise mt-4 rounded-[11px] border border-[#fecaca] bg-[#fef2f2] px-[13px] py-[11px] text-[13px] text-[#dc2626]">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <div className="mb-[7px] flex items-center justify-between">
              <label htmlFor="tf-key" className="text-[12.5px] font-semibold text-[#3f3a32]">TinyFish API key</label>
              <a
                href="https://agent.tinyfish.ai/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-[#ff6700] no-underline hover:underline"
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
              className="w-full rounded-[11px] border border-[#e8e4db] bg-white px-[13px] py-[11px] text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#fecb8b] focus-visible:ring-2 focus-visible:ring-[#ff6700]/40 focus-visible:ring-offset-1 disabled:opacity-50"
            />
          </div>
          <div>
            <div className="mb-[7px] flex items-center justify-between">
              <label htmlFor="vdb-key" className="text-[12.5px] font-semibold text-[#3f3a32]">VideoDB API key</label>
              <a
                href="https://console.videodb.io"
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-[#ff6700] no-underline hover:underline"
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
              className="w-full rounded-[11px] border border-[#e8e4db] bg-white px-[13px] py-[11px] text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#fecb8b] focus-visible:ring-2 focus-visible:ring-[#ff6700]/40 focus-visible:ring-offset-1 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="mt-[22px] flex gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            disabled={validating}
            className="shrink-0 rounded-[11px] border border-[#ece9e1] bg-white px-[18px] py-[11px] text-[13.5px] font-semibold text-[#5c574e] transition-all duration-200 hover:border-[#fecb8b] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={validating || !tfKey.trim() || !vdbKey.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#FF6700] px-[18px] py-[11px] text-[13.5px] font-bold text-white shadow-[0_2px_10px_rgba(255,103,0,0.24)] transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E9E9DC] disabled:text-[#a8a399] disabled:shadow-none"
          >
            {validating ? "Checking keys..." : "Save keys"}
          </button>
        </div>
      </div>
    </div>
  );
}
