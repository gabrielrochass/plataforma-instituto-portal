import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { addMonths, formatMonth } from "@/lib/dates";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MonthStepper({
  month,
  hrefFor,
}: {
  month: string;
  hrefFor: (month: string) => Route;
}) {
  const stepClass = cn(
    buttonVariants({ variant: "ghost", size: "icon-lg" }),
    "rounded-full",
  );

  return (
    <nav
      aria-label={formatMonth(month)}
      className="flex items-center justify-between gap-2"
    >
      <Link
        href={hrefFor(addMonths(month, -1))}
        aria-label={m.transactions.previousMonth}
        className={stepClass}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-6" />
      </Link>
      <h2 className="text-headline font-semibold first-letter:uppercase">
        {formatMonth(month)}
      </h2>
      <Link
        href={hrefFor(addMonths(month, 1))}
        aria-label={m.transactions.nextMonth}
        className={stepClass}
      >
        <ChevronRightIcon aria-hidden="true" className="size-6" />
      </Link>
    </nav>
  );
}
