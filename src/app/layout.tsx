import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { themeScript } from "@/components/theme/theme-script";
import { Toaster } from "@/components/ui/sonner";
import { LocaleBoundary } from "@/i18n/locale-boundary";
import { LOCALE_COOKIE, defaultLocale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HabitFlow",
  description:
    "Track your job applications and stay consistent until you land the job.",
};

// Sets <html lang> from the saved language before paint. The root layout does
// not read cookies itself, so the static shell stays prerenderable (see the
// Next.js "Preventing flash before hydration" guide).
const langScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(en|id)/);if(m)document.documentElement.lang=m[1]}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={defaultLocale}
      // The inline scripts change the class and lang before React hydrates.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Suspense>
          <LocaleBoundary>{children}</LocaleBoundary>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
