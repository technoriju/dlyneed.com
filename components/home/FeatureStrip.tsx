import { CardIcon, HeadsetIcon, ReturnIcon, TruckIcon } from "@/components/layout/icons";

const features = [
  { icon: TruckIcon, title: "Free Shipping", text: "On orders over ₹999" },
  { icon: CardIcon, title: "Secure Payment", text: "UPI, cards, net banking" },
  { icon: ReturnIcon, title: "Easy Returns", text: "30 days return policy" },
  { icon: HeadsetIcon, title: "24/7 Support", text: "Dedicated support" },
];

export function FeatureStrip() {
  return (
    <div className="relative z-[1] mx-6 -mt-12 grid grid-cols-4 gap-5 rounded-md border border-border bg-surface px-6 py-5 shadow-[0_10px_30px_rgba(17,17,17,.06)] max-[960px]:grid-cols-2 max-[720px]:mx-3 max-[720px]:-mt-10 max-[480px]:grid-cols-1">
      {features.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 flex-none place-items-center rounded-full bg-brand-100 text-brand-600">
            <Icon />
          </span>
          <div>
            <b className="block text-sm leading-tight font-semibold text-ink-900">{title}</b>
            <span className="text-[13px] text-ink-500">{text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
