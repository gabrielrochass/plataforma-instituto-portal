import "server-only";

import { requireUser } from "@/lib/supabase/server";

export const photoBucket = "student-photos";

export async function photoUrls(paths: readonly (string | null)[]) {
  const wanted = [...new Set(paths.filter((path): path is string => !!path))];
  if (wanted.length === 0) return new Map<string, string>();
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from(photoBucket)
    .createSignedUrls(wanted, 60 * 60);
  if (error) throw error;
  return new Map(
    data.flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [],
    ),
  );
}
