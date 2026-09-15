import type { ProductAttribute } from "@/lib/storefront";

// Static, so this stays a server component.
//
// Absent groups are omitted entirely rather than shown empty — consistent with the
// dimensions table. A product with no recorded style should not display an empty "Style"
// row implying someone looked and found nothing.

function AttributeRow({
  label,
  items,
  withSwatch = false,
}: {
  label: string;
  items: ProductAttribute[];
  withSwatch?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
      <dt className="min-w-24 text-sm text-[#5e685f]">{label}</dt>
      <dd className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item.code}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1ee] px-2.5 py-1 text-xs font-semibold text-[#18221d]"
          >
            {withSwatch && item.hex ? (
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full border border-[#00000022]"
                style={{ backgroundColor: item.hex }}
              />
            ) : null}
            {item.label_ka}
          </span>
        ))}
      </dd>
    </div>
  );
}

export function ProductAttributes({
  materials,
  colours,
  styles,
}: {
  materials: ProductAttribute[];
  colours: ProductAttribute[];
  styles: ProductAttribute[];
}) {
  if (
    materials.length === 0 &&
    colours.length === 0 &&
    styles.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-labelledby="product-attributes-heading"
      className="mt-6 rounded-2xl border border-[#d8ded8] bg-white p-5"
    >
      <h2
        id="product-attributes-heading"
        className="text-lg font-semibold text-[#18221d]"
      >
        მასალა და ფერი
      </h2>
      <dl className="mt-4 divide-y divide-[#e4e8e4]">
        <AttributeRow label="მასალა" items={materials} />
        <AttributeRow label="ფერი" items={colours} withSwatch />
        <AttributeRow label="სტილი" items={styles} />
      </dl>
    </section>
  );
}
