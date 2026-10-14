import type { Metadata } from "next";
import { SignupFlow } from "@/components/auth/signup-flow";
import { SwitchLink } from "@/components/auth/switch-link";
import { safeNext, withNext } from "@/lib/auth-paths";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.auth.signUpTitle };

export default async function SignUpPage({
  searchParams,
}: PageProps<"/cadastro">) {
  const next = safeNext((await searchParams).next);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-10 py-12">
      <SignupFlow next={next} />
      <SwitchLink
        question={m.auth.hasAccount}
        label={m.auth.signIn}
        href={withNext("/entrar", next)}
      />
    </div>
  );
}
