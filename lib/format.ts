// Money is stored in paise; display in whole rupees with Indian digit grouping.
export const inr = (paise: number) => "₹" + Math.round(paise / 100).toLocaleString("en-IN");

export const offPct = (pricePaise: number, mrpPaise: number) => Math.round((1 - pricePaise / mrpPaise) * 100);
