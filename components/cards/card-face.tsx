import { NfcIcon } from "lucide-react";
import { cardFace } from "@/lib/card-designs";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function CardFace({
  name,
  design,
  bestPurchaseDay,
  dueDay,
  className,
}: {
  name: string;
  design: string;
  bestPurchaseDay?: number | null;
  dueDay?: number | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[1.586] w-full flex-col justify-between rounded-2xl p-4 shadow-md ring-1 ring-white/10 ring-inset forced-color-adjust-none",
        cardFace(design),
        className,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate text-title3 font-bold tracking-tight">
          {name}
        </span>
        <NfcIcon aria-hidden="true" className="size-6 shrink-0" />
      </span>
      <span
        aria-hidden="true"
        className="h-7 w-10 rounded-md bg-linear-135 from-[#f5e6b8] to-[#c9a227]"
      />
      <span className="text-footnote font-medium">
        {bestPurchaseDay && dueDay
          ? m.settings.cardSummary(bestPurchaseDay, dueDay)
          : m.settings.noBill}
      </span>
    </div>
  );
}

export function MiniCard({
  design,
  className,
}: {
  design: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-4 w-6 shrink-0 rounded-[4px] forced-color-adjust-none",
        cardFace(design),
        className,
      )}
    />
  );
}
