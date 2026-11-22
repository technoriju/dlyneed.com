import { CardIcon, HeadsetIcon, ReturnIcon, TruckIcon } from "@/components/layout/icons";

const features = [
  { icon: TruckIcon, title: "Free Shipping", text: "On orders over ₹999" },
  { icon: CardIcon, title: "Secure Payment", text: "UPI, cards, net banking" },
  { icon: ReturnIcon, title: "Easy Returns", text: "30 days return policy" },
  { icon: HeadsetIcon, title: "24/7 Support", text: "Dedicated support" },
];

export function FeatureStrip() {
  return (
    <div className="relative z-[1] mx-3 -mt-8 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3.5 shadow-[0_8px_24px_rgba(17,17,17,.06)] sm:mx-6 sm:-mt-12 sm:grid-cols-2 sm:gap-5 sm:p-5 lg:grid-cols-4">
      {features.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="grid size-9 sm:size-11 flex-none place-items-center rounded-full bg-brand-100 text-brand-600">
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <b className="block truncate text-xs sm:text-sm leading-tight font-semibold text-ink-900">{title}</b>
            <span className="block truncate text-[11px] sm:text-[13px] text-ink-500">{text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
