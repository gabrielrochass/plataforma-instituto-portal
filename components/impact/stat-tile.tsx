import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  EqualIcon,
  MinusIcon,
} from "lucide-react";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Comparison = { difference: number | null; text: string };

function compare(difference: number, amount: string): Comparison {
  return {
    difference,
    text:
      difference === 0
        ? m.impact.sameAs
        : (difference > 0 ? m.impact.moreThan : m.impact.lessThan)(amount),
  };
}

export function compareCount(current: number, previous: number): Comparison {
  const difference = current - previous;
  return compare(difference, Math.abs(difference).toLocaleString("pt-BR"));
}

export function compareRate(
  current: number | null,
  previous: number | null,
): Comparison {
  if (current === null || previous === null) {
    return { difference: null, text: m.impact.noBase };
  }
  const difference = current - previous;
  return compare(difference, m.impact.points(Math.abs(difference)));
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
    difference === null
      ? MinusIcon
      : difference > 0
        ? ArrowUpRightIcon
        : difference < 0
          ? ArrowDownRightIcon
          : EqualIcon;
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
          <Arrow
            aria-hidden="true"
            className={cn(
              "mt-px size-4 shrink-0",
              better === true && "text-success",
              better === false && "text-destructive",
            )}
          />
          {comparison.text}
        </dd>
      )}
      <dd className="mt-3 hidden border-t pt-3 text-footnote text-muted-foreground sm:block print:block">
        {detail}
      </dd>
    </div>
  );
}
