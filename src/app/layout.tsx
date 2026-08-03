import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Vazirmatn is loaded from LOCAL files — no build-time fetch to Google,
// no runtime request to fonts.gstatic.com. The @font-face declarations
// live in globals.css (with explicit unicode-range so the browser picks
// the right subset file per character). Files are served from
// /fonts/vazirmatn-*.woff2 in the public/ directory.
//
// To match the original next/font/google behavior we ship three subsets:
//   - arabic     (Persian alphabet + Persian digits U+06F0-06F9 + extensions)
//   - latin      (basic ASCII + Latin-1 supplement)
//   - latin-ext  (extended Latin — included for completeness, used for
//                 any rare extended-Latin glyph; harmless if unused)
//
// All three are variable fonts covering the full 100-900 weight range.

export const metadata: Metadata = {
  title: "مدونات | مرجع جامع قوانین جمهوری اسلامی ایران",
  description:
    "جستجو، مرور و مطالعه قوانین و مقررات جمهوری اسلامی ایران به‌همراه خط زمانی اصلاحات و ارجاعات متقابل قانون‌ها.",
  keywords: [
    "قانون",
    "مدونات",
    "قوانین ایران",
    "قانون مدنی",
    "قانون مجازات اسلامی",
    "قانون تجارت",
    "قانون کار",
    "قانون اساسی",
  ],
  authors: [{ name: "modavanat.ir" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
