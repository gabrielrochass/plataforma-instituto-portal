"use client";

import { XIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { revokeInvite } from "@/lib/actions/team";
import { attempt, failed } from "@/lib/attempt";
import { m } from "@/lib/i18n";

export type PendingInvite = {
  id: string;
  name: string;
  detail: string;
  expires: string;
};

export function PendingInvites({ invites }: { invites: PendingInvite[] }) {
  const [pending, startTransition] = useTransition();

  function cancel(id: string) {
    startTransition(async () => {
      const result = await attempt(revokeInvite(id), failed);
      toast.add(
        result.ok
          ? { title: m.team.cancelled, type: "success" }
          : { title: result.message ?? m.common.tryAgain, type: "error" },
      );
    });
  }

  return (
    <ul className="divide-y overflow-hidden rounded-2xl bg-card">
      {invites.map((invite) => (
        <li
          key={invite.id}
          className="flex min-h-15 items-center gap-3 px-4 py-3"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-body font-medium">{invite.name}</span>
            <span className="text-footnote text-muted-foreground">
              {invite.detail}. {invite.expires}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={m.team.cancelInvite(invite.name)}
            disabled={pending}
            focusableWhenDisabled
            onClick={() => cancel(invite.id)}
          >
            <XIcon aria-hidden="true" className="size-5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
