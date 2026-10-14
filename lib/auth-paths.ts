import type { Route } from "next";

const publicPaths = [
  "/entrar",
  "/cadastro",
  "/termos",
  "/privacidade",
  "/dev/entrar",
  "/dev/ui",
];

export function isPublicPath(pathname: string) {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function devSignInEnabled() {
  return process.env.DEV_AUTH === "1" && !process.env.VERCEL_ENV;
}

export function signInPath() {
  return devSignInEnabled() ? "/dev/entrar" : "/entrar";
}

export function safeNext(raw: unknown) {
  if (typeof raw !== "string" || !raw.startsWith("/")) return "/";
  const base = "http://localhost";
  const url = URL.parse(raw, base);
  if (url?.origin !== base || url.pathname.startsWith("//")) return "/";
  return `${url.pathname}${url.search}`;
}

export function withNext(path: string, next: string) {
  return (
    next === "/" ? path : `${path}?next=${encodeURIComponent(next)}`
  ) as Route;
}
