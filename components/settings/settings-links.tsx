import { ChevronRightIcon, type LucideIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { swatch } from "@/lib/palette";
import { cn } from "@/lib/utils";

export type SettingsLink = {
  href: Route;
  title: string;
  hint?: string;
  icon: LucideIcon;
  color?: string;
};

export function SettingsLinks({ links }: { links: readonly SettingsLink[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {links.map(({ href, title, hint, icon: Icon, color }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex min-h-15 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:-outline-offset-2!"
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                color
                  ? cn("text-swatch-foreground", swatch(color))
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-body font-medium">{title}</span>
              {hint && (
                <span className="text-footnote text-muted-foreground">
                  {hint}
                </span>
              )}
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
