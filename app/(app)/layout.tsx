import { Suspense } from "react";
import { SideNav } from "@/components/app-shell/side-nav";
import { TabBar } from "@/components/app-shell/tab-bar";
import { Tour } from "@/components/onboarding/tour";
import { getProfile } from "@/lib/data/account";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  return (
    <>
      <div className="flex min-h-dvh">
        <SideNav />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-3xl min-w-0 px-4 pt-6 pb-[calc(var(--bottom-inset)+2rem)] has-data-wide:max-w-6xl sm:px-6 md:pt-10"
        >
          {children}
        </main>
      </div>
      <TabBar />
      <Suspense fallback={null}>
        <Tour autoStart={!profile?.onboarding_done_at} />
      </Suspense>
    </>
  );
}
