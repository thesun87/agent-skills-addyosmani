"use client";

interface OrderPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function OrderPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: OrderPaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination-bar px-3.5 py-2.5 border-t border-border bg-[#fffdf9] flex items-center justify-between text-xs text-text-muted">
      <span className="pagination-info text-[11.5px]" id="pagination-info-text">
        {total === 0 ? "Không có đơn nào" : `Hiển thị ${start} - ${end} trong ${total} đơn`}
      </span>

      <div className="pagination-buttons flex items-center gap-1">
        <button
          type="button"
          className="page-btn bg-surface border border-border text-text px-2 py-1 rounded text-xs font-semibold hover:bg-[#f2e4d4] disabled:opacity-40 disabled:cursor-not-allowed"
          id="btn-page-prev"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>

        <div id="page-numbers-container" className="flex gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`page-btn px-2.5 py-1 rounded text-xs font-semibold ${
                p === page
                  ? "active bg-primary text-white border-primary"
                  : "bg-surface border-border text-text hover:bg-[#f2e4d4]"
              }`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="page-btn bg-surface border border-border text-text px-2 py-1 rounded text-xs font-semibold hover:bg-[#f2e4d4] disabled:opacity-40 disabled:cursor-not-allowed"
          id="btn-page-next"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
