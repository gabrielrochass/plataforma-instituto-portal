import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Comparison = { difference: number | null; text: string };

function compare(
  difference: number,
  amount: string,
  reference: string,
): Comparison {
  return {
    difference,
    text:
      difference === 0
        ? m.impact.sameAs(reference)
        : (difference > 0 ? m.impact.moreThan : m.impact.lessThan)(
            amount,
            reference,
          ),
  };
}

export function compareCount(
  current: number,
  previous: number,
  reference: string,
): Comparison {
  const difference = current - previous;
  return compare(
    difference,
    Math.abs(difference).toLocaleString("pt-BR"),
    reference,
  );
}

export function compareRate(
  current: number | null,
  previous: number | null,
  reference: string,
): Comparison {
  if (current === null || previous === null) {
    return { difference: null, text: m.impact.noComparison };
  }
  const difference = current - previous;
  return compare(difference, m.impact.points(Math.abs(difference)), reference);
}

export function StatTile({
  label,
  value,
  detail,
  comparison,
  upIsGood = true,
}: {
  label: string;
  value: string;
  detail: string;
  comparison?: Comparison;
  upIsGood?: boolean;
}) {
  const difference = comparison?.difference ?? null;
  const Arrow =
    difference === null || difference === 0
      ? null
      : difference > 0
        ? ArrowUpRightIcon
        : ArrowDownRightIcon;
  const better =
    difference === null || difference === 0
      ? null
      : difference > 0 === upIsGood;

  return (
    <div className="flex flex-col rounded-2xl bg-card p-4 break-inside-avoid">
      <dt className="text-subhead font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-title1 font-bold tracking-tight tabular-nums">
        {value}
      </dd>
      {comparison && (
        <dd className="mt-1 flex items-start gap-1 text-footnote text-muted-foreground">
          {Arrow && (
            <Arrow
              aria-hidden="true"
              className={cn(
                "mt-px size-4 shrink-0",
                better === true && "text-success",
                better === false && "text-destructive",
              )}
            />
          )}
          {comparison.text}
        </dd>
      )}
      <dd className="mt-3 hidden border-t pt-3 text-footnote text-muted-foreground sm:block print:block">
        {detail}
      </dd>
    </div>
  );
}
