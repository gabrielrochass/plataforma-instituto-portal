import { PlusIcon } from "lucide-react";
import { NewEntryLink } from "@/components/app-shell/new-entry-link";
import { m } from "@/lib/i18n";
import { type NavItem, primaryNav } from "./nav-items";
import { NavLink } from "./nav-link";

export function TabBar() {
  const [first, second, ...rest] = primaryNav;

  return (
    <nav
      aria-label={m.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden [@media(prefers-reduced-transparency:reduce)]:bg-card"
    >
      <ul className="mx-auto grid h-(--tabbar-h) max-w-md grid-cols-5 items-center">
        <TabItem item={first} />
        <TabItem item={second} />
        <li className="flex justify-center">
          <NewEntryLink
            size="icon-lg"
            aria-label={m.nav.add}
            data-tour="novo"
            className="rounded-full shadow-sm"
          >
            <PlusIcon aria-hidden="true" className="size-6" />
          </NewEntryLink>
        </li>
        {rest.map((item) => (
          <TabItem key={item.href} item={item} />
        ))}
      </ul>
    </nav>
  );
}

function TabItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        href={item.href}
        tour={item.tour}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-caption2 font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-link [&_svg]:stroke-[1.75] aria-[current=page]:[&_svg]:stroke-[2.25]"
      >
        <Icon aria-hidden="true" className="size-6" />
        {item.label}
      </NavLink>
    </li>
  );
}
