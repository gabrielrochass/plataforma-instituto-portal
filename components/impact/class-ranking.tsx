"use client";

import { ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { ChoiceChips } from "@/components/forms/choice-chips";
import { Button } from "@/components/ui/button";
import { m } from "@/lib/i18n";
import { type ImpactGroup, percent, presenceStatus } from "@/lib/impact";
import { cn } from "@/lib/utils";
import { StatusLegend, statusStyle } from "./status";

const i = m.impact;

const limit = 8;

type Sort = keyof typeof i.sorts;

export function ClassRanking({
  groups,
  linkable,
  sortable = true,
}: {
  groups: readonly ImpactGroup[];
  linkable: boolean;
  sortable?: boolean;
}) {
  const [sort, setSort] = useState<Sort>("attendance");
  const [all, setAll] = useState(false);
  const rows = groups
    .map((group) => ({
      ...group,
      attendance: percent(group.attended, group.recorded),
      completion: percent(group.completed, group.finished),
    }))
    .sort((a, b) => {
      const value = (row: typeof a) =>
        sort === "served" ? row.served : (row[sort] ?? -1);
      return value(b) - value(a) || a.name.localeCompare(b.name, "pt-BR");
    });

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
        {i.empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 break-inside-avoid">
      <div className={sortable ? "print:hidden" : "hidden"}>
        <ChoiceChips
          legend={i.sortBy}
          name="ordenar-turmas"
          value={sort}
          onChange={(next) => setSort(next as Sort)}
          options={(Object.keys(i.sorts) as Sort[]).map((key) => ({
            value: key,
            label: i.sorts[key],
          }))}
        />
      </div>
      <ul className="grid gap-x-8 md:grid-cols-2 print:grid-cols-2 [&>li]:border-b">
        {(all ? rows : rows.slice(0, limit)).map((row) => {
          const status =
            row.attendance === null ? null : presenceStatus(row.attendance);
          const Icon = status ? statusStyle[status].icon : null;
          const content = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-body font-medium [overflow-wrap:anywhere]">
                  {row.name}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-subhead font-semibold tabular-nums">
                  {Icon && status && (
                    <Icon
                      aria-hidden="true"
                      className={cn("size-4", statusStyle[status].text)}
                    />
                  )}
                  {row.attendance === null
                    ? i.noData
                    : i.attendanceValue(row.attendance)}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="h-2.5 overflow-hidden rounded-full bg-muted"
              >
                {row.attendance !== null && status && (
                  <span
                    className="block h-full rounded-full bg-chart-1 forced-color-adjust-none print:[print-color-adjust:exact]"
                    style={{ width: `${row.attendance}%` }}
                  />
                )}
              </span>
              <span className="text-footnote text-muted-foreground tabular-nums">
                {i.classLine(
                  row.served,
                  row.completion === null ? null : i.percent(row.completion),
                )}
              </span>
            </>
          );
          return (
            <li key={row.id}>
              {linkable ? (
                <Link
                  href={`/turmas/${row.id}` as Route}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/40 focus-visible:-outline-offset-2!"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    {content}
                  </span>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className="size-5 shrink-0 text-muted-foreground print:hidden"
                  />
                </Link>
              ) : (
                <div className="flex flex-col gap-1.5 py-3">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
      {rows.length > limit && (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="self-start print:hidden"
          onClick={() => setAll(!all)}
        >
          {all ? i.showLess : i.showAll(rows.length)}
        </Button>
      )}
      <StatusLegend />
    </div>
  );
}
