import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app-shell/page-header";
import { CategoryEditor } from "@/components/settings/category-editor";
import { getCategories } from "@/lib/data";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.settings.editCategory };

export default async function EditCategoryPage({
  params,
}: PageProps<"/ajustes/categorias/[id]">) {
  const { id } = await params;
  const category = (await getCategories()).find(
    (candidate) => candidate.id === id,
  );
  if (!category) notFound();

  return (
    <>
      <PageHeader
        title={m.settings.editCategory}
        back={{ href: "/ajustes/categorias", label: m.settings.categories }}
      />
      <CategoryEditor category={category} />
    </>
  );
}
