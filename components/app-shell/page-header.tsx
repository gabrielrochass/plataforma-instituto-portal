import { ChevronLeftIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: Route; label: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1 pb-6">
      {back && (
        <Link
          href={back.href}
          className="-ml-1 flex w-fit min-h-11 items-center gap-0.5 text-body text-link"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {back.label}
        </Link>
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
