import { btnGhostSm, btnSecondarySm } from "@/components/ui/button";
import type { CategoryWithCount } from "@/lib/catalog-types";
import { PRICE_OPTIONS, RATING_OPTIONS } from "@/lib/catalog-types";

type Props = {
  categories: CategoryWithCount[];
  selectedCategories: string[];
  price?: string;
  rating?: number;
  sale?: boolean;
  isDealsPage?: boolean;
  isMobileDrawer?: boolean;
  onCategoryToggle: (slug: string) => void;
  onPriceChange: (priceId: string) => void;
  onRatingChange: (rating: number) => void;
  onSaleChange: (sale: boolean) => void;
  onClearAll: () => void;
  onClose?: () => void;
};

export function FilterSidebar({
  categories,
  selectedCategories,
  price = "any",
  rating = 0,
  sale = false,
  isDealsPage = false,
  isMobileDrawer = false,
  onCategoryToggle,
  onPriceChange,
  onRatingChange,
  onSaleChange,
  onClearAll,
  onClose,
}: Props) {
  const selectedCatSet = new Set(selectedCategories);

  return (
    <div className="grid gap-[22px]">
      {isMobileDrawer && (
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-semibold text-ink-900">Filters</h2>
          <button type="button" onClick={onClose} className={btnGhostSm}>
            Done
          </button>
        </div>
      )}

      {/* Category Group */}
      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-ink-900">Category</h3>
        <div className="grid gap-0.5">
          {categories.map((c) => {
            const checked = selectedCatSet.has(c.slug);
            return (
              <label
                key={c.slug}
                className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-700 hover:text-ink-900"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onCategoryToggle(c.slug)}
                  className="size-[18px] flex-none cursor-pointer accent-brand-600"
                />
                <span>{c.name}</span>
                <span className="ml-auto text-xs tabular-nums text-ink-400">
                  {c.count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Group */}
      <div className="border-t border-border pt-5">
        <h3 className="mb-2.5 text-sm font-semibold text-ink-900">Price</h3>
        <div className="grid gap-0.5">
          {PRICE_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-700 hover:text-ink-900"
            >
              <input
                type="radio"
                name={isMobileDrawer ? "price-mobile" : "price"}
                value={opt.id}
                checked={price === opt.id}
                onChange={() => onPriceChange(opt.id)}
                className="size-[18px] flex-none cursor-pointer accent-brand-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Customer Rating Group */}
      <div className="border-t border-border pt-5">
        <h3 className="mb-2.5 text-sm font-semibold text-ink-900">
          Customer rating
        </h3>
        <div className="grid gap-0.5">
          {RATING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-700 hover:text-ink-900"
            >
              <input
                type="radio"
                name={isMobileDrawer ? "rating-mobile" : "rating"}
                value={opt.value}
                checked={rating === opt.value}
                onChange={() => onRatingChange(opt.value)}
                className="size-[18px] flex-none cursor-pointer accent-brand-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Offers Group */}
      <div className="border-t border-border pt-5">
        <h3 className="mb-2.5 text-sm font-semibold text-ink-900">Offers</h3>
        <label
          className={`flex select-none items-center gap-2.5 py-1 text-sm text-ink-700 hover:text-ink-900 ${
            isDealsPage ? "cursor-default opacity-80" : "cursor-pointer"
          }`}
        >
          <input
            type="checkbox"
            checked={isDealsPage || sale}
            disabled={isDealsPage}
            onChange={(e) => onSaleChange(e.target.checked)}
            className="size-[18px] flex-none cursor-pointer accent-brand-600 disabled:cursor-not-allowed"
          />
          <span>35% off or more</span>
        </label>
      </div>

      {/* Clear & Apply Filters */}
      <div className={`pt-2 ${isMobileDrawer ? "sticky bottom-0 -mx-5 -mb-5 border-t border-border bg-surface p-4 flex gap-2.5 shadow-[0_-4px_12px_rgba(17,17,17,0.05)]" : ""}`}>
        <button
          type="button"
          onClick={onClearAll}
          className={`${btnSecondarySm} ${isMobileDrawer ? "flex-1" : "w-full"}`}
        >
          Clear all
        </button>
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex h-9 items-center justify-center rounded-sm bg-brand-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95"
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
}
