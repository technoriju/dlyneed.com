import { SearchIcon } from "./icons";

export function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form
      action="/shop"
      role="search"
      className={`flex h-[42px] items-center gap-2 rounded-full border border-border bg-surface-muted pr-1.5 pl-3.5 text-ink-500 focus-within:border-brand-600 focus-within:bg-surface ${className}`}
    >
      <SearchIcon />
      <label className="sr-only" htmlFor={id}>
        Search products
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search for products"
        autoComplete="off"
        className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-900 outline-none"
      />
      <button
        type="submit"
        className="h-8 rounded-full bg-brand-600 px-3.5 text-[13px] leading-none font-semibold text-white hover:bg-brand-700"
      >
        Search
      </button>
    </form>
  );
}
