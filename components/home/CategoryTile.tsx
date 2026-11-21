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
      className="group flex flex-col items-center gap-3 text-center text-sm leading-tight font-medium text-ink-900"
    >
      <span
        className={`relative block aspect-square w-full max-w-[150px] rounded-full p-2 transition-transform group-hover:-translate-y-[3px] ${tints[tint] ?? "bg-surface-muted"}`}
      >
        <span className="relative block size-full overflow-hidden rounded-full">
          <Image src={image} alt="" fill sizes="150px" className="object-cover" />
        </span>
      </span>
      {name}
    </Link>
  );
}
