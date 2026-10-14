import { ChevronRightIcon, PiggyBankIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/app-shell/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { JarProgress } from "@/components/jars/jar-summary";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { getJarSnapshots, type JarSnapshot } from "@/lib/data";
import { todayInSaoPaulo } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: m.nav.jars };

const newJar = (
  <Link
    href="/cofrinhos/novo"
    className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-fit")}
  >
    <PlusIcon aria-hidden="true" />
    {m.jars.newJar}
  </Link>
);

export default async function JarsPage() {
  const snapshots = await getJarSnapshots(todayInSaoPaulo());
  const active = snapshots.filter((snapshot) => !snapshot.jar.archived_at);
  const archived = snapshots.filter((snapshot) => snapshot.jar.archived_at);

  if (snapshots.length === 0) {
    return (
      <>
        <PageHeader title={m.nav.jars} />
        <EmptyState
          icon={PiggyBankIcon}
          title={m.jars.emptyTitle}
          description={m.jars.emptyDescription}
          action={newJar}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title={m.nav.jars} />
      <div className="flex flex-col gap-8">
        <section
          aria-labelledby="total-guardado"
          className="flex flex-col gap-1 rounded-2xl bg-card p-5"
        >
          <h2
            id="total-guardado"
            className="text-subhead text-muted-foreground"
          >
            {m.jars.totalSaved}
          </h2>
          <p>
            <Money
              cents={active.reduce(
                (sum, snapshot) => sum + snapshot.balance,
                0,
              )}
              className="text-display font-bold tracking-tight tabular-nums"
            />
          </p>
        </section>

        <div className="flex flex-col gap-3">
          {active.length > 0 && <JarList snapshots={active} />}
          {newJar}
        </div>

        {archived.length > 0 && (
          <section
            aria-labelledby="cofrinhos-arquivados"
            className="flex flex-col gap-3"
          >
            <h2
              id="cofrinhos-arquivados"
              className="px-1 text-footnote font-semibold text-muted-foreground"
            >
              {m.settings.archived}
            </h2>
            <JarList snapshots={archived} />
          </section>
        )}
      </div>
    </>
  );
}

function JarList({ snapshots }: { snapshots: JarSnapshot[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {snapshots.map((snapshot) => (
        <li key={snapshot.jar.id}>
          <Link
            href={`/cofrinhos/${snapshot.jar.id}`}
            className="flex items-start gap-2 rounded-2xl bg-card p-4 transition-colors hover:bg-muted/60"
          >
            <span className="min-w-0 flex-1">
              <JarProgress snapshot={snapshot} />
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="mt-3 size-5 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
