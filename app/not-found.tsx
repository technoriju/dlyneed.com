import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-ink-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-sm bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to home
      </Link>
    </div>
  );
}
