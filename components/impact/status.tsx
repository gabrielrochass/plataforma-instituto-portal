import {
  CircleAlertIcon,
  CircleCheckIcon,
  type LucideIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { m } from "@/lib/i18n";
import { attendanceGoal, type PresenceStatus } from "@/lib/impact";

export const statusStyle: Record<
  PresenceStatus,
  { icon: LucideIcon; fill: string; text: string }
> = {
  good: { icon: CircleCheckIcon, fill: "bg-success", text: "text-success" },
  attention: {
    icon: CircleAlertIcon,
    fill: "bg-warning",
    text: "text-warning",
  },
  low: {
    icon: TriangleAlertIcon,
    fill: "bg-destructive",
    text: "text-destructive",
  },
};

export const statusFill: Record<PresenceStatus, string> = {
  good: "var(--success)",
  attention: "var(--warning)",
  low: "var(--destructive)",
};

export function StatusLegend() {
  const ranges = m.impact.statusRanges;
  const items: [PresenceStatus, string][] = [
    ["good", ranges.good(attendanceGoal)],
    ["attention", ranges.attention(attendanceGoal)],
    ["low", ranges.low],
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-muted-foreground">
      {items.map(([status, range]) => {
        const Icon = statusStyle[status].icon;
        return (
          <li key={status} className="flex items-center gap-1.5">
            <Icon
              aria-hidden="true"
              className={`size-4 ${statusStyle[status].text}`}
            />
            <span>
              <span className="font-medium text-foreground">
                {m.impact.statuses[status]}
              </span>
              {`: ${range}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
