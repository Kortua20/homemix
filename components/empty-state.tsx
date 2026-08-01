import { AlertCircle, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, description, tone = "empty" }: { title: string; description: string; tone?: "empty" | "error" }) {
  const Icon = tone === "error" ? AlertCircle : Armchair;
  return (
    <div className={cn("flex min-h-56 flex-col items-center justify-center rounded-3xl border bg-white px-5 py-10 text-center", tone === "error" ? "border-[#d6a9a4]" : "border-[#e4e2e1]") }>
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#f0eded] text-[#a89082]"><Icon className="size-7" strokeWidth={1.5} aria-hidden="true" /></div>
      <h3 className="text-lg font-semibold text-[#1b1c1c]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#605e5b]">{description}</p>
    </div>
  );
}
