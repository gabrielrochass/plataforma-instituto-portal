"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { restoreSession } from "@/lib/actions/attendance";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export function RestoreSessionButton({
  sessionId,
  label,
}: {
  sessionId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className="text-link"
      aria-label={label}
      disabled={pending}
      focusableWhenDisabled
      onClick={() =>
        startTransition(async () => {
          const result = await attempt(restoreSession(sessionId), failed);
          toast.add(
            result.ok
              ? { title: m.attendance.restored, type: "success" }
              : { title: result.message ?? m.common.tryAgain, type: "error" },
          );
        })
      }
    >
      {m.attendance.restore}
    </Button>
  );
}
