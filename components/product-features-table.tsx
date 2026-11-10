import { formatCm } from "@/components/product-dimensions-table";
import type { ProductFolding } from "@/lib/storefront";

// Static, so this stays a server component. Same row layout as ProductDimensionsTable.
//
// Same omission rule too: a row appears only when it states a fact. `hasStorage` null is
// "not specified", so it renders nothing rather than "არ აქვს" — and a product that does
// not fold shows no folding row at all, because "does not unfold" is not something anyone
// recorded about it, only the column default.

function formatUnfolded(unfolded: ProductFolding["unfolded"]) {
  // Labelled per axis rather than "160 × 200 × 45": which number is the width of a sofa-bed
  // is exactly what a shopper cannot guess, and only the measured axes are listed.
  return [
    { label: "სიგანე", value: unfolded.width_cm },
    { label: "სიგრძე", value: unfolded.length_cm },
    { label: "სიმაღლე", value: unfolded.height_cm },
  ]
    .filter((axis): axis is { label: string; value: number } => axis.value !== null)
    .map((axis) => `${axis.label} ${formatCm(axis.value)} სმ`)
    .join(" · ");
}

export function ProductFeaturesTable({
  folding,
  hasStorage,
}: {
  folding: ProductFolding;
  hasStorage: boolean | null;
}) {
  const rows: { label: string; value: string }[] = [];

  if (folding.isFoldable) {
    // When the mechanism's name was not recorded, still say that it unfolds — that is the
    // fact staff did record.
    rows.push(
      folding.mechanism
        ? { label: "გაშლის მექანიზმი", value: folding.mechanism.label_ka }
        : { label: "გაშლის ფუნქცია", value: "აქვს" },
    );

    const unfolded = formatUnfolded(folding.unfolded);
    if (unfolded) {
      rows.push({ label: "ზომა გაშლილ მდგომარეობაში", value: unfolded });
    }
  }

  if (hasStorage !== null) {
    rows.push({ label: "სათავსო", value: hasStorage ? "აქვს" : "არ აქვს" });
  }

  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby="product-features-heading"
      className="mt-6 rounded-md bg-canvas p-4 sm:p-5"
    >
      <h2
        id="product-features-heading"
        className="text-base font-bold text-ink sm:text-lg"
      >
        მახასიათებლები
      </h2>
      <dl className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <dt className="text-sm text-ink-muted">{row.label}</dt>
            <dd className="text-right text-sm font-semibold text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
