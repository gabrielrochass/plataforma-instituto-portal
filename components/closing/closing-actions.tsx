"use client";

import { LockIcon, LockOpenIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { closeMonth, reopenMonth } from "@/lib/actions";
import { m } from "@/lib/i18n";

export function ClosingActions({
  month,
  monthName,
  closedOn,
}: {
  month: string;
  monthName: string;
  closedOn: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function run(closing: boolean) {
    startTransition(async () => {
      const result = await (closing ? closeMonth : reopenMonth)(month);
      if (!result.ok) {
        toast.add({ title: result.message, type: "error" });
        return;
      }
      toast.add({
        title: (closing ? m.closing.closedToast : m.closing.reopenedToast)(
          monthName,
        ),
        type: "success",
      });
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-5">
      {closedOn ? (
        <>
          <p className="flex items-center gap-2 text-body font-medium">
            <LockIcon
              aria-hidden="true"
              className="size-5 shrink-0 text-link"
            />
            {m.closing.closedOn(closedOn)}
          </p>
          <Button
            variant="outline"
            size="lg"
            disabled={pending}
            focusableWhenDisabled
            onClick={() => run(false)}
          >
            <LockOpenIcon aria-hidden="true" />
            {m.closing.reopen}
          </Button>
        </>
      ) : (
        <>
          <p className="text-subhead text-muted-foreground">
            {m.closing.closeHint}
          </p>
          <Button
            size="lg"
            className="h-12 text-body"
            disabled={pending}
            focusableWhenDisabled
            onClick={() => run(true)}
          >
            <LockIcon aria-hidden="true" />
            {m.closing.close(monthName)}
          </Button>
        </>
      )}
    </section>
  );
}
