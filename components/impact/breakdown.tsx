import { EyeOffIcon } from "lucide-react";
import { m } from "@/lib/i18n";
import { percent } from "@/lib/impact";

export type BreakdownRow = { key: string; label: string; value: number | null };

export function Breakdown({
  title,
  hint,
  rows,
  total,
}: {
  title: string;
  hint?: string;
  rows: readonly BreakdownRow[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value ?? 0));

  return (
    <figure className="flex flex-col gap-3 rounded-2xl bg-card p-4 break-inside-avoid">
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-headline font-semibold">{title}</span>
        {hint && (
          <span className="text-footnote text-muted-foreground">{hint}</span>
        )}
      </figcaption>
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
                      <EyeOffIcon aria-hidden="true" className="size-4" />
                      {m.impact.hidden}
                    </span>
                  ) : (
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">
                        {row.value.toLocaleString("pt-BR")}
                      </span>
                      {share !== null && (
                        <span className="text-muted-foreground">
                          {", "}
                          {m.impact.percent(share)}
                        </span>
                      )}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  {row.value !== null && row.value > 0 && (
                    <span
                      className="block h-full rounded-full bg-chart-1 forced-color-adjust-none print:[print-color-adjust:exact]"
                      style={{ width: `${(row.value / max) * 100}%` }}
                    />
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
