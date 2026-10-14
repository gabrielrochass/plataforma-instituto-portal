"use client";

import { CircleSlashIcon } from "lucide-react";
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
import { cancelClass } from "@/lib/actions/classes";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export function CancelClassButton({
  classId,
  name,
}: {
  classId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="lg" className="self-start" />
        }
      >
        <CircleSlashIcon aria-hidden="true" />
        {m.classes.cancel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.classes.cancelTitle(name)}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.classes.cancelText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">{m.common.back}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await attempt(cancelClass(classId), failed);
                toast.add(
                  result.ok
                    ? { title: m.classes.cancelled, type: "success" }
                    : {
                        title: result.message ?? m.common.tryAgain,
                        type: "error",
                      },
                );
              })
            }
          >
            {m.classes.cancel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
