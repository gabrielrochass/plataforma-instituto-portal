import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ResultLabel({
  result,
}: {
  result: keyof typeof m.grades.result;
}) {
  const approved = result === "approved";
  const Icon = approved ? CircleCheckIcon : CircleAlertIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-footnote font-medium",
        approved ? "text-success" : "text-warning",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {m.grades.result[result]}
    </span>
  );
}
