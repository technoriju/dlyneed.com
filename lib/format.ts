// Money is stored in paise; display in whole rupees with Indian digit grouping.
export const inr = (paise: number) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");

export const offPct = (pricePaise: number, mrpPaise: number) => Math.round((1 - pricePaise / mrpPaise) * 100);

export function addDays(n: number, fromDate: Date = new Date()): Date {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + n);
  return d;
}

export function fmtDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", options);
}

