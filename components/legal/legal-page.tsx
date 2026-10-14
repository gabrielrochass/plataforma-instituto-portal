import { ChevronLeftIcon } from "lucide-react";
import { BackLink } from "@/components/legal/back-link";
import { formatFullDate } from "@/lib/dates";
import { type LegalDocument, legal } from "@/lib/i18n";

function fill(text: string) {
  return text
    .replaceAll("{nome}", legal.controller.name)
    .replaceAll("{email}", legal.controller.email)
    .replaceAll("{data}", formatFullDate(legal.effectiveDate))
    .replaceAll("{versao}", legal.version)
    .replaceAll("{backupDias}", String(legal.backupDays));
}

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-col gap-3">
        <BackLink className="-ml-1 flex w-fit min-h-11 items-center gap-0.5 text-body text-link">
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {legal.back}
        </BackLink>
        <h1 className="text-large-title font-bold tracking-tight">
          {document.title}
        </h1>
        <p className="text-subhead text-muted-foreground">
          {fill(document.intro)}
        </p>
      </header>
      {document.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-title3 font-semibold">{section.heading}</h2>
          {section.blocks.map((block, index) =>
            block.kind === "p" ? (
              block.text.startsWith(legal.important) ? (
                <p
                  key={`${section.heading}-${index}`}
                  className="rounded-xl bg-card p-4 text-body"
                >
                  <strong className="font-semibold">
                    {legal.important.trim()}
                  </strong>{" "}
                  {fill(block.text.slice(legal.important.length))}
                </p>
              ) : (
                <p key={`${section.heading}-${index}`} className="text-body">
                  {fill(block.text)}
                </p>
              )
            ) : (
              <ul
                key={`${section.heading}-${index}`}
                className="flex list-disc flex-col gap-1.5 pl-5 text-body"
              >
                {block.items.map((item) => (
                  <li key={item}>{fill(item)}</li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </article>
  );
}
