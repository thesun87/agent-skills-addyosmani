"use client";

interface OrderCounts {
  all: number;
  pending: number;
  preparing: number;
  delivering: number;
  completed: number;
}

interface OrderFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  counts: OrderCounts;
  fulfillment: string;
  onFulfillmentChange: (type: string) => void;
}

export function OrderFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  counts,
  fulfillment,
  onFulfillmentChange,
}: OrderFiltersProps) {
  const chips = [
    { id: "ALL", label: "Tất cả", count: counts.all, isPending: false },
    { id: "PENDING", label: "🟡 Mới", count: counts.pending, isPending: true },
    { id: "PREPARING", label: "Đang pha", count: counts.preparing, isPending: false },
    { id: "DELIVERING", label: "Đang giao", count: counts.delivering, isPending: false },
    { id: "COMPLETED", label: "Xong", count: counts.completed, isPending: false },
  ];

  return (
    <div className="orders-filter-bar p-3.5 border-b border-border bg-[#fffdf9] flex flex-col gap-2.5">
      {/* Search Box */}
      <div className="search-box relative w-full">
        <span className="search-icon absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-text-muted">
          🔍
        </span>
        <input
          type="text"
          className="search-input w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-surface text-xs text-text outline-none focus:border-primary focus:bg-white transition-colors"
          id="search-input"
          placeholder="Tìm theo mã đơn hoặc SĐT khách..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Status Chips */}
      <div className="filter-chips-row flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {chips.map((chip) => {
          const isActive = status === chip.id;
          let chipClasses = "filter-chip px-2.5 py-1.5 rounded-full border text-[11.5px] font-medium cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 transition-all ";

          if (chip.isPending) {
            chipClasses += isActive
              ? "bg-accent text-[#231814] border-accent font-bold "
              : "bg-[#fef3e7] text-[#8c4c0a] border-[#f1b378] font-semibold hover:bg-[#faebd7] ";
          } else {
            chipClasses += isActive
              ? "bg-text text-white border-text "
              : "bg-surface border-border text-text hover:bg-[#f4e9dc] ";
          }

          return (
            <button
              key={chip.id}
              type="button"
              id={`filter-${chip.id.toLowerCase()}`}
              className={chipClasses}
              onClick={() => onStatusChange(chip.id)}
            >
              <span>{chip.label}</span>
              <span
                className={`chip-count text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/25 text-inherit" : "bg-black/10 text-inherit"
                }`}
                id={`count-${chip.id.toLowerCase()}`}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fulfillment Type Dropdown */}
      <div className="filter-sub-row flex justify-between items-center text-xs text-text-muted">
        <span>Hình thức:</span>
        <select
          className="type-select px-2 py-1 rounded border border-border bg-surface text-xs text-text cursor-pointer outline-none"
          id="filter-type-select"
          value={fulfillment}
          onChange={(e) => onFulfillmentChange(e.target.value)}
        >
          <option value="ALL">Tất cả hình thức</option>
          <option value="DELIVERY">🛵 Giao tận nơi</option>
          <option value="PICKUP">🛍️ Lấy tại quán</option>
        </select>
      </div>
    </div>
  );
}
