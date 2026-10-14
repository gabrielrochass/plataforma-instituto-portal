"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SegmentedNav({
  label,
  items,
}: {
  label: string;
  items: readonly { href: Route; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1 pb-6">
      <ul className="flex w-max gap-1 rounded-full bg-secondary p-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="flex min-h-10 items-center rounded-full px-4 text-subhead font-medium text-secondary-foreground transition-colors hover:bg-card/60 aria-[current=page]:bg-card aria-[current=page]:font-semibold"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
