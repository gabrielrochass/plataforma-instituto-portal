import type { Route } from "next";
import Link from "next/link";

export const tabLinkClass =
  "-mb-px flex min-h-11 items-center border-b-2 border-transparent px-1 text-subhead font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:font-semibold aria-[current=page]:text-foreground forced-colors:aria-[current=page]:border-[Highlight]";

export function FilterLinks({
  label,
  items,
}: {
  label: string;
  items: readonly { href: Route; label: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1">
      <ul className="flex w-max min-w-full gap-5 border-b">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              replace
              scroll={false}
              aria-current={item.current ? "page" : undefined}
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
