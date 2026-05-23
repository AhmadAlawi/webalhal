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
  title: "رزق — سوق الهال",
  description: "رزق — سوق الهال: منصة سوق زراعي سوري — مزادات، مناقصات، وبيع مباشر",
  icons: {
    icon: "/rizq-logo.png",
    apple: "/rizq-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-slate-50 text-slate-900 antialiased"
      >
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
