"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { renewBadge } from "@/lib/actions/students";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

const b = m.badges;

export function RenewBadgeButton({ studentId }: { studentId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button type="button" variant="ghost" size="lg" />}
      >
        <RefreshCwIcon aria-hidden="true" />
        {b.renew}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{b.renewTitle}</AlertDialogTitle>
          <AlertDialogDescription>{b.renewText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">{m.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            size="lg"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await attempt(renewBadge(studentId), failed);
                toast.add(
                  result.ok
                    ? { title: b.renewed, type: "success" }
                    : {
                        title: result.message ?? m.common.tryAgain,
                        type: "error",
                      },
                );
              })
            }
          >
            {b.renew}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
