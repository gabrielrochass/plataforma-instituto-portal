"use client";

import { ArrowDownLeftIcon, ArrowUpRightIcon, Trash2Icon } from "lucide-react";
import { useOptimistic, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteJarEntry, restoreJarEntry } from "@/lib/actions";
import { attempt, failed } from "@/lib/attempt";
import type { JarEntry } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export function JarEntries({
  jarId,
  entries,
  today,
}: {
  jarId: string;
  entries: JarEntry[];
  today: string;
}) {
  const [, startTransition] = useTransition();
  const [shown, hide] = useOptimistic(entries, (list, id: string) =>
    list.filter((entry) => entry.id !== id),
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  function remove(entry: JarEntry) {
    headingRef.current?.focus();
    startTransition(async () => {
      hide(entry.id);
      const result = await attempt(deleteJarEntry(entry.id), failed);
      if (!result.ok) {
        toast.add({ title: result.message, type: "error" });
        return;
      }
      const undoId = toast.add({
        title: m.jars.entryDeleted,
        timeout: 10_000,
        actionProps: {
          children: m.entry.undo,
          onClick: async () => {
            const restored = await attempt(
              restoreJarEntry({
                id: entry.id,
                jarId,
                kind: entry.kind,
                amountCents: entry.amount_cents,
                occurredOn: entry.occurred_on,
                note: entry.note ?? "",
                isOpening: entry.is_opening,
              }),
              failed,
            );
            headingRef.current?.focus();
            toast.close(undoId);
            toast.add({
              title: restored.ok ? m.jars.entryRestored : restored.message,
            });
          },
        },
      });
    });
  }

  return (
    <section aria-labelledby="movimentacoes" className="flex flex-col gap-3">
      <h2
        ref={headingRef}
        id="movimentacoes"
        tabIndex={-1}
        className="px-1 text-title3 font-semibold"
      >
        {m.jars.history}
      </h2>
      {shown.length === 0 ? (
        <p className="rounded-2xl bg-card p-4 text-subhead text-muted-foreground">
          {m.jars.noHistory}
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl bg-card">
          {shown.map((entry) => {
            const deposit = entry.kind === "deposit";
            const Icon = deposit ? ArrowDownLeftIcon : ArrowUpRightIcon;
            const title = entry.is_opening
              ? m.jars.openingEntry
              : (entry.note ??
                (deposit ? m.jars.depositEntry : m.jars.withdrawalEntry));
            const amount = `${deposit ? "+" : "−"}${formatBRL(entry.amount_cents)}`;
            return (
              <li
                key={entry.id}
                className="flex min-h-15 items-center gap-3 py-2 pr-1 pl-4"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    deposit
                      ? "bg-income/12 text-income"
                      : "bg-expense/12 text-expense",
                  )}
                >
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body">{title}</span>
                  <span className="text-footnote text-muted-foreground">
                    {formatDate(entry.occurred_on, today)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center">
                  <span
                    className={cn(
                      "text-body font-semibold tabular-nums",
                      deposit && "text-income",
                    )}
                  >
                    {amount}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label={m.jars.deleteEntry(title, amount)}
                    onClick={() => remove(entry)}
                    className="text-muted-foreground"
                  >
                    <Trash2Icon aria-hidden="true" className="size-5" />
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
