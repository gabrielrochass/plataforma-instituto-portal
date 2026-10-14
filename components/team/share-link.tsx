"use client";

import { CircleCheckIcon, CopyIcon, MessageCircleIcon } from "lucide-react";
import { useId } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { m } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ShareLink({
  title,
  hint,
  link,
  message,
  children,
}: {
  title: string;
  hint: string;
  link: string;
  message: string;
  children?: React.ReactNode;
}) {
  const id = useId();

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.add({ title: m.team.copied, type: "success" });
    } catch {
      document.getElementById(id)?.focus();
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-4 rounded-2xl bg-card p-5"
    >
      <h2
        id={`${id}-title`}
        tabIndex={-1}
        ref={(element) => element?.focus()}
        className="flex items-start gap-2 text-headline font-semibold"
      >
        <CircleCheckIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-success"
        />
        {title}
      </h2>
      <p className="text-subhead text-muted-foreground">{hint}</p>
      <label htmlFor={id} className="sr-only">
        {m.team.linkLabel}
      </label>
      <input
        id={id}
        readOnly
        value={link}
        onFocus={(event) => event.currentTarget.select()}
        className="h-11 w-full min-w-0 truncate rounded-lg border border-input bg-muted px-3 text-subhead"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "lg" }), "h-12 text-body")}
        >
          <MessageCircleIcon aria-hidden="true" />
          {m.team.shareWhatsApp}
        </a>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12 text-body"
          onClick={copy}
        >
          <CopyIcon aria-hidden="true" />
          {m.team.copy}
        </Button>
      </div>
      {children}
    </section>
  );
}
