export type CardProduct = {
  id?: string;
  slug: string;
  name: string;
  image: string;
  pricePaise: number;
  mrpPaise: number;
  ratingAvg: number;
  ratingCount: number;
  defaultVariantId?: string;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  specs: Array<{ label: string; value: string }>;
  images: string[];
  pricePaise: number;
  mrpPaise: number;
  ratingAvg: number;
  ratingCount: number;
  optionName: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    tint: string;
  };
  variants: Array<{
    id: string;
    value: string;
    sku: string;
    stock: number;
  }>;
};

export type CategoryWithCount = {
  id: string;
  slug: string;
  name: string;
  image: string;
  tint: string;
  count: number;
};

export type CatalogFilters = {
  category?: string | string[];
  price?: string;
  rating?: string | number;
  sale?: boolean | string;
  sort?: string;
  q?: string;
};

export const PRICE_OPTIONS = [
  { id: "any", label: "Any price", minPaise: 0, maxPaise: Infinity },
  { id: "u1k", label: "Under ₹1,000", minPaise: 0, maxPaise: 999_99 },
  { id: "1k-3k", label: "₹1,000 – ₹3,000", minPaise: 1000_00, maxPaise: 3000_00 },
  { id: "3k-5k", label: "₹3,000 – ₹5,000", minPaise: 3000_00, maxPaise: 5000_00 },
  { id: "o5k", label: "Over ₹5,000", minPaise: 5000_01, maxPaise: Infinity },
] as const;

export const RATING_OPTIONS = [
  { value: 0, label: "Any rating" },
  { value: 4.5, label: "4.5 ★ & above" },
  { value: 4, label: "4 ★ & above" },
] as const;

export const SORT_OPTIONS = [
  { id: "popular", label: "Popularity" },
  { id: "low", label: "Price: low to high" },
  { id: "high", label: "Price: high to low" },
  { id: "rating", label: "Customer rating" },
  { id: "discount", label: "Biggest discount" },
  { id: "new", label: "Newest first" },
] as const;
