"use client";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-full border border-[#ece9e1] bg-white px-4 py-2 text-[13px] font-medium text-[#5c574e] transition-all hover:border-[#fecb8b] disabled:cursor-not-allowed disabled:opacity-30"
      >
        &larr; Previous
      </button>
      <span className="text-[13px] font-medium text-[#7a756b]">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-full border border-[#ece9e1] bg-white px-4 py-2 text-[13px] font-medium text-[#5c574e] transition-all hover:border-[#fecb8b] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next &rarr;
      </button>
    </div>
  );
}
