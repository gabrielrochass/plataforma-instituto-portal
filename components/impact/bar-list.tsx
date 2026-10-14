import { LockIcon } from "lucide-react";
import { m } from "@/lib/i18n";
import { percent } from "@/lib/impact";
import { cn } from "@/lib/utils";

export type BarRow = {
  key: string;
  label: string;
  value: number | null;
  color?: string;
};

export function BarList({
  title,
  hint,
  rows,
  total,
  color = "var(--chart-1)",
  headline,
  className,
}: {
  title: string;
  hint?: string;
  rows: readonly BarRow[];
  total: number;
  color?: string;
  headline?: string;
  className?: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value ?? 0));

  return (
    <figure
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-4 break-inside-avoid",
        className,
      )}
    >
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-headline font-semibold">{title}</span>
        {hint && (
          <span className="text-footnote text-muted-foreground">{hint}</span>
        )}
      </figcaption>
      {headline && (
        <p className="text-title3 font-semibold text-balance">{headline}</p>
      )}
      {rows.length === 0 ? (
        <p className="text-subhead text-muted-foreground">{m.impact.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => {
            const share = row.value === null ? null : percent(row.value, total);
            return (
              <li key={row.key} className="flex flex-col gap-1">
                <span className="flex items-baseline justify-between gap-3 text-subhead">
                  <span>{row.label}</span>
                  {row.value === null ? (
                    <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <LockIcon aria-hidden="true" className="size-3.5" />
                      {m.impact.hidden}
                    </span>
                  ) : (
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">
                        {row.value.toLocaleString("pt-BR")}
                      </span>
                      {share !== null && (
                        <span className="text-muted-foreground">
                          {` (${m.impact.percent(share)})`}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className="h-2.5 overflow-hidden rounded-full bg-muted"
                >
                  {row.value === null ? (
                    <span className="block h-full w-full bg-[repeating-linear-gradient(135deg,var(--border)_0_3px,transparent_3px_7px)]" />
                  ) : (
                    row.value > 0 && (
                      <span
                        className="block h-full rounded-full forced-color-adjust-none print:[print-color-adjust:exact]"
                        style={{
                          width: `${(row.value / max) * 100}%`,
                          backgroundColor: row.color ?? color,
                        }}
                      />
                    )
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}
