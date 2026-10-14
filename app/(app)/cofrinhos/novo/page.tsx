import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { JarEditor } from "@/components/jars/jar-editor";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.jars.newJar };

export default function NewJarPage() {
  return (
    <>
      <PageHeader
        title={m.jars.newJar}
        back={{ href: "/cofrinhos", label: m.nav.jars }}
      />
      <JarEditor jar={null} />
    </>
  );
}
