import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/AppShell";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rizq — Souq Al Hal",
  description: "Rizq — Souq Al Hal: Syrian agricultural marketplace — auctions, tenders, and direct sales",
  icons: {
    icon: "/rizq-logo.png",
    apple: "/rizq-logo.png",
  },
};

const themeInitScript = `
(function() {
  try {
    var mode = window.localStorage.getItem("rizq-web-theme-mode") || "system";
    var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var theme = mode === "dark" || mode === "light" ? mode : systemTheme;
    var language = window.localStorage.getItem("rizq-web-language");
    if (language !== "ar" && language !== "en") {
      var browserLang = (navigator.language || "").toLowerCase();
      language = browserLang.indexOf("ar") === 0 ? "ar" : "en";
    }
    var direction = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.locale = language;
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body && (document.body.dir = direction);
    document.documentElement.style.colorScheme = theme;
  } catch (error) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-background text-foreground antialiased"
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
