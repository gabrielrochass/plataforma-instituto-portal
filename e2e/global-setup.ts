import { createClient } from "@supabase/supabase-js";
import "./env";

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const password = "dev-only-local-password";

function isTestUser(email = "") {
  return email.startsWith("e2e") && email.endsWith("@financial-tracker.local");
}

export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const admin = createClient(
    url,
    process.env.SUPABASE_SECRET_KEY as string,
    options,
  );
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const user of data.users.filter((user) => isTestUser(user.email))) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
  }

  const warmup = { email: "e2e-warmup@financial-tracker.local", password };
  await admin.auth.admin.createUser({ ...warmup, email_confirm: true });
  const client = createClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    options,
  );
  const { error: signInError } = await client.auth.signInWithPassword(warmup);
  if (signInError) throw signInError;
  const { error: queryError } = await client.from("profiles").select("id");
  if (queryError) throw queryError;
}
