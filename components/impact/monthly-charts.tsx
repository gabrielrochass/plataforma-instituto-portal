"use client";

import { useState } from "react";
import { m } from "@/lib/i18n";
import { attendanceGoal, niceMax, presenceStatus } from "@/lib/impact";
import { cn } from "@/lib/utils";
import { statusStyle } from "./status";

const i = m.impact;

export type MonthPoint = {
  key: string;
  short: string;
  full: string;
  active: number | null;
  presence: number | null;
  partial: boolean;
};

const axisWidth = "w-10";
const plotInset = "left-12";

function LineChart({
  title,
  readout,
  months,
  values,
  max,
  suffix = "",
  goal,
  variant = "line",
  active,
  onPick,
}: {
  title: string;
  readout: React.ReactNode;
  months: readonly MonthPoint[];
  values: readonly (number | null)[];
  max: number;
  suffix?: string;
  goal?: number;
  variant?: "line" | "bar";
  active: number;
  onPick: (index: number) => void;
}) {
  const step = 100 / months.length;
  const xOf = (index: number) => step * index + step / 2;
  const yOf = (value: number) => 100 - (value / max) * 100;
  const segments: { x: number; y: number }[][] = [];
  values.forEach((value, index) => {
    if (value === null) {
      segments.push([]);
      return;
    }
    if (segments.length === 0) segments.push([]);
    segments[segments.length - 1].push({ x: xOf(index), y: yOf(value) });
  });
  const lines = segments.filter((segment) => segment.length > 0);
  const ticks = [max, max / 2, 0];

  return (
    <figure className="flex flex-col gap-4 rounded-2xl bg-card p-4 break-inside-avoid">
      <figcaption className="flex flex-col gap-0.5">
        <span className="text-headline font-semibold">{title}</span>
        <span className="flex min-h-5 items-center gap-1.5 text-subhead text-muted-foreground tabular-nums">
          {readout}
        </span>
      </figcaption>
      <div className="relative mt-2 mb-1 h-36">
        {ticks.map((tick) => (
          <div
            key={tick}
            aria-hidden="true"
            className="absolute inset-x-0 flex -translate-y-1/2 items-center"
            style={{ top: `${yOf(tick)}%` }}
          >
            <span
              className={cn(
                axisWidth,
                "shrink-0 pr-2 text-right text-caption text-muted-foreground tabular-nums",
              )}
            >
              {`${Math.round(tick)}${suffix}`}
            </span>
            <span className="ml-2 h-px flex-1 bg-border" />
          </div>
        ))}
        <div className={cn("absolute inset-y-0 right-0", plotInset)}>
          {goal !== undefined && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-muted-foreground"
              style={{ top: `${yOf(goal)}%` }}
            >
              <span className="absolute left-0 -top-5 rounded bg-card pr-1 text-caption font-medium text-muted-foreground">
                {i.goal(goal)}
              </span>
            </div>
          )}
          {variant === "bar" ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 grid items-end"
              style={{
                gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
              }}
            >
              {values.map((value, index) => (
                <div
                  key={months[index].key}
                  className="relative flex h-full items-end justify-center"
                >
                  {value !== null && (
                    <>
                      {index === active && (
                        <span
                          className="absolute -translate-y-full pb-1 text-caption font-semibold text-foreground tabular-nums"
                          style={{ bottom: `${(value / max) * 100}%` }}
                        >
                          {`${value}${suffix}`}
                        </span>
                      )}
                      <span
                        className={cn(
                          "w-3/5 max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity forced-color-adjust-none print:[print-color-adjust:exact]",
                          index !== active && "opacity-40",
                        )}
                        style={{
                          height: `${(value / max) * 100}%`,
                          minHeight: value > 0 ? 3 : 0,
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute inset-0 size-full overflow-visible"
              >
                {lines.map((segment) => (
                  <polyline
                    key={`${segment[0].x}`}
                    points={segment
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    className="stroke-chart-1"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <span
                aria-hidden="true"
                className="absolute inset-y-0 w-px bg-foreground/20"
                style={{ left: `${xOf(active)}%` }}
              />
              {values.map((value, index) =>
                value === null ? null : (
                  <span
                    key={months[index].key}
                    aria-hidden="true"
                    className={cn(
                      "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1 ring-2 ring-card forced-color-adjust-none print:[print-color-adjust:exact]",
                      index === active && "size-3",
                      months[index].partial && "bg-card ring-chart-1",
                    )}
                    style={{ left: `${xOf(index)}%`, top: `${yOf(value)}%` }}
                  />
                ),
              )}
            </>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
            }}
          >
            {months.map((month, index) => (
              <div
                key={month.key}
                onPointerEnter={() => onPick(index)}
                onPointerDown={() => onPick(index)}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="ml-12 grid"
        style={{
          gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
        }}
      >
        {months.map((month, index) => (
          <span
            key={month.key}
            className={cn(
              "truncate text-center text-caption text-muted-foreground",
              index === active && "font-semibold text-foreground",
            )}
          >
            {month.short}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function MonthlyCharts({ months }: { months: readonly MonthPoint[] }) {
  const last = Math.max(
    0,
    months.findLastIndex(
      (month) => month.active !== null || month.presence !== null,
    ),
  );
  const [active, setActive] = useState(last);
  const current = months[active];
  const status =
    current?.presence == null ? null : presenceStatus(current.presence);
  const StatusIcon = status ? statusStyle[status].icon : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2 print:grid-cols-2">
        <LineChart
          title={i.activeChart}
          readout={
            current &&
            `${current.full}: ${
              current.active === null
                ? i.noClasses
                : i.activeValue(current.active)
            }`
          }
          months={months}
          values={months.map((month) => month.active)}
          max={niceMax(
            Math.max(1, ...months.map((month) => month.active ?? 0)),
          )}
          active={active}
          onPick={setActive}
        />
        <LineChart
          title={i.attendanceChart}
          readout={
            current && (
              <>
                {StatusIcon && status && (
                  <StatusIcon
                    aria-hidden="true"
                    className={cn("size-4 shrink-0", statusStyle[status].text)}
                  />
                )}
                {`${current.full}: ${
                  current.presence === null
                    ? i.noClasses
                    : `${i.attendanceValue(current.presence)}${status ? `, ${i.statuses[status].toLowerCase()}` : ""}`
                }`}
              </>
            )
          }
          months={months}
          values={months.map((month) => month.presence)}
          max={100}
          suffix="%"
          goal={attendanceGoal}
          variant="bar"
          active={active}
          onPick={setActive}
        />
      </div>
      {months.some((month) => month.partial) && (
        <p className="text-footnote text-muted-foreground">{i.partialMonth}</p>
      )}
      <details className="rounded-2xl bg-card px-4 text-subhead print:hidden">
        <summary className="flex min-h-11 cursor-pointer items-center text-link">
          {i.seeData}
        </summary>
        <table className="mb-3 w-full">
          <caption className="sr-only">{i.monthly}</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="py-2 font-medium">
                {i.month}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {i.activeChart}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {i.attendanceChart}
              </th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.key} className="border-b last:border-0">
                <th scope="row" className="py-2 text-left font-normal">
                  {month.full}
                </th>
                <td className="py-2 text-right tabular-nums">
                  {month.active ?? i.noData}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {month.presence === null
                    ? i.noData
                    : i.percent(month.presence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
