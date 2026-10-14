import {
  Building2Icon,
  SparklesIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { ListLink } from "@/components/app-shell/link-list";
import { m } from "@/lib/i18n";
import { can, type Viewer } from "@/lib/roles";

export function adminLinks(viewer: Viewer): ListLink[] {
  return [
    ...(can.manageTeam(viewer)
      ? [
          {
            href: "/ajustes/equipe" as const,
            title: m.team.title,
            hint: m.team.hint,
            icon: UsersRoundIcon,
            color: "chart-3",
          },
        ]
      : []),
    ...(can.manageUnits(viewer)
      ? [
          {
            href: "/ajustes/unidades" as const,
            title: m.units.title,
            hint: m.units.hint,
            icon: Building2Icon,
            color: "chart-4",
          },
        ]
      : []),
  ];
}

export const personalLinks: ListLink[] = [
  {
    href: "/ajustes/conta",
    title: m.account.title,
    hint: m.account.hint,
    icon: UserRoundIcon,
    color: "chart-1",
  },
  {
    href: "/?tour=1",
    title: m.tour.replay,
    hint: m.tour.replayHint,
    icon: SparklesIcon,
    color: "chart-5",
  },
];
