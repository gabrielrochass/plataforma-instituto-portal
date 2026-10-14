import { ChevronLeftIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { settingsNav } from "./nav-items";

export function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: { href: Route; label: string };
  action?: React.ReactNode;
}) {
  const SettingsIcon = settingsNav.icon;
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
        <h1 className="min-w-0 text-large-title font-bold tracking-tight">
          {title}
        </h1>
        {action}
        {!back && !action && (
          <Link
            href={settingsNav.href}
            aria-label={settingsNav.label}
            data-tour="ajustes"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-lg" }),
              "md:hidden",
            )}
          >
            <SettingsIcon aria-hidden="true" className="size-6" />
          </Link>
        )}
      </div>
    </header>
  );
}
