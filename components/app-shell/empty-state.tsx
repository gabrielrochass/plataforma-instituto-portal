import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5 text-balance">
        <h2 className="text-headline font-semibold">{title}</h2>
        <p className="text-subhead text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  );
}
