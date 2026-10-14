import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legal } from "@/lib/i18n";

export const metadata: Metadata = { title: legal.privacy.title };

export default function PrivacyPage() {
  return <LegalPage document={legal.privacy} />;
}
