import {
  ArrowLeftRightIcon,
  ChartPieIcon,
  HouseIcon,
  type LucideIcon,
  PiggyBankIcon,
  SettingsIcon,
} from "lucide-react";
import type { Route } from "next";
import { m } from "@/lib/i18n";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  tour?: string;
};

export const primaryNav: readonly NavItem[] = [
  { href: "/", label: m.nav.home, icon: HouseIcon },
  {
    href: "/transacoes",
    label: m.nav.transactions,
    icon: ArrowLeftRightIcon,
    tour: "transacoes",
  },
  {
    href: "/cofrinhos",
    label: m.nav.jars,
    icon: PiggyBankIcon,
    tour: "cofrinhos",
  },
  {
    href: "/analises",
    label: m.nav.insights,
    icon: ChartPieIcon,
    tour: "analises",
  },
];

export const settingsNav: NavItem = {
  href: "/ajustes",
  label: m.nav.settings,
  icon: SettingsIcon,
  tour: "ajustes",
};
