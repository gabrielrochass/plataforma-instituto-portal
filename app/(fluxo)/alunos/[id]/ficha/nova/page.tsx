import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SocialProfileForm } from "@/components/social/social-profile-form";
import { getSocialProfiles } from "@/lib/data/social";
import { getStudent, getStudentCpf } from "@/lib/data/students";
import { m } from "@/lib/i18n";
import { displayName } from "@/lib/people";

export const metadata: Metadata = { title: m.social.newTitle };

export default async function NewSocialProfilePage({
  params,
}: PageProps<"/alunos/[id]/ficha/nova">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [student, access] = await Promise.all([
    getStudent(id),
    getStudentCpf(id),
  ]);
  if (!student || !access || access.anonymized) notFound();
  const [latest] = await getSocialProfiles(id);
  const consent = student.consents.some(
    (item) => item.kind === "sensitive_data" && item.revoked_on === null,
  );

  return (
    <SocialProfileForm
      studentId={id}
      studentName={displayName(student)}
      latest={latest ?? null}
      consent={consent}
    />
  );
}
