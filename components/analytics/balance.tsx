import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  type Comparison,
  ComparisonLine,
} from "@/components/analytics/month-summary";
import { Money } from "@/components/ui/money";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Balance({
  title,
  income,
  expenses,
  comparison,
  children,
  id = "saldo-do-mes",
}: {
  id?: string;
  title: string;
  income: number;
  expenses: number;
  comparison?: Comparison | null;
  children?: ReactNode;
}) {
  const net = income - expenses;

  return (
    <section
      aria-labelledby={id}
      data-tour="saldo"
      className="flex flex-col gap-1 rounded-2xl bg-card p-5"
    >
      <h2 id={id} className="text-subhead text-muted-foreground">
        {title}
      </h2>
      <p>
        <Money
          cents={net}
          className={cn(
            "text-display font-bold tracking-tight tabular-nums",
            net < 0 && "text-expense",
          )}
        />
      </p>
      {net < 0 ? (
        <p className="flex items-center gap-1.5 text-subhead font-medium text-expense">
          <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
          {m.balance.negative}
        </p>
      ) : (
        net > 0 && (
          <p className="flex items-center gap-1.5 text-subhead text-muted-foreground">
            <CircleCheckIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-income"
            />
            {m.balance.positive}
          </p>
        )
      )}
      {children}
      <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
        <div className="flex flex-col">
          <dt className="text-footnote text-muted-foreground">
            {m.balance.income}
          </dt>
          <dd className="text-body font-semibold tabular-nums">
            {formatBRL(income)}
          </dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-footnote text-muted-foreground">
            {m.balance.expenses}
          </dt>
          <dd className="text-body font-semibold tabular-nums">
            {formatBRL(expenses)}
          </dd>
        </div>
      </dl>
      {comparison && (
        <ComparisonLine comparison={comparison} label={m.balance.expenses} />
      )}
    </section>
  );
}
