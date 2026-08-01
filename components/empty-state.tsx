import { AlertCircle, Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  tone = "empty",
}: {
  title: string;
  description: string;
  tone?: "empty" | "error";
}) {
  const Icon = tone === "error" ? AlertCircle : Armchair;

  return (
    <div className={cn("flex min-h-52 flex-col items-center justify-center rounded-2xl border bg-white px-5 py-10 text-center", tone === "error" ? "border-[#d6a9a4]" : "border-[#e4e2e1]") }>
      <Icon className="size-8 text-[#a89082]" strokeWidth={1.5} aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold text-[#1b1c1c]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#605e5b]">{description}</p>
    </div>
  );
}
