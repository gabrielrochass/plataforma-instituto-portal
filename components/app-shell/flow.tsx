"use client";

import { ChevronLeftIcon } from "lucide-react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { useGoBack } from "@/hooks/use-go-back";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const flowBarButton =
  "h-auto min-h-11 px-3 py-2 text-center whitespace-normal";

export function FlowHeader({
  title,
  subtitle,
  fallback,
  action,
}: {
  title: string;
  subtitle?: string;
  fallback: Route;
  action?: React.ReactNode;
}) {
  const leave = useGoBack(fallback);

  return (
    <header className="sticky top-0 z-10 grid grid-cols-[2.75rem_1fr_2.75rem] items-center bg-background/90 px-2 pt-[env(safe-area-inset-top)] backdrop-blur-xl min-[360px]:grid-cols-[6rem_1fr_6rem] [@media(prefers-reduced-transparency:reduce)]:bg-background">
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className="justify-self-start px-2 text-link"
        onClick={leave}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
        <span className="max-[359px]:sr-only">{m.common.back}</span>
      </Button>
      <div className="flex min-w-0 flex-col items-center py-2 text-center">
        <h1 className="text-headline font-semibold text-balance">{title}</h1>
        {subtitle && (
          <p className="text-footnote text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div className="justify-self-end">{action}</div>}
    </header>
  );
}

export function FlowBar({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-flow-bar
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/90 backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-background"
    >
      <div
        className={cn(
          "mx-auto flex max-w-xl flex-col gap-2 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]",
          className,
        )}
      >
        <output className="block min-h-5 text-center text-footnote text-muted-foreground">
          {status}
        </output>
        <div className="grid auto-cols-fr grid-flow-col gap-2">{children}</div>
      </div>
    </div>
  );
}
