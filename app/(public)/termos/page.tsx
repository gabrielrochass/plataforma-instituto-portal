import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legal } from "@/lib/i18n";

export const metadata: Metadata = { title: legal.terms.title };

export default function TermsPage() {
  return <LegalPage document={legal.terms} />;
}
