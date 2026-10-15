import { Building2Icon } from "lucide-react";
import type { Metadata, Route } from "next";
import { LinkList } from "@/components/app-shell/link-list";
import { PageHeader } from "@/components/app-shell/page-header";
import { UnitForm } from "@/components/team/unit-form";
import { getUnits } from "@/lib/data/team";
import { requireAdminGeral } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.units.title };

export default async function UnitsPage() {
  await requireAdminGeral();
  const units = await getUnits();

  return (
    <>
      <PageHeader
        title={m.units.title}
        back={{ href: "/mais", mobileOnly: true }}
      />
      <div className="flex flex-col gap-8">
        <LinkList
          links={units.map((unit) => ({
            href: `/unidades/${unit.id}` as Route,
            title: unit.name,
            hint: unit.code,
            icon: Building2Icon,
            color: "chart-4",
          }))}
        />
        <section aria-labelledby="nova-unidade" className="flex flex-col gap-3">
          <h2 id="nova-unidade" className="px-1 text-title3 font-semibold">
            {m.units.new}
          </h2>
          <UnitForm />
        </section>
      </div>
    </>
  );
}
