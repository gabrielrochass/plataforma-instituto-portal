import type { Route } from "next";
import { BackLink } from "./back-link";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: Route; label?: string; mobileOnly?: boolean };
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1 pb-6">
      {back && (
        <BackLink
          href={back.href}
          label={back.label}
          mobileOnly={back.mobileOnly}
        />
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-large-title font-bold tracking-tight text-balance">
          {title}
        </h1>
        {action}
      </div>
      {subtitle && (
        <p className="text-subhead text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
