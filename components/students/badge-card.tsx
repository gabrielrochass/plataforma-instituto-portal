import { PortalLogo } from "@/components/brand/portal-logo";
import { badgePayload } from "@/lib/badge";
import { m } from "@/lib/i18n";
import { initials } from "@/lib/people";
import { QrCode } from "./qr-code";

export type Badge = {
  id: string;
  name: string;
  photo: string | null;
  token: string;
  classes: string;
  unit: string;
};

export function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <article
      aria-label={m.badges.cardLabel(badge.name)}
      className="flex h-[86mm] w-[54mm] flex-col items-center gap-[2mm] overflow-hidden rounded-[3mm] border border-dashed border-foreground/40 bg-white p-[3mm] text-center text-[#2a2418] [print-color-adjust:exact] break-inside-avoid"
    >
      <PortalLogo className="h-[7mm] w-auto shrink-0" />
      {badge.photo ? (
        // biome-ignore lint/performance/noImgElement: signed URLs from private storage expire and skip the image optimizer
        <img
          src={badge.photo}
          alt=""
          className="size-[22mm] shrink-0 rounded-[2mm] object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-[22mm] shrink-0 items-center justify-center rounded-[2mm] bg-[#efe8d8] text-[8mm] font-semibold"
        >
          {initials(badge.name)}
        </span>
      )}
      <p className="line-clamp-2 text-[4mm] leading-tight font-bold">
        {badge.name}
      </p>
      <p className="line-clamp-2 text-[2.6mm] leading-tight">{badge.classes}</p>
      <QrCode
        value={badgePayload(badge.token)}
        label={m.badges.qrLabel(badge.name)}
        className="mt-auto size-[24mm] shrink-0"
      />
      <p className="font-mono text-[2.4mm] tracking-wider">
        {m.badges.code(badge.unit, badge.token)}
      </p>
    </article>
  );
}

export function BadgeSheet({ badges }: { badges: readonly Badge[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-[4mm] print:justify-start">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
