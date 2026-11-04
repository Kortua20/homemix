import { Headset, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

// Only claims the business has confirmed are true. Add an item here only after checking it
// with the shop — this row is read as a promise.
const items: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "უსაფრთხო გადახდა" },
  { icon: Headset, label: "კვალიფიციური კონსულტაცია" },
  { icon: Truck, label: "სწრაფი მიწოდება" },
];

export function TrustStrip() {
  return (
    <ul
      aria-label="ჩვენი სერვისი"
      className="grid grid-cols-3 divide-x divide-line rounded-lg"
    >
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex flex-col items-center gap-3 px-2 py-2 text-center"
        >
          <Icon
            className="size-8 text-forest-deep sm:size-9"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="text-xs leading-5 font-semibold text-ink sm:text-sm">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
