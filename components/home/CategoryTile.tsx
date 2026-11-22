import Image from "next/image";
import Link from "next/link";

type Props = { slug: string; name: string; image: string; tint: string };

// Tint is a design token name stored on the category ("cat-blue" → bg-cat-blue).
const tints: Record<string, string> = {
  "cat-blue": "bg-cat-blue",
  "cat-rose": "bg-cat-rose",
  "cat-butter": "bg-cat-butter",
  "cat-lilac": "bg-cat-lilac",
  "cat-mint": "bg-cat-mint",
  "cat-peach": "bg-cat-peach",
};

export function CategoryTile({ slug, name, image, tint }: Props) {
  return (
    <Link
      href={`/category/${slug}`}
      className="group flex flex-col items-center gap-2 sm:gap-3 text-center text-xs sm:text-sm leading-tight font-medium text-ink-900 active:scale-95 transition-transform"
    >
      <span
        className={`relative block aspect-square w-full max-w-[100px] sm:max-w-[130px] md:max-w-[150px] rounded-full p-1.5 sm:p-2 transition-transform group-hover:-translate-y-[3px] ${tints[tint] ?? "bg-surface-muted"}`}
      >
        <span className="relative block size-full overflow-hidden rounded-full">
          <Image src={image} alt="" fill sizes="(max-width: 640px) 100px, 150px" className="object-cover" />
        </span>
      </span>
      <span className="line-clamp-2">{name}</span>
    </Link>
  );
}
