import { BagIcon } from "@/components/layout/icons";
import { btnPrimary } from "@/components/ui/button";

type Props = {
  onClear: () => void;
};

export function EmptyState({ onClear }: Props) {
  return (
    <div className="col-span-full grid justify-items-center rounded-lg border border-dashed border-border-strong bg-surface px-5 py-14 text-center">
      <div
        className="mb-1 grid size-[72px] place-items-center rounded-full bg-brand-100 text-brand-600"
        aria-hidden="true"
      >
        <BagIcon size={32} />
      </div>
      <h2 className="text-xl font-semibold text-ink-900">No products match</h2>
      <p className="max-w-[40ch] text-sm leading-relaxed text-ink-500">
        Try removing a filter or searching for something else.
      </p>
      <button type="button" onClick={onClear} className={`${btnPrimary} mt-2`}>
        Clear all filters
      </button>
    </div>
  );
}
