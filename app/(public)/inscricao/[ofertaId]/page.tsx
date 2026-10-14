import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/brand/public-header";
import { RequestForm } from "@/components/requests/request-form";
import { buttonVariants } from "@/components/ui/button";
import { getOpenOffers } from "@/lib/data/requests";
import { m } from "@/lib/i18n";

export const metadata: Metadata = { title: m.requests.publicTitle };

export default async function RequestPage({
  params,
}: PageProps<"/inscricao/[ofertaId]">) {
  const { ofertaId } = await params;
  const offer = (await getOpenOffers()).find((item) => item.id === ofertaId);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 py-12">
      {offer ? (
        <>
          <PublicHeader
            title={m.requests.applyFor(offer.class_name, offer.unit_name)}
          />
          <RequestForm offerId={offer.id} />
        </>
      ) : (
        <>
          <PublicHeader title={m.requests.errors.closed} />
          <Link
            href="/inscricao"
            className={buttonVariants({ size: "lg", variant: "secondary" })}
          >
            {m.requests.publicTitle}
          </Link>
        </>
      )}
    </div>
  );
}
