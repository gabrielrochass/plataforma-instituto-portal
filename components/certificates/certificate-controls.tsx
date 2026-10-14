"use client";

import { AwardIcon, BanIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { TextField } from "@/components/forms/text-field";
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
import {
  issueCertificates,
  revokeCertificate,
} from "@/lib/actions/certificates";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

const c = m.certificates;

export function IssueButton({ classId }: { classId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="lg"
      className="self-start"
      disabled={pending}
      focusableWhenDisabled
      onClick={() =>
        startTransition(async () => {
          const result = await attempt(issueCertificates(classId), failed);
          toast.add(
            result.ok
              ? { title: c.issued(result.count), type: "success" }
              : { title: result.message ?? m.common.tryAgain, type: "error" },
          );
        })
      }
    >
      <AwardIcon aria-hidden="true" />
      {c.issue}
    </Button>
  );
}

export function RevokeButton({
  certificateId,
  name,
}: {
  certificateId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon-lg" aria-label={c.revoke(name)} />
        }
      >
        <BanIcon aria-hidden="true" className="size-5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{c.revokeTitle}</AlertDialogTitle>
          <AlertDialogDescription>{c.revokeText}</AlertDialogDescription>
        </AlertDialogHeader>
        <TextField
          label={c.revokeReason}
          value={reason}
          maxLength={200}
          error={error}
          onChange={(event) => setReason(event.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">{m.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            disabled={pending}
            onClick={() => {
              if (!reason.trim()) {
                setError(c.reasonRequired);
                return;
              }
              startTransition(async () => {
                const result = await attempt(
                  revokeCertificate({ id: certificateId, reason }),
                  failed,
                );
                if (result.ok) {
                  setOpen(false);
                  toast.add({ title: c.revokedToast, type: "success" });
                } else {
                  toast.add({
                    title: result.message ?? m.common.tryAgain,
                    type: "error",
                  });
                }
              });
            }}
          >
            {c.revokeConfirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
