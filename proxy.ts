import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isPublicPath, safeNext, signInPath } from "@/lib/auth-paths";

const sessionHeaders = ["cache-control", "expires", "pragma"];
const authPages = ["/entrar", "/cadastro"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const { pathname, search, searchParams } = request.nextUrl;
  const serverAction =
    request.method === "POST" && request.headers.has("next-action");

  if (!data && !serverAction && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = signInPath();
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectKeepingSession(response, url);
  }

  if (data && !serverAction && authPages.includes(pathname)) {
    const next = new URL(safeNext(searchParams.get("next")), request.url);
    const target =
      next.origin === request.nextUrl.origin ? next : new URL("/", request.url);
    return redirectKeepingSession(response, target);
  }

  return response;
}

function redirectKeepingSession(response: NextResponse, url: URL) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  for (const name of sessionHeaders) {
    const value = response.headers.get(name);
    if (value) redirect.headers.set(name, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
