import {
  Building2Icon,
  ChartColumnIcon,
  ContactRoundIcon,
  EllipsisIcon,
  GraduationCapIcon,
  HouseIcon,
  InboxIcon,
  type LucideIcon,
  MegaphoneIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { Route } from "next";
import { m } from "@/lib/i18n";
import { can, type Viewer } from "@/lib/roles";

export type NavItem = {
  href: Route;
  label: string;
  hint?: string;
  icon: LucideIcon;
  color?: string;
  tour?: string;
};

const home: NavItem = { href: "/", label: m.nav.home, icon: HouseIcon };

const classes: NavItem = {
  href: "/turmas",
  label: m.nav.classes,
  icon: UsersRoundIcon,
  tour: "turmas",
};

const students: NavItem = {
  href: "/alunos",
  label: m.nav.students,
  icon: GraduationCapIcon,
  tour: "alunos",
};

const more: NavItem = {
  href: "/mais",
  label: m.nav.more,
  icon: EllipsisIcon,
  tour: "mais",
};

export const accountNav: NavItem = {
  href: "/conta",
  label: m.account.title,
  hint: m.account.hint,
  icon: UserRoundIcon,
  color: "chart-other",
  tour: "conta",
};

export const tabNav: readonly NavItem[] = [home, classes, students, more];

export function workNav(viewer: Viewer): NavItem[] {
  return [
    ...(can.manageTeam(viewer)
      ? [
          {
            href: "/equipe",
            label: m.team.title,
            hint: m.team.hint,
            icon: ContactRoundIcon,
            color: "chart-3",
          } satisfies NavItem,
        ]
      : []),
    {
      href: "/avisos",
      label: m.announcements.title,
      hint: m.announcements.hint,
      icon: MegaphoneIcon,
      color: "chart-2",
    },
    ...(can.manageTeam(viewer)
      ? ([
          {
            href: "/inscricoes",
            label: m.requests.title,
            hint: m.requests.hint,
            icon: InboxIcon,
            color: "chart-5",
          },
          {
            href: "/impacto",
            label: m.impact.title,
            hint: m.impact.hint,
            icon: ChartColumnIcon,
            color: "chart-1",
          },
        ] satisfies NavItem[])
      : []),
    ...(can.manageUnits(viewer)
      ? [
          {
            href: "/unidades",
            label: m.units.title,
            hint: m.units.hint,
            icon: Building2Icon,
            color: "chart-4",
          } satisfies NavItem,
        ]
      : []),
  ];
}

export function sideNav(viewer: Viewer): NavItem[] {
  return [home, classes, students, ...workNav(viewer)];
}

export type AddOption =
  | "attendance"
  | "student"
  | "class"
  | "teacher"
  | "unitAdmin"
  | "adminGeral"
  | "announcement";

export function addOptions(viewer: Viewer): AddOption[] {
  return [
    ...(viewer.teaches || can.manageTeam(viewer)
      ? (["attendance"] as const)
      : []),
    "student",
    "class",
    ...(can.manageTeam(viewer) ? (["teacher"] as const) : []),
    ...(viewer.isAdminGeral ? (["unitAdmin", "adminGeral"] as const) : []),
    ...(can.postAnnouncement(viewer) ? (["announcement"] as const) : []),
  ];
}
