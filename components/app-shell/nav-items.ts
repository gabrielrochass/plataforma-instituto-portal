import {
  EllipsisIcon,
  GraduationCapIcon,
  HouseIcon,
  type LucideIcon,
  SettingsIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { Route } from "next";
import { m } from "@/lib/i18n";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
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

export const settingsNav: NavItem = {
  href: "/ajustes",
  label: m.nav.settings,
  icon: SettingsIcon,
  tour: "ajustes",
};

export const sideNav: readonly NavItem[] = [home, classes, students];

export const tabNav: readonly NavItem[] = [home, classes, students, more];
