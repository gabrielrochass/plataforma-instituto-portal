import "server-only";

import { cache } from "react";
import { createClient, requireUser } from "@/lib/supabase/server";

export const getOpenOffers = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("open_offers");
  if (error) throw error;
  return data;
});

export type OpenOffer = Awaited<ReturnType<typeof getOpenOffers>>[number];

export async function getOffers() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("enrollment_offers")
    .select(
      "id, class_id, unit_id, description, closes_on, is_open, created_at, classes!enrollment_offers_class_id_fkey (name), units (code, name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export const getRequests = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("request_list");
  if (error) throw error;
  return data;
});

export type RequestRow = Awaited<ReturnType<typeof getRequests>>[number];

export async function getRequest(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("enrollment_requests")
    .select(
      "id, protocol, full_name, social_name, birth_date, phone, email, neighborhood, guardian_name, guardian_phone, status, note, student_id, created_at, enrollment_offers (id, class_id, unit_id, classes!enrollment_offers_class_id_fkey (name), units (name, code))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type RequestDetail = NonNullable<Awaited<ReturnType<typeof getRequest>>>;
