import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  EqualIcon,
  MinusIcon,
} from "lucide-react";
import { m } from "@/lib/i18n";

export type Comparison = { difference: number | null; text: string };

export function compareCount(
  current: number,
  previous: number,
  reference: string,
): Comparison {
  const difference = current - previous;
  const value = Math.abs(difference).toLocaleString("pt-BR");
  return {
    difference,
    text:
      difference === 0
        ? m.impact.sameAs(reference)
        : (difference > 0 ? m.impact.moreThan : m.impact.lessThan)(
            value,
            reference,
          ),
  };
}

export function compareRate(
  current: number | null,
  previous: number | null,
  reference: string,
): Comparison {
  if (current === null || previous === null) {
    return { difference: null, text: m.impact.noBase };
  }
  const difference = current - previous;
  return {
    difference,
    text:
      difference === 0
        ? m.impact.sameAs(reference)
        : (difference > 0 ? m.impact.moreThan : m.impact.lessThan)(
            m.impact.points(Math.abs(difference)),
            reference,
          ),
  };
}

export function StatTile({
  label,
  value,
  detail,
  comparison,
}: {
  label: string;
  value: string;
  detail: string;
  comparison?: Comparison;
}) {
  const Icon =
    comparison?.difference == null
      ? MinusIcon
      : comparison.difference > 0
        ? ArrowUpRightIcon
        : comparison.difference < 0
          ? ArrowDownRightIcon
          : EqualIcon;

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card p-4 break-inside-avoid">
      <dt className="text-subhead font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="text-title1 font-bold tracking-tight tabular-nums">
        {value}
      </dd>
      <dd className="text-footnote text-muted-foreground">{detail}</dd>
      {comparison && (
        <dd className="flex items-start gap-1.5 text-footnote text-muted-foreground">
          <Icon aria-hidden="true" className="mt-px size-4 shrink-0" />
          {comparison.text}
        </dd>
      )}
    </div>
  );
}
