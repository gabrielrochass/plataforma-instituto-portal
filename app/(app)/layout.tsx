import { Suspense } from "react";
import { SideNav } from "@/components/app-shell/side-nav";
import { TabBar } from "@/components/app-shell/tab-bar";
import { Tour } from "@/components/onboarding/tour";
import { getFirstDay, getOnboardingDone } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [onboarded, firstDay] = await Promise.all([
    getOnboardingDone(),
    getFirstDay(),
  ]);

  return (
    <>
      <div className="flex min-h-dvh">
        <SideNav />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-3xl min-w-0 px-4 pt-6 pb-[calc(var(--bottom-inset)+2rem)] sm:px-6 md:pt-10"
        >
          {children}
        </main>
      </div>
      <TabBar />
      <Suspense fallback={null}>
        <Tour autoStart={!onboarded} hasEntries={firstDay !== null} />
      </Suspense>
    </>
  );
}
