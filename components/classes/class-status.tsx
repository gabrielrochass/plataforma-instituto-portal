import {
  CalendarClockIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleSlashIcon,
  HourglassIcon,
} from "lucide-react";
import type { ClassPhase } from "@/lib/class-phase";
import { formatFullDate } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const icons = {
  upcoming: CalendarClockIcon,
  current: CircleDotIcon,
  toClose: HourglassIcon,
  finished: CircleCheckIcon,
  cancelled: CircleSlashIcon,
};

export function ClassStatus({
  phase,
  startsOn,
  className,
}: {
  phase: ClassPhase;
  startsOn: string;
  className?: string;
}) {
  const Icon = icons[phase];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-footnote font-medium",
        phase === "current" && "text-success",
        phase === "toClose" && "text-warning",
        (phase === "upcoming" ||
          phase === "finished" ||
          phase === "cancelled") &&
          "text-muted-foreground",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {phase === "upcoming"
        ? m.classes.status.upcoming(formatFullDate(startsOn))
        : m.classes.status[phase]}
    </span>
  );
}
