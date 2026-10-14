import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const personas = [
  "admin-geral",
  "admin-ra",
  "admin-bv",
  "prof-ra",
  "prof-bv",
  "prof-ambas",
  "inativo",
  "sem-vinculo",
];

function personaOf(alias: string | null) {
  return (
    personas.find(
      (persona) => alias === persona || alias?.startsWith(`${persona}-`),
    ) ?? "admin-geral"
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (
    process.env.DEV_AUTH !== "1" ||
    process.env.VERCEL_ENV ||
    !["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const alias = url.searchParams.get("as");
  const valid = alias !== null && /^[a-z0-9-]{1,40}$/.test(alias);
  const devUser = {
    email: valid
      ? `e2e-${alias}@portal.local`
      : (process.env.DEV_AUTH_EMAIL ?? "dev@portal.local"),
    password: "dev-only-local-password",
  };

  const admin = createAdminClient();
  await admin.auth.admin.createUser({
    ...devUser,
    email_confirm: true,
    user_metadata: { full_name: valid ? `Teste ${alias}` : "Pessoa de teste" },
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(devUser);
  if (error) throw error;
  const { error: personaError } = await admin.rpc("dev_set_persona", {
    p_user_id: data.user.id,
    p_persona: personaOf(valid ? alias : null),
  });
  if (personaError) throw personaError;

  const target = new URL(url.searchParams.get("next") ?? "/", url);
  return NextResponse.redirect(
    target.origin === url.origin ? target : new URL("/", url),
  );
}
