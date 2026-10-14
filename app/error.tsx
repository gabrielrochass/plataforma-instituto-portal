"use client";

import { Button } from "@/components/ui/button";
import { m } from "@/lib/i18n";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-title2 font-bold tracking-tight">{m.errors.title}</h1>
      <p className="text-subhead text-balance text-muted-foreground">
        {m.errors.description}
      </p>
      <Button size="lg" onClick={() => retry()}>
        {m.errors.retry}
      </Button>
    </main>
  );
}
