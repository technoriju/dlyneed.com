"use client";

import { useState } from "react";

// No newsletter backend in the spec yet; this only validates the address.
export function NewsletterForm() {
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const v = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setMsg({ text: "Enter a valid email address.", err: true });
      return;
    }
    setMsg({ text: "Newsletter sign-up opens soon.", err: false });
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="email-news">
          Email address
        </label>
        <input
          id="email-news"
          name="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          className="h-11 min-w-0 flex-1 rounded-sm border border-border-strong bg-surface px-3.5 text-sm text-ink-900"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-sm bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Subscribe
        </button>
      </form>
      <div role="status" className={`mt-2 min-h-5 text-[13px] ${msg?.err ? "text-bad" : "text-brand-600"}`}>
        {msg?.text}
      </div>
    </>
  );
}
