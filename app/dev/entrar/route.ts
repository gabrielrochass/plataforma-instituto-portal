import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
  const devUser = {
    email:
      alias && /^[a-z0-9-]{1,32}$/.test(alias)
        ? `e2e-${alias}@financial-tracker.local`
        : (process.env.DEV_AUTH_EMAIL ?? "dev@financial-tracker.local"),
    password: "dev-only-local-password",
  };

  await createAdminClient().auth.admin.createUser({
    ...devUser,
    email_confirm: true,
    user_metadata: { full_name: "Pessoa de teste" },
  });

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(devUser);
  if (error) throw error;
  await supabase
    .from("profiles")
    .update({ onboarding_done_at: new Date().toISOString() })
    .eq("id", data.user.id);

  const target = new URL(url.searchParams.get("next") ?? "/", url);
  return NextResponse.redirect(
    target.origin === url.origin ? target : new URL("/", url),
  );
}
