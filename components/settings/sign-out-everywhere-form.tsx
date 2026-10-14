"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signOutEverywhere } from "@/lib/account-actions";
import { m } from "@/lib/i18n";

export function SignOutEverywhereForm() {
  const [state, action, pending] = useActionState(signOutEverywhere, null);

  return (
    <form action={action} className="flex flex-col gap-2">
      <Button
        type="submit"
        variant="ghost"
        size="lg"
        className="w-full"
        disabled={pending}
        focusableWhenDisabled
      >
        {m.account.signOutEverywhere}
      </Button>
      {state && (
        <p role="alert" className="text-center text-footnote text-destructive">
          {state.message}
        </p>
      )}
      <p className="text-center text-footnote text-muted-foreground">
        {m.account.signOutEverywhereHint}
      </p>
    </form>
  );
}
