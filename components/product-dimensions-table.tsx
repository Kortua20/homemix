import type { ProductDimensions } from "@/lib/storefront";

// Static, so this stays a server component.
//
// Unmeasured fields are omitted entirely rather than shown with a dash. A row reading
// "სიღრმე —" implies someone looked and found nothing; absence is the honest signal that
// the measurement was never taken.

function formatCm(value: number) {
  // 180 rather than 180.0, but 74.5 keeps its half.
  return new Intl.NumberFormat("ka-GE", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function ProductDimensionsTable({
  dimensions,
}: {
  dimensions: ProductDimensions;
}) {
  const rows = [
    { label: "სიგანე", value: dimensions.width_cm, unit: "სმ" },
    { label: "სიღრმე", value: dimensions.depth_cm, unit: "სმ" },
    { label: "სიმაღლე", value: dimensions.height_cm, unit: "სმ" },
    { label: "ჯდომის სიმაღლე", value: dimensions.seat_height_cm, unit: "სმ" },
    { label: "წონა", value: dimensions.weight_kg, unit: "კგ" },
  ].filter((row): row is { label: string; value: number; unit: string } =>
    row.value !== null,
  );

  if (rows.length === 0 && !dimensions.note) return null;

  return (
    <section
      aria-labelledby="product-dimensions-heading"
      className="mt-6 rounded-2xl border border-[#d8ded8] bg-white p-5"
    >
      <h2
        id="product-dimensions-heading"
        className="text-lg font-semibold text-[#18221d]"
      >
        ზომები
      </h2>

      {rows.length > 0 ? (
        <dl className="mt-4 divide-y divide-[#e4e8e4]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
            >
              <dt className="text-sm text-[#5e685f]">{row.label}</dt>
              <dd className="text-sm font-semibold text-[#18221d]">
                {formatCm(row.value)} {row.unit}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {dimensions.note ? (
        <p
          className={`max-w-[60ch] text-sm leading-6 text-[#5e685f] ${
            rows.length > 0 ? "mt-4 border-t border-[#e4e8e4] pt-4" : "mt-3"
          }`}
        >
          {dimensions.note}
        </p>
      ) : null}
    </section>
  );
}
