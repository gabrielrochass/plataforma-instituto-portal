import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { AuthLegal } from "@/components/auth/auth-legal";
import { PublicHeader } from "@/components/brand/public-header";
import { SubmitButton } from "@/components/forms/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { acceptInviteSignedIn } from "@/lib/actions/access";
import { getInvite, getSignedInEmail } from "@/lib/data/access";
import { m } from "@/lib/i18n";

export const metadata: Metadata = {
  title: m.invite.title,
  robots: { index: false },
  referrer: "no-referrer",
};

export default async function InvitePage({
  params,
}: PageProps<"/convite/[token]">) {
  const { token } = await params;
  const [invite, email] = await Promise.all([
    getInvite(token),
    getSignedInEmail(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 py-12">
      {invite ? (
        <>
          <PublicHeader
            title={m.invite.title}
            text={m.invite.text(
              invite.display_name,
              invite.admin_geral ? m.roles.adminGeral : m.roles[invite.role],
              invite.admin_geral ? null : invite.unit_name,
            )}
          />
          {email !== null ? (
            <form
              action={acceptInviteSignedIn.bind(null, token)}
              className="flex flex-col gap-3"
            >
              <p className="text-center text-subhead text-muted-foreground">
                {m.invite.signedInAs(email)}
              </p>
              <SubmitButton size="lg" className="h-12 text-body">
                {m.invite.acceptSignedIn}
              </SubmitButton>
            </form>
          ) : (
            <>
              <p className="text-center text-subhead">
                {m.invite.createAccess}
              </p>
              <AcceptInviteForm
                token={token}
                defaultName={invite.display_name}
              />
              <AuthLegal />
            </>
          )}
        </>
      ) : (
        <>
          <PublicHeader
            title={m.invite.invalidTitle}
            text={m.invite.invalidText}
          />
          <Link
            href="/entrar"
            className={buttonVariants({ size: "lg", variant: "secondary" })}
          >
            {m.auth.signIn}
          </Link>
        </>
      )}
    </div>
  );
}
