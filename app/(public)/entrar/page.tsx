import {
  CalendarCheckIcon,
  ChartPieIcon,
  CircleCheckIcon,
  PiggyBankIcon,
  ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { CredentialsForm } from "@/components/auth/credentials-form";
import { SwitchLink } from "@/components/auth/switch-link";
import { Tally } from "@/components/brand/tally";
import { devSignInEnabled, safeNext, withNext } from "@/lib/auth-paths";
import { legal, m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.auth.title };

const pointIcons = [ZapIcon, ChartPieIcon, CalendarCheckIcon];

export default async function SignInPage({
  searchParams,
}: PageProps<"/entrar">) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-10 py-12">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-[1.125rem] bg-primary text-primary-foreground shadow-sm">
          <PiggyBankIcon
            aria-hidden="true"
            className="size-9"
            strokeWidth={1.75}
          />
        </span>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-title1 font-bold tracking-tight" translate="no">
            {m.app.name}
          </h1>
          <Tally />
          <p className="text-body text-muted-foreground">{m.auth.tagline}</p>
        </div>
      </header>

      {params.conta === "excluida" && (
        <output className="flex items-start gap-2 rounded-xl bg-card px-4 py-3 text-subhead">
          <CircleCheckIcon
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-income"
          />
          {m.auth.deleted}
        </output>
      )}

      <ul className="flex flex-col gap-4">
        {m.auth.points.map((point, index) => {
          const Icon = pointIcons[index];
          return (
            <li key={point} className="flex items-start gap-3 text-body">
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-link"
              />
              {point}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3">
        <CredentialsForm next={next} />
        <details className="text-subhead">
          <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center font-medium text-link [&::-webkit-details-marker]:hidden">
            {m.auth.forgot}
          </summary>
          <p className="rounded-xl bg-card px-4 py-3 text-muted-foreground">
            {m.auth.forgotHelp(legal.controller.email)}
          </p>
        </details>
        <SwitchLink
          question={m.auth.noAccount}
          label={m.signup.create}
          href={withNext("/cadastro", next)}
        />
      </div>

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
