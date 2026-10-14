import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PublicHeader } from "@/components/brand/public-header";
import { buttonVariants } from "@/components/ui/button";
import { getPasswordReset } from "@/lib/data/access";
import { m } from "@/lib/i18n";

export const metadata: Metadata = {
  title: m.reset.title,
  robots: { index: false },
  referrer: "no-referrer",
};

export default async function ResetPage({
  params,
}: PageProps<"/redefinir/[token]">) {
  const { token } = await params;
  const reset = await getPasswordReset(token);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 py-12">
      {reset ? (
        <>
          <PublicHeader
            title={m.reset.title}
            text={m.reset.text(reset.display_name)}
          />
          <ResetPasswordForm token={token} />
        </>
      ) : (
        <>
          <PublicHeader
            title={m.reset.invalidTitle}
            text={m.reset.invalidText}
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
