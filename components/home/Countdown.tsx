"use client";

import { useEffect, useState } from "react";

// Counts down to the end of the current week (Sunday 23:59:59 local time), as in the prototype.
function endOfWeek() {
  const end = new Date();
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
  end.setHours(23, 59, 59, 0);
  return end;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown() {
  // null until mounted, so server and client render the same "00" placeholders.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = endOfWeek().getTime();
    const tick = () => setLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const s = left ?? 0;
  const parts = [
    { label: "Days", value: Math.floor(s / 86400) },
    { label: "Hrs", value: Math.floor((s % 86400) / 3600) },
    { label: "Min", value: Math.floor((s % 3600) / 60) },
    { label: "Sec", value: s % 60 },
  ];

  return (
    <div className="mb-7 flex gap-2 tabular-nums" role="timer" aria-label="Offer ends in">
      {parts.map((p) => (
        <div key={p.label} className="min-w-14 rounded-sm bg-surface px-2.5 py-2 text-center">
          <b className="block text-xl leading-none font-bold text-ink-900">{pad(p.value)}</b>
          <span className="text-[11px] tracking-[.4px] text-ink-500 uppercase">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
