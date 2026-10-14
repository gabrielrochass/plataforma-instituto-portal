import { UserPlusIcon } from "lucide-react";
import { Suspense } from "react";
import type { PrimaryAction } from "@/components/app-shell/primary-action-link";
import { SideNav } from "@/components/app-shell/side-nav";
import { TabBar } from "@/components/app-shell/tab-bar";
import { Tour } from "@/components/onboarding/tour";
import { getViewer } from "@/lib/data/viewer";
import { m } from "@/lib/i18n";

const registerStudent: PrimaryAction = {
  href: "/alunos/novo",
  label: m.students.new,
  icon: UserPlusIcon,
};

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();

  return (
    <>
      <div className="flex min-h-dvh">
        <SideNav action={registerStudent} />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-3xl min-w-0 px-4 pt-6 pb-[calc(var(--bottom-inset)+2rem)] has-data-wide:max-w-6xl sm:px-6 md:pt-10"
        >
          {children}
        </main>
      </div>
      <TabBar action={registerStudent} />
      <Suspense fallback={null}>
        <Tour autoStart={!viewer.onboarded} />
      </Suspense>
    </>
  );
}
