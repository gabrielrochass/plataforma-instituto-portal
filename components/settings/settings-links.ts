import {
  BookOpenIcon,
  Building2Icon,
  CalendarOffIcon,
  InboxIcon,
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
    ...(can.manageTeam(viewer)
      ? [
          {
            href: "/inscricoes" as const,
            title: m.requests.title,
            hint: m.requests.hint,
            icon: InboxIcon,
            color: "chart-5",
          },
          {
            href: "/ajustes/cursos" as const,
            title: m.courses.title,
            hint: m.courses.hint,
            icon: BookOpenIcon,
            color: "chart-1",
          },
          {
            href: "/ajustes/calendario" as const,
            title: m.calendar.title,
            hint: m.calendar.hint,
            icon: CalendarOffIcon,
            color: "chart-2",
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
