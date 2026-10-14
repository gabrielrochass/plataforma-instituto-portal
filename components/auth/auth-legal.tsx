import Link from "next/link";
import { m } from "@/lib/i18n";

const inlineLink = "text-link underline underline-offset-2";

export function AuthLegal() {
  return (
    <div className="flex flex-col gap-2 text-footnote text-muted-foreground">
      <p>
        {m.auth.legal.start}
        <Link href="/termos" className={inlineLink}>
          {m.auth.legal.terms}
        </Link>
        {m.auth.legal.middle}
        <Link href="/privacidade" className={inlineLink}>
          {m.auth.legal.privacy}
        </Link>
        {m.auth.legal.end}
      </p>
      <p>{m.auth.cookies}</p>
    </div>
  );
}
