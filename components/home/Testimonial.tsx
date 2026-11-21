type Props = { text: string; name: string; initials: string; tint: string };

export function Testimonial({ text, name, initials, tint }: Props) {
  return (
    <figure className="m-0 flex flex-col gap-3.5 rounded-md border border-border bg-brand-50 p-6">
      <span
        aria-hidden="true"
        className="grid size-[34px] place-items-center rounded-full bg-brand-100 font-serif text-[22px] leading-none font-bold text-brand-600"
      >
        “
      </span>
      <blockquote className="m-0 flex-1">{text}</blockquote>
      <figcaption className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`grid size-[38px] flex-none place-items-center rounded-full text-xs leading-none font-semibold text-ink-900 ${tint}`}
        >
          {initials}
        </span>
        <div>
          <b className="block text-sm text-ink-900">{name}</b>
          <span className="text-star" role="img" aria-label="5 out of 5 stars">
            ★★★★★
          </span>
        </div>
      </figcaption>
    </figure>
  );
}
