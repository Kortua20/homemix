import { AlertCircle, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  tone = "empty",
  inverted = false,
}: {
  title: string;
  description: string;
  tone?: "empty" | "error";
  inverted?: boolean;
}) {
  const Icon = tone === "error" ? AlertCircle : Armchair;

  return (
    <div
      className={cn(
        "grid min-h-56 grid-cols-[auto_1fr] items-center gap-5 border-y px-1 py-10 sm:gap-8 sm:px-6",
        inverted
          ? "border-white/25 text-white"
          : tone === "error"
            ? "border-[#9e5c55] text-[#241b16]"
            : "border-[#2f2925]/30 text-[#241b16]",
      )}
    >
      <div className={cn("grid size-14 place-items-center border", inverted ? "border-white/30 text-[#f1c69f]" : "border-[#2f2925]/35 text-[#6f4329]") }>
        <Icon className="size-7" strokeWidth={1.3} aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold sm:text-xl">{title}</h3>
        <p className={cn("mt-2 max-w-md text-sm leading-6", inverted ? "text-[#cbb9ad]" : "text-[#5d5149]")}>{description}</p>
      </div>
    </div>
  );
}
