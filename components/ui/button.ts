// Shared button classes (prototype .btn / .btn-p / .btn-s).
const btn =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent px-5 text-sm font-semibold leading-none no-underline transition-colors";

export const btnPrimary = `${btn} bg-brand-600 text-white hover:bg-brand-700`;
export const btnSecondary = `${btn} border-border-strong bg-surface text-ink-900 hover:border-brand-500`;
export const btnDanger = `${btn} bg-bad text-white hover:opacity-90`;
export const btnSecondarySm =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-border-strong bg-surface px-3 text-xs font-semibold leading-none text-ink-900 no-underline transition-colors hover:border-brand-500";
export const btnGhostSm =
  "inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-sm px-2.5 text-xs font-semibold leading-none text-ink-700 no-underline transition-colors hover:bg-surface-muted hover:text-ink-900";
export const linkArrow =
  "inline-flex items-center gap-1.5 text-sm font-semibold leading-tight text-brand-600 hover:underline";
