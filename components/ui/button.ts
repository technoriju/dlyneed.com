// Shared button classes (prototype .btn / .btn-p / .btn-s).
const btn =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent px-5 text-sm font-semibold leading-none no-underline transition-colors";

export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-700`;
export const btnSecondary = `${btn} border-border-strong bg-surface text-ink-900 hover:border-brand-500`;
export const linkArrow =
  "inline-flex items-center gap-1.5 text-sm font-semibold leading-tight text-brand-600 hover:underline";
