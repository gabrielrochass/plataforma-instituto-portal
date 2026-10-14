"use client";

import {
  CalendarXIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatFullDate, formatMonth } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { formatTime, type Session, workloadMinutes } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export function sessionKey(session: Session) {
  return `${session.heldOn} ${session.startsAt}`;
}

export function SessionsPreview({
  sessions,
  excluded,
  skipped,
  onToggle,
  workloadHours,
  today,
}: {
  sessions: readonly Session[];
  excluded: readonly { heldOn: string; reason: string }[];
  skipped: readonly string[];
  onToggle: (key: string) => void;
  workloadHours: number | null;
  today: string;
}) {
  const kept = sessions.filter(
    (session) => !skipped.includes(sessionKey(session)),
  );
  const minutes = workloadMinutes(kept);
  const missing = workloadHours ? workloadHours * 60 - minutes : 0;
  const months = new Map<string, Session[]>();
  for (const session of sessions) {
    const month = session.heldOn.slice(0, 7);
    months.set(month, [...(months.get(month) ?? []), session]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-2xl bg-card p-4">
        <p className="text-body font-medium tabular-nums">
          {kept.length > 0
            ? m.wizard.summary(
                kept.length,
                formatFullDate(kept[0].heldOn),
                formatFullDate(kept.at(-1)?.heldOn ?? kept[0].heldOn),
                m.classes.hours(minutes),
              )
            : m.wizard.noSessions}
        </p>
        {workloadHours !== null && kept.length > 0 && (
          <p
            className={cn(
              "flex items-start gap-2 text-subhead",
              missing > 0 ? "text-warning" : "text-success",
            )}
          >
            {missing > 0 ? (
              <CircleAlertIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
            ) : (
              <CircleCheckIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
            )}
            {missing > 0
              ? m.wizard.workloadShort(m.classes.hours(missing))
              : m.wizard.workloadOk}
          </p>
        )}
      </div>

      {[...months.entries()].map(([month, monthSessions]) => (
        <section
          key={month}
          aria-label={formatMonth(month)}
          className="flex flex-col gap-2"
        >
          <h3 className="px-1 text-headline font-semibold first-letter:uppercase">
            {formatMonth(month)}
          </h3>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {monthSessions.map((session) => {
              const key = sessionKey(session);
              const off = skipped.includes(key);
              const date = formatDate(session.heldOn, today);
              return (
                <li
                  key={key}
                  className="flex min-h-13 items-center gap-3 px-4 py-2"
                >
                  <span
                    className={cn(
                      "flex-1 text-body tabular-nums",
                      off && "text-muted-foreground line-through",
                    )}
                  >
                    {m.classes.sessionLine(
                      date,
                      formatTime(session.startsAt),
                      formatTime(session.endsAt),
                    )}
                  </span>
                  {off && (
                    <span className="text-footnote text-muted-foreground">
                      {m.wizard.removed}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label={
                      off
                        ? m.wizard.restoreSession(date)
                        : m.wizard.removeSession(date)
                    }
                    onClick={() => onToggle(key)}
                  >
                    {off ? (
                      <RotateCcwIcon aria-hidden="true" className="size-5" />
                    ) : (
                      <XIcon aria-hidden="true" className="size-5" />
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {excluded.length > 0 && (
        <section aria-labelledby="sem-aula" className="flex flex-col gap-2">
          <h3 id="sem-aula" className="px-1 text-headline font-semibold">
            {m.wizard.excluded}
          </h3>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card">
            {excluded.map((day) => (
              <li
                key={day.heldOn}
                className="flex min-h-13 items-center gap-3 px-4 py-2"
              >
                <CalendarXIcon
                  aria-hidden="true"
                  className="size-5 shrink-0 text-muted-foreground"
                />
                <span className="flex-1 text-body tabular-nums">
                  {formatDate(day.heldOn, today)}
                </span>
                <span className="text-footnote text-muted-foreground">
                  {day.reason}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
