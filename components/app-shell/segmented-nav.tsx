"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabLinkClass } from "./filter-links";

export function SegmentedNav({
  label,
  items,
}: {
  label: string;
  items: readonly { href: Route; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="-mx-1 mb-6 overflow-x-auto px-1">
      <ul className="flex w-max min-w-full gap-5 border-b">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              replace
              aria-current={pathname === item.href ? "page" : undefined}
              className={tabLinkClass}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
