import type { Route } from "next";
import Link from "next/link";

export function SwitchLink({
  question,
  label,
  href,
}: {
  question: string;
  label: string;
  href: Route;
}) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-1 text-subhead text-muted-foreground">
      {question}
      <Link
        href={href}
        className="flex min-h-11 items-center font-medium text-link"
      >
        {label}
      </Link>
    </p>
  );
}
