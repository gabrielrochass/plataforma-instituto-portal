import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell/page-header";
import { JarEntries } from "@/components/jars/jar-entries";
import { JarForecast } from "@/components/jars/jar-forecast";
import { JarMovement } from "@/components/jars/jar-movement";
import { JarProgress } from "@/components/jars/jar-summary";
import { buttonVariants } from "@/components/ui/button";
import { getJarEntries, getJarSnapshots, getJars } from "@/lib/data";
import { todayInSaoPaulo } from "@/lib/dates";
import { m } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/cofrinhos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const jar = (await getJars()).find((candidate) => candidate.id === id);
  return { title: jar?.name ?? m.nav.jars };
}

export default async function JarPage({
  params,
}: PageProps<"/cofrinhos/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const today = todayInSaoPaulo();
  const [snapshots, entries] = await Promise.all([
    getJarSnapshots(today),
    getJarEntries(id),
  ]);
  const snapshot = snapshots.find((candidate) => candidate.jar.id === id);
  if (!snapshot) notFound();
  const { jar, balance } = snapshot;

  return (
    <>
      <PageHeader
        title={jar.name}
        back={{ href: "/cofrinhos", label: m.nav.jars }}
        action={
          <Link
            href={`/cofrinhos/${jar.id}/editar`}
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            {m.jars.edit}
          </Link>
        }
      />
      <div className="flex flex-col gap-8">
        <section
          aria-label={m.jars.balance}
          className="rounded-2xl bg-card p-5"
        >
          <JarProgress snapshot={snapshot} showName={false} />
        </section>
        <JarForecast snapshot={snapshot} />
        {!jar.archived_at && <JarMovement jarId={jar.id} balance={balance} />}
        <JarEntries jarId={jar.id} entries={entries} today={today} />
      </div>
    </>
  );
}
