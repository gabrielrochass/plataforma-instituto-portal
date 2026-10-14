import { PortalMark } from "@/components/brand/portal-logo";
import { m } from "@/lib/i18n";
import { AddMenu } from "./add-menu";
import { type AddOption, accountNav, type NavItem } from "./nav-items";
import { NavLink } from "./nav-link";

export function SideNav({
  items,
  add,
}: {
  items: readonly NavItem[];
  add: readonly AddOption[];
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 px-3 py-6 md:flex">
      <p className="flex items-center gap-3 px-3">
        <PortalMark className="size-9" />
        <span
          className="text-headline font-semibold tracking-tight"
          translate="no"
        >
          {m.app.name}
        </span>
      </p>
      <AddMenu items={add} className="mx-1 justify-start px-3" />
      <nav
        aria-label={m.nav.label}
        className="flex flex-1 flex-col justify-between"
      >
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <SideNavItem key={item.href} item={item} />
          ))}
        </ul>
        <ul>
          <SideNavItem item={accountNav} />
        </ul>
      </nav>
    </aside>
  );
}

function SideNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        href={item.href}
        tour={item.tour}
        className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-subhead text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground aria-[current=page]:bg-card aria-[current=page]:font-semibold aria-[current=page]:text-foreground [&_svg]:stroke-[1.75] aria-[current=page]:[&_svg]:stroke-[2.25]"
      >
        <Icon aria-hidden="true" className="size-5" />
        {item.label}
      </NavLink>
    </li>
  );
}
