import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CircleAlertIcon,
  EqualIcon,
} from "lucide-react";
import { Money } from "@/components/ui/money";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";

export type Comparison = {
  current: number;
  previous: number;
  reference: string;
};

export function ComparisonLine({
  comparison,
  label,
}: {
  comparison: Comparison;
  label?: string;
}) {
  const difference = comparison.current - comparison.previous;
  const Icon =
    difference < 0
      ? ArrowDownRightIcon
      : difference > 0
        ? ArrowUpRightIcon
        : EqualIcon;

  return (
    <p className="flex items-start gap-1.5 text-footnote text-muted-foreground">
      <Icon aria-hidden="true" className="mt-px size-4 shrink-0" />
      <span>
        {label && <span className="font-medium">{label}: </span>}
        {difference === 0
          ? m.analysis.sameAs(comparison.reference)
          : (difference < 0 ? m.analysis.lessThan : m.analysis.moreThan)(
              formatBRL(Math.abs(difference)),
              comparison.reference,
            )}
      </span>
    </p>
  );
}

export function MonthSummary({
  title,
  cents,
  comparison,
  income,
}: {
  title: string;
  cents: number;
  comparison?: Comparison | null;
  income?: number;
}) {
  const left = (income ?? 0) - cents;

  return (
    <section
      aria-labelledby="resumo-do-mes"
      className="flex flex-col gap-1 rounded-2xl bg-card p-5"
    >
      <h2 id="resumo-do-mes" className="text-subhead text-muted-foreground">
        {title}
      </h2>
      <p>
        <Money
          cents={cents}
          className="text-display font-bold tracking-tight tabular-nums"
        />
      </p>
      {comparison && <ComparisonLine comparison={comparison} />}
      {income !== undefined && income > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-3 border-t pt-3 text-footnote text-muted-foreground tabular-nums">
          <span>
            {m.analysis.income} {formatBRL(income)}
          </span>
          {left >= 0 ? (
            <span className="font-medium text-foreground">
              {m.analysis.left(formatBRL(left))}
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-expense">
              <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
              {m.analysis.short(formatBRL(left))}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
