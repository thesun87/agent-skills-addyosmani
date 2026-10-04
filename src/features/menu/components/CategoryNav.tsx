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
      className="border-border/80 bg-surface-raised sticky top-0 z-30 flex scrollbar-none gap-2 overflow-x-auto border-b px-4 py-2.5"
      aria-label="Danh mục thực đơn"
    >
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleClick(category.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? "bg-primary text-white shadow-xs"
                : "text-text-muted hover:bg-primary/5 hover:text-text"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}
