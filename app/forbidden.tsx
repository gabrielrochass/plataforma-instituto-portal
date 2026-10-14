import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.errors.forbiddenTitle };

export default function Forbidden() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-title2 font-bold tracking-tight text-balance">
        {m.errors.forbiddenTitle}
      </h1>
      <p className="text-subhead text-balance text-muted-foreground">
        {m.errors.forbiddenDescription}
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        {m.errors.home}
      </Link>
    </main>
  );
}
