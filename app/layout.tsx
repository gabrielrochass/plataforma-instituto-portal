import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/toast";
import { m } from "@/lib/i18n";
import { parseTheme, themeCookie } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: m.app.name, template: `%s | ${m.app.name}` },
  description: m.app.description,
  applicationName: m.app.name,
  appleWebApp: { title: m.app.shortName, statusBarStyle: "default" },
};

async function currentTheme() {
  return parseTheme((await cookies()).get(themeCookie)?.value);
}

export async function generateViewport(): Promise<Viewport> {
  const dark = (await currentTheme()) === "dark";
  return {
    viewportFit: "cover",
    colorScheme: dark ? "dark" : "light",
    themeColor: dark ? "#15120d" : "#faf6ec",
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme={await currentTheme()}
      className={inter.variable}
    >
      <body>
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
        >
          {m.common.skipToContent}
        </a>
        {children}
        <Toaster limit={1} />
      </body>
    </html>
  );
}
