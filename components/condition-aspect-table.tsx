import type { ConditionAspectRating } from "@/lib/storefront";

// Per-aspect ratings. Static, so this stays a server component.
//
// A single overall grade is too coarse to be trusted — it hides what is actually wrong.
// Rating each aspect separately lets a buyer judge whether the wear matters for them:
// someone planning to refinish a table top does not care about ring marks, but does care
// about a frame that wobbles.
//
// Aspects that do not apply to an item (upholstery on a table) are simply absent rather
// than shown as a neutral score, which would imply a judgement nobody made.
export function ConditionAspectTable({
  ratings,
}: {
  ratings: ConditionAspectRating[];
}) {
  if (ratings.length === 0) return null;

  return (
    <section
      aria-labelledby="condition-aspects-heading"
      className="mt-6 rounded-md bg-canvas p-4 sm:p-5"
    >
      <h2
        id="condition-aspects-heading"
        className="text-base font-bold text-ink sm:text-lg"
      >
        მდგომარეობა დეტალურად
      </h2>

      <dl className="mt-4 divide-y divide-line">
        {ratings.map((rating) => (
          <div key={rating.aspect_code} className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <dt className="text-sm font-semibold text-ink">
                {rating.label_ka}
              </dt>
              <dd className="text-sm font-semibold text-forest">
                {rating.grade?.label_ka ?? "—"}
              </dd>
            </div>
            {rating.note ? (
              <p className="mt-1 max-w-[60ch] text-sm leading-6 text-ink-muted">
                {rating.note}
              </p>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
