import Image from "next/image";
import Link from "next/link";
import { btnPrimary } from "@/components/ui/button";
import { Countdown } from "./Countdown";

export function PromoBanner() {
  return (
    <section
      aria-labelledby="deal-h"
      className="grid grid-cols-[1fr_auto] items-center gap-8 rounded-lg bg-sand-100 p-14 max-[720px]:grid-cols-1 max-[720px]:px-6 max-[720px]:py-8"
    >
      <div>
        <div className="text-[13px] leading-none font-semibold text-ink-700">Special Offer</div>
        <h2 id="deal-h" className="my-3 text-[clamp(32px,4.5vw,46px)] leading-[1.1] font-semibold tracking-[-.5px]">
          Up to 50% Off
        </h2>
        <p className="mb-5 max-w-[340px]">
          Limited time offer on selected items. Use code{" "}
          <span className="rounded-sm border border-dashed border-brand-500 bg-surface px-2 py-[3px] font-mono font-semibold text-ink-900">
            SAVE200
          </span>{" "}
          for an extra ₹200 off orders over ₹1,999.
        </p>
        <Countdown />
        <Link href="/deals" className={btnPrimary}>
          Shop the Sale <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="relative aspect-[340/280] w-[340px] max-w-full max-[720px]:justify-self-center">
        <Image
          src="/images/products/tote.jpg"
          alt="Kraft paper tote bag"
          width={480}
          height={480}
          sizes="232px"
          className="absolute top-0 left-0 h-full w-[68%] rounded-md object-cover"
        />
        <Image
          src="/images/products/plant.jpg"
          alt="Potted succulent"
          width={300}
          height={300}
          sizes="130px"
          className="absolute right-0 bottom-0 aspect-square w-[38%] rounded-md border-4 border-sand-100 object-cover"
        />
        <span className="absolute top-[46%] left-[44%] -rotate-[18deg] rounded-sm bg-brand-600 px-3.5 py-2.5 text-lg leading-none font-bold text-white shadow-[0_6px_16px_rgba(17,17,17,.15)]">
          50% OFF
        </span>
      </div>
    </section>
  );
}
