import { m } from "@/lib/i18n";

export default function Loading() {
  return (
    <output className="flex flex-col gap-6 pt-1">
      <span className="sr-only">{m.common.loading}</span>
      <span className="h-10 w-44 animate-pulse rounded-lg bg-muted" />
      <span className="h-36 animate-pulse rounded-2xl bg-card" />
      <span className="h-56 animate-pulse rounded-2xl bg-card" />
    </output>
  );
}
