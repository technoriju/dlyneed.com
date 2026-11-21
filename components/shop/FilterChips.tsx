import type { CategoryWithCount } from "@/lib/catalog-types";
import { PRICE_OPTIONS } from "@/lib/catalog-types";

export type FilterChipItem = {
  key: string;
  label: string;
};

type Props = {
  q?: string;
  selectedCategories: string[];
  categories: CategoryWithCount[];
  price?: string;
  rating?: number;
  sale?: boolean;
  isDealsPage?: boolean;
  onRemove: (key: string) => void;
};

export function FilterChips({
  q,
  selectedCategories,
  categories,
  price,
  rating,
  sale,
  isDealsPage,
  onRemove,
}: Props) {
  const chips: FilterChipItem[] = [];

  if (q) {
    chips.push({ key: "q", label: `“${q}”` });
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c.name]));
  for (const catSlug of selectedCategories) {
    const name = categoryMap.get(catSlug) || catSlug;
    chips.push({ key: `cat:${catSlug}`, label: name });
  }

  if (price && price !== "any") {
    const matched = PRICE_OPTIONS.find((p) => p.id === price);
    const label = matched ? matched.label : price;
    chips.push({ key: "price", label });
  }

  if (rating && rating > 0) {
    chips.push({ key: "rating", label: `${rating} ★ & above` });
  }

  // Only show the sale chip if not already on the /deals page where 35%+ off is the entire page theme
  if (sale && !isDealsPage) {
    chips.push({ key: "sale", label: "35% off or more" });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="region" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          aria-label={`Remove filter ${chip.label}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-100 pr-2.5 pl-3 text-[13px] font-medium text-ink-900 transition-colors hover:bg-[#e2ebd0]"
        >
          <span>{chip.label}</span>
          <span aria-hidden="true" className="text-sm font-semibold text-ink-500">
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
