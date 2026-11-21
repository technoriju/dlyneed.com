import { SORT_OPTIONS } from "@/lib/catalog-types";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SortSelect({ value, onChange }: Props) {
  return (
    <div>
      <label className="sr-only" htmlFor="sort">
        Sort by
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 cursor-pointer rounded-sm border border-border-strong bg-surface px-3 text-sm text-ink-900 outline-none hover:border-brand-500 focus:border-brand-600"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            Sort: {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
