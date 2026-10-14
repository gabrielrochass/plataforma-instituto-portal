import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { m } from "@/lib/i18n";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: m.account.changePassword };

export default async function ChangePasswordPage() {
  const { claims } = await requireUser();

  return (
    <>
      <PageHeader
        title={m.account.changePassword}
        back={{ href: "/ajustes/conta", label: m.account.title }}
      />
      <div className="flex flex-col gap-6">
        <p className="text-body text-muted-foreground">
          {m.account.changePasswordIntro}
        </p>
        <ChangePasswordForm email={claims.email ?? ""} />
      </div>
    </>
  );
}
