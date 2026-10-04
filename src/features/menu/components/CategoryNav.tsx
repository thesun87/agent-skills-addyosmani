"use client";

export interface CategoryNavProps {
  categories: ReadonlyArray<{ id: string; name: string }>;
  activeCategoryId?: string;
  onSelectCategory?: (id: string) => void;
}

export function CategoryNav({ categories, activeCategoryId, onSelectCategory }: CategoryNavProps) {
  const handleClick = (id: string) => {
    onSelectCategory?.(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav
      className="border-border/60 bg-surface-raised w-full border-t"
      aria-label="Danh mục thực đơn"
    >
      <div className="mx-auto flex max-w-6xl scrollbar-none items-center gap-2 overflow-x-auto px-4 py-2.5">
        {categories.map((category) => {
          const isActive = activeCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleClick(category.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "text-text-muted hover:bg-primary/5 hover:text-text"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
