import type { Metadata } from "next";
import { AuthLegal } from "@/components/auth/auth-legal";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { PortalMark } from "@/components/brand/portal-logo";
import { devSignInEnabled, safeNext, withNext } from "@/lib/auth-paths";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.auth.title };

export default async function SignInPage({
  searchParams,
}: PageProps<"/entrar">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-10 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <PortalMark className="size-20" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-title1 font-bold tracking-tight" translate="no">
            {m.app.name}
          </h1>
          <p className="text-body text-balance text-muted-foreground">
            {m.auth.tagline}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <CredentialsForm next={next} />
        <details className="text-subhead">
          <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center font-medium text-link [&::-webkit-details-marker]:hidden">
            {m.auth.forgot}
          </summary>
          <p className="rounded-xl bg-card px-4 py-3 text-muted-foreground">
            {m.auth.forgotHelp}
          </p>
        </details>
        <p className="text-center text-subhead text-muted-foreground">
          {m.auth.noAccess}
        </p>
      </div>

      <AuthLegal />

      {devSignInEnabled() && (
        <a
          href={withNext("/dev/entrar", next)}
          className="flex min-h-11 w-fit items-center self-center text-subhead font-medium text-link"
        >
          {m.auth.dev}
        </a>
      )}
    </div>
  );
}
