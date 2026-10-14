import { PortalMark } from "@/components/brand/portal-logo";

export function PublicHeader({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <PortalMark className="size-16" />
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-title1 font-bold tracking-tight text-balance">
          {title}
        </h1>
        {text && (
          <p className="text-body text-balance text-muted-foreground">{text}</p>
        )}
      </div>
    </header>
  );
}
