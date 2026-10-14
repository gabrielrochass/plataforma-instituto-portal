import "server-only";

import { photoUrls } from "@/lib/data/photos";
import { displayName } from "@/lib/people";
import { requireUser } from "@/lib/supabase/server";

type Row = {
  id: string;
  full_name: string;
  social_name: string | null;
  photo_path: string | null;
  badge_token: string | null;
  enrollments: {
    status: string;
    classes: { name: string; units: { code: string } | null } | null;
  }[];
};

const columns =
  "id, full_name, social_name, photo_path, badge_token, enrollments (status, classes (name, units (code)))";

async function toBadges(rows: readonly Row[]) {
  const photos = await photoUrls(rows.map((row) => row.photo_path));
  return rows.flatMap((row) => {
    if (!row.badge_token) return [];
    const active = row.enrollments.filter(
      (enrollment) => enrollment.status === "active" && enrollment.classes,
    );
    return [
      {
        id: row.id,
        name: displayName(row),
        photo: row.photo_path ? (photos.get(row.photo_path) ?? null) : null,
        token: row.badge_token,
        classes: active
          .map((enrollment) => enrollment.classes?.name)
          .join(", "),
        unit: active[0]?.classes?.units?.code ?? "",
      },
    ];
  });
}

export async function getClassBadges(classId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("enrollments")
    .select(`students (${columns})`)
    .eq("class_id", classId)
    .eq("status", "active");
  if (error) throw error;
  const rows = data.flatMap((item) => (item.students ? [item.students] : []));
  const badges = await toBadges(rows as Row[]);
  return badges.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function getStudentBadge(studentId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("students")
    .select(columns)
    .eq("id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [badge] = await toBadges([data as Row]);
  return badge ?? null;
}
