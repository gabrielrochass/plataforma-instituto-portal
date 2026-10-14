import { CircleCheckIcon } from "lucide-react";
import Link from "next/link";
import { Money } from "@/components/ui/money";
import type { JarSnapshot } from "@/lib/data";
import { formatMonth } from "@/lib/dates";
import type { Pace } from "@/lib/goals";
import { m } from "@/lib/i18n";
import { formatWholeBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export function JarForecast({ snapshot }: { snapshot: JarSnapshot }) {
  const { jar, forecast } = snapshot;

  return (
    <section
      aria-labelledby="previsao"
      className="flex flex-col gap-6 rounded-2xl bg-card p-5 sm:p-6"
    >
      <h2
        id="previsao"
        className="text-footnote font-semibold text-muted-foreground"
      >
        {m.jars.forecast}
      </h2>
      {forecast.status === "done" ? (
        <p className="flex items-center gap-2 text-title3 font-semibold text-income">
          <CircleCheckIcon aria-hidden="true" className="size-6 shrink-0" />
          {m.jars.reached}
        </p>
      ) : jar.target_cents === null ? (
        <NoGoal jarId={jar.id} pace={forecast.pace} />
      ) : (
        <WithGoal snapshot={snapshot} />
      )}
    </section>
  );
}

function WithGoal({ snapshot }: { snapshot: JarSnapshot }) {
  const { jar, forecast } = snapshot;
  const { pace, needed, eta, deadline, monthsLate } = forecast;
  const passed = jar.target_date && !deadline && (
    <Note>
      {m.jars.deadlinePassed(formatMonth(jar.target_date.slice(0, 7)))}
    </Note>
  );
  const plan = (hero: boolean, note?: string) =>
    deadline &&
    needed !== null && (
      <Figure
        label={m.jars.toReachBy(formatMonth(deadline))}
        hero={hero}
        note={note}
        late
      >
        <Money whole cents={needed} /> {m.jars.perMonth}
      </Figure>
    );

  if (!pace) {
    return (
      <>
        {plan(true)}
        <Notes>
          <Note>{m.jars.noPace}</Note>
          {passed}
        </Notes>
      </>
    );
  }

  if (!eta) {
    return deadline ? (
      plan(true, m.jars.notReaching)
    ) : (
      <>
        <p className="text-headline font-semibold">{m.jars.noForecast}</p>
        <Notes>
          <Note>{m.jars.startSaving}</Note>
          {passed}
        </Notes>
      </>
    );
  }

  const late = monthsLate !== null && monthsLate > 0;

  return (
    <>
      <Figure
        label={m.jars.arrivesIn}
        hero
        note={monthsLate === null ? undefined : deadlineGap(monthsLate)}
        late={late}
      >
        {formatMonth(eta)}
      </Figure>
      {late && plan(false)}
      <Notes>
        <Note>{paceSentence(pace)}</Note>
        {passed}
      </Notes>
    </>
  );
}

function NoGoal({ jarId, pace }: { jarId: string; pace: Pace | null }) {
  return (
    <>
      {pace && pace.cents > 0 && (
        <p className="text-body">{paceSentence(pace)}</p>
      )}
      <Link
        href={`/cofrinhos/${jarId}/editar`}
        className="flex min-h-11 w-fit items-center text-subhead font-medium text-link sm:min-h-6"
      >
        {m.jars.setGoal}
      </Link>
    </>
  );
}

function deadlineGap(late: number) {
  if (late > 0) return m.jars.afterDeadline(m.jars.months(late));
  if (late < 0) return m.jars.beforeDeadline(m.jars.months(-late));
  return m.jars.onDeadline;
}

function paceSentence(pace: Pace) {
  const amount = formatWholeBRL(pace.cents);
  return pace.months === 0
    ? m.jars.plannedSaving(amount)
    : m.jars.savedAverage(amount, pace.months);
}

function Figure({
  label,
  hero,
  note,
  late,
  children,
}: {
  label: string;
  hero: boolean;
  note?: string;
  late: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-subhead text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-bold tracking-tight tabular-nums first-letter:uppercase",
          hero ? "text-title1" : "text-title3",
        )}
      >
        {children}
      </p>
      {note && (
        <p
          className={cn(
            "text-subhead font-medium",
            late ? "text-warning" : "text-income",
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}

function Notes({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-footnote text-muted-foreground">{children}</p>;
}
