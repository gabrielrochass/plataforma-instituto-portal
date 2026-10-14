import type { Metadata } from "next";
import { SetupFlow } from "@/components/onboarding/setup-flow";
import { safeNext } from "@/lib/auth-paths";
import { m } from "@/lib/i18n";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: m.signup.categoriesQuestion };

export default async function SetupPage({
  searchParams,
}: PageProps<"/comecar">) {
  await requireUser();
  const next = safeNext((await searchParams).next);

  return (
    <main id="conteudo" tabIndex={-1} className="min-h-dvh px-6">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center py-12">
        <SetupFlow next={next} />
      </div>
    </main>
  );
}
