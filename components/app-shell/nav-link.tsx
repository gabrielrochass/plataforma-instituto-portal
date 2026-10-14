"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  className,
  children,
  tour,
}: {
  href: Route;
  className: string;
  tour?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-tour={tour}
      className={className}
    >
      {children}
    </Link>
  );
}
