"use client";

import { useState } from "react";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type TrendBar = {
  key: string;
  label: string;
  fullLabel: string;
  value: number | null;
  display: string;
  partial: boolean;
};

export function BarTrend({
  title,
  bars,
  max,
  valueHeader,
  note,
}: {
  title: string;
  bars: readonly TrendBar[];
  max?: number;
  valueHeader: string;
  note?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = max ?? Math.max(1, ...bars.map((bar) => bar.value ?? 0));
  const last = bars.findLastIndex((bar) => bar.value !== null);
  const shown = active ?? last;

  return (
    <figure className="flex flex-col gap-3 rounded-2xl bg-card p-4 break-inside-avoid">
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-headline font-semibold">{title}</span>
        <span className="min-h-5 text-footnote text-muted-foreground tabular-nums">
          {shown >= 0 && bars[shown]
            ? `${bars[shown].fullLabel}: ${bars[shown].display}`
            : m.impact.empty}
        </span>
      </figcaption>
      <div aria-hidden="true" className="flex flex-col gap-1.5">
        <div
          className="grid h-36 items-end gap-1 border-b border-border"
          style={{
            gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
          }}
          onPointerLeave={() => setActive(null)}
        >
          {bars.map((bar, index) => (
            <div
              key={bar.key}
              className="flex h-full items-end"
              onPointerEnter={() => setActive(index)}
            >
              {bar.value !== null && (
                <div
                  className={cn(
                    "w-full rounded-t-[4px] text-chart-1 forced-color-adjust-none print:[print-color-adjust:exact]",
                    bar.partial
                      ? "border-2 border-b-0 border-current bg-[repeating-linear-gradient(135deg,currentColor_0_2px,transparent_2px_6px)]"
                      : "bg-current",
                    active !== null && active !== index && "opacity-60",
                  )}
                  style={{
                    height: `${(bar.value / top) * 100}%`,
                    minHeight: bar.value > 0 ? 3 : 0,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))`,
          }}
        >
          {bars.map((bar, index) => (
            <span
              key={bar.key}
              className={cn(
                "truncate text-center text-caption text-muted-foreground",
                index === shown && "font-semibold text-foreground",
              )}
            >
              {bar.label}
            </span>
          ))}
        </div>
      </div>
      {note && <p className="text-footnote text-muted-foreground">{note}</p>}
      <details className="text-subhead print:hidden">
        <summary className="min-h-11 cursor-pointer content-center text-link">
          {m.impact.seeData}
        </summary>
        <table className="mt-2 w-full">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="py-2 font-medium">
                {m.impact.month}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {valueHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.key} className="border-b last:border-0">
                <th scope="row" className="py-2 text-left font-normal">
                  {bar.fullLabel}
                </th>
                <td className="py-2 text-right tabular-nums">{bar.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
