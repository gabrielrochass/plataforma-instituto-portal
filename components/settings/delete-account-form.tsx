"use client";

import { Trash2Icon } from "lucide-react";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/lib/account-actions";
import { m } from "@/lib/i18n";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, null);
  const errorId = useId();

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex min-h-11 items-start gap-3 text-subhead">
        <input
          type="checkbox"
          name="confirm"
          required
          aria-describedby={state ? errorId : undefined}
          className="mt-0.5 size-5 shrink-0 accent-destructive"
        />
        {m.account.deleteConfirm}
      </label>
      {state && (
        <p id={errorId} role="alert" className="text-footnote text-destructive">
          {state.message}
        </p>
      )}
      <Button
        type="submit"
        variant="destructive"
        size="lg"
        disabled={pending}
        focusableWhenDisabled
      >
        <Trash2Icon aria-hidden="true" />
        {pending ? m.account.deleting : m.account.delete}
      </Button>
    </form>
  );
}
