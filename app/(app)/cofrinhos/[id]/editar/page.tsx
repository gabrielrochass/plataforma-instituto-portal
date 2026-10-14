import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { JarEditor } from "@/components/jars/jar-editor";
import { getJars } from "@/lib/data";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.jars.editJar };

export default async function EditJarPage({
  params,
}: PageProps<"/cofrinhos/[id]/editar">) {
  const { id } = await params;
  const jar = (await getJars()).find((candidate) => candidate.id === id);
  if (!jar) notFound();

  return (
    <>
      <PageHeader
        title={m.jars.editJar}
        back={{ href: `/cofrinhos/${jar.id}` as Route, label: jar.name }}
      />
      <JarEditor jar={jar} />
    </>
  );
}
