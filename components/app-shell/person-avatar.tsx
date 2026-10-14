import { initials } from "@/lib/people";
import { cn } from "@/lib/utils";

export function PersonAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-subhead font-semibold text-secondary-foreground",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
