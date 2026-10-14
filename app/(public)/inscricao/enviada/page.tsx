import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/brand/public-header";
import { buttonVariants } from "@/components/ui/button";
import { m } from "@/lib/i18n";

export const metadata: Metadata = {
  title: m.requests.sentTitle,
  robots: { index: false },
};

export default async function RequestSentPage({
  searchParams,
}: PageProps<"/inscricao/enviada">) {
  const { protocolo } = await searchParams;
  const protocol =
    typeof protocolo === "string" && /^[2-9A-HJ-NP-Z]{8}$/.test(protocolo)
      ? protocolo
      : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 py-12">
      <PublicHeader title={m.requests.sentTitle} text={m.requests.sentText} />
      {protocol && (
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-5">
          <p className="text-footnote text-muted-foreground">
            {m.requests.protocol}
          </p>
          <p className="font-mono text-title1 font-bold tracking-widest tabular-nums">
            {protocol}
          </p>
        </div>
      )}
      <Link
        href="/inscricao"
        className={buttonVariants({ size: "lg", variant: "secondary" })}
      >
        {m.requests.another}
      </Link>
    </div>
  );
}
