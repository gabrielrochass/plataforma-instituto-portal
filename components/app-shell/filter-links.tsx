import type { Route } from "next";
import Link from "next/link";

export function FilterLinks({
  label,
  items,
}: {
  label: string;
  items: readonly { href: Route; label: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1">
      <ul className="flex w-max gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className="flex min-h-11 items-center rounded-full bg-secondary px-4 text-subhead font-medium text-secondary-foreground transition-colors aria-[current=page]:bg-foreground aria-[current=page]:text-background forced-colors:border forced-colors:aria-[current=page]:border-[Highlight]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
