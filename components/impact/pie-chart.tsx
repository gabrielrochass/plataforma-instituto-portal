"use client";

import { LockIcon } from "lucide-react";
import { useId, useState } from "react";
import { m } from "@/lib/i18n";
import { percent } from "@/lib/impact";
import { cn } from "@/lib/utils";

const i = m.impact;

const palette = [
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-5)",
];

export type PieSlice = { key: string; label: string; value: number | null };

type Part = {
  key: string;
  label: string;
  value: number;
  color: string;
  hidden?: boolean;
};

function partsOf(slices: readonly PieSlice[], total: number) {
  const named = slices.filter(
    (slice) =>
      slice.key !== "unknown" && slice.value !== null && slice.value > 0,
  );
  const kept = named.length > palette.length ? named.slice(0, 4) : named;
  const rest = named.slice(kept.length);
  const parts: Part[] = kept.map((slice, index) => ({
    key: slice.key,
    label: slice.label,
    value: slice.value ?? 0,
    color: palette[index],
  }));
  if (rest.length > 0) {
    parts.push({
      key: "outros",
      label: i.otherGroups,
      value: rest.reduce((sum, slice) => sum + (slice.value ?? 0), 0),
      color: palette[4],
    });
  }
  const unknown = slices.find((slice) => slice.key === "unknown");
  if (unknown?.value) {
    parts.push({
      key: "unknown",
      label: unknown.label,
      value: unknown.value,
      color: "var(--chart-other)",
    });
  }
  const shown = parts.reduce((sum, part) => sum + part.value, 0);
  if (total > shown && slices.some((slice) => slice.value === null)) {
    parts.push({
      key: "protegido",
      label: i.hidden,
      value: total - shown,
      color: "var(--chart-other)",
      hidden: true,
    });
  }
  return parts;
}

export function PieChart({
  title,
  slices,
  total,
}: {
  title: string;
  slices: readonly PieSlice[];
  total: number;
}) {
  const id = useId();
  const [active, setActive] = useState<string | null>(null);
  const parts = partsOf(slices, total);
  const sum = parts.reduce((acc, part) => acc + part.value, 0);
  const current = parts.find((part) => part.key === active) ?? null;
  const gap = parts.length > 1 ? 0.8 : 0;
  let start = 0;

  return (
    <figure className="flex flex-col gap-4 rounded-2xl bg-card p-4 break-inside-avoid">
      <figcaption className="text-headline font-semibold">{title}</figcaption>
      {sum === 0 ? (
        <p className="text-subhead text-muted-foreground">{i.empty}</p>
      ) : (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <div className="relative size-36 shrink-0">
            <svg
              viewBox="0 0 42 42"
              aria-hidden="true"
              className="size-full -rotate-90"
            >
              <defs>
                <pattern
                  id={`${id}-hatch`}
                  width="2"
                  height="2"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="2" height="2" fill="var(--muted)" />
                  <rect width="0.8" height="2" fill="var(--chart-other)" />
                </pattern>
              </defs>
              {parts.map((part) => {
                const share = (part.value / sum) * 100;
                const offset = start;
                start += share;
                return (
                  <circle
                    key={part.key}
                    cx="21"
                    cy="21"
                    r="15.9155"
                    fill="none"
                    stroke={part.hidden ? `url(#${id}-hatch)` : part.color}
                    strokeWidth={active === part.key ? 7 : 6}
                    strokeDasharray={`${Math.max(share - gap, 0.4)} ${100 - Math.max(share - gap, 0.4)}`}
                    strokeDashoffset={-offset}
                    pathLength={100}
                    className={cn(
                      "transition-[opacity,stroke-width] forced-color-adjust-none print:[print-color-adjust:exact]",
                      active !== null && active !== part.key && "opacity-30",
                    )}
                    onPointerEnter={() => setActive(part.key)}
                    onPointerLeave={() => setActive(null)}
                  />
                );
              })}
            </svg>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              <span className="text-title3 font-bold tabular-nums">
                {current
                  ? i.percent(percent(current.value, sum) ?? 0)
                  : sum.toLocaleString("pt-BR")}
              </span>
              <span className="line-clamp-2 text-caption leading-tight text-muted-foreground">
                {current ? current.label : i.people.toLowerCase()}
              </span>
            </div>
          </div>
          <ul className="flex w-full min-w-0 flex-col gap-1">
            {parts.map((part) => (
              <li key={part.key}>
                <button
                  type="button"
                  aria-pressed={active === part.key}
                  onClick={() =>
                    setActive(active === part.key ? null : part.key)
                  }
                  onPointerEnter={() => setActive(part.key)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(part.key)}
                  onBlur={() => setActive(null)}
                  className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-subhead transition-colors hover:bg-muted/60 aria-pressed:bg-muted"
                >
                  {part.hidden ? (
                    <LockIcon
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full forced-color-adjust-none print:[print-color-adjust:exact]"
                      style={{ backgroundColor: part.color }}
                    />
                  )}
                  <span className="min-w-0 flex-1">{part.label}</span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold">
                      {i.percent(percent(part.value, sum) ?? 0)}
                    </span>
                    {!part.hidden && (
                      <span className="text-muted-foreground">{` (${part.value.toLocaleString("pt-BR")})`}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  );
}
