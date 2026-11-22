"use client";

import { useState } from "react";

type Props = {
  description: string;
  highlights: string[];
  specs: Array<{ label: string; value: string }>;
  ratingAvg: number;
  ratingCount: number;
};

const TABS = [
  { id: "desc", label: "Description" },
  { id: "specs", label: "Specifications" },
  { id: "reviews", label: "Ratings" },
  { id: "ship", label: "Shipping & Returns" },
] as const;

export function ProductTabs({
  description,
  highlights,
  specs,
  ratingAvg,
  ratingCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<string>("desc");

  return (
    <section aria-label="Product information" className="border-t border-border pt-8 sm:pt-10">
      {/* Tab Navigation */}
      <div className="flex gap-4 sm:gap-7 overflow-x-auto border-b border-border text-xs sm:text-sm no-scrollbar" role="tablist">
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          const displayLabel = tab.id === "reviews" ? `Ratings (${ratingCount})` : tab.label;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`t-${tab.id}`}
              aria-controls={`tp-${tab.id}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer pb-3 font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? "border-b-2 border-brand-600 text-brand-600"
                  : "border-b-2 border-transparent text-ink-500 hover:text-ink-900"
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="max-w-[760px] pt-5 sm:pt-6">
        {/* Description Panel */}
        {activeTab === "desc" && (
          <div role="tabpanel" id="tp-desc" aria-labelledby="t-desc" className="grid gap-4 text-xs sm:text-sm text-ink-700">
            <p className="text-sm sm:text-[15px] leading-relaxed text-ink-900">{description}</p>
            {highlights.length > 0 && (
              <ul className="grid gap-2.5 pt-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1 size-1.5 flex-none rounded-full bg-brand-600" aria-hidden="true" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Specifications Panel */}
        {activeTab === "specs" && (
          <div role="tabpanel" id="tp-specs" aria-labelledby="t-specs">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <tbody className="divide-y divide-border">
                {specs.map((s, i) => (
                  <tr key={i}>
                    <th scope="row" className="w-1/3 sm:w-2/5 py-2.5 sm:py-3 text-left font-medium text-ink-500 pr-2">
                      {s.label}
                    </th>
                    <td className="py-2.5 sm:py-3 text-left text-ink-900 break-words">{s.value}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="w-1/3 sm:w-2/5 py-2.5 sm:py-3 text-left font-medium text-ink-500 pr-2">
                    Country of origin
                  </th>
                  <td className="py-2.5 sm:py-3 text-left text-ink-900">India</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Ratings Panel */}
        {activeTab === "reviews" && (
          <div role="tabpanel" id="tp-reviews" aria-labelledby="t-reviews">
            <div className="grid grid-cols-[auto_1fr] items-center gap-5 sm:gap-8 max-[480px]:grid-cols-1">
              <div className="text-[40px] sm:text-[48px] font-bold leading-none text-ink-900">
                {ratingAvg}
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm sm:text-base text-star" aria-label={`${ratingAvg} out of 5 stars`}>
                  {"★".repeat(Math.round(ratingAvg))}
                  {"☆".repeat(5 - Math.round(ratingAvg))}
                </div>
                <p className="mt-1.5 text-xs text-ink-500">
                  Average of {ratingCount} customer ratings. Written reviews will show here once the store is connected to a reviews service.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shipping & Returns Panel */}
        {activeTab === "ship" && (
          <div role="tabpanel" id="tp-ship" aria-labelledby="t-ship" className="grid gap-3.5 text-xs sm:text-sm text-ink-700">
            <p className="leading-relaxed">
              Orders over ₹999 ship free; below that, delivery is ₹79. Standard delivery takes 3–5 business days; express (1–2 days, metro cities) is ₹149.
            </p>
            <ul className="grid gap-2 pt-1 pl-4 list-disc text-xs text-ink-500">
              <li>Orders placed before 2 pm ship the same day</li>
              <li>Return any unused item within 30 days for a full refund to your original payment method</li>
              <li>Cash on delivery available for orders up to ₹10,000 (+₹49)</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
