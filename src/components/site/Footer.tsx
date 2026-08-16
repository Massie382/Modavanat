"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Site footer — 4-column layout on dark charcoal ground.
 *
 * All navigation uses Next.js <Link> so it works from any route.
 * The "گزارش خطا" link points to /contact (the contact page has a
 * mailto for bug reports) instead of being a dead `href="#"`.
 */
export function Footer() {
  return (
    <footer className="mt-auto bg-[#1f1f1f] text-[#bdbdbd]">
      {/* Top: footer columns — centered on mobile, left-aligned on desktop */}
      <div className="container-legal py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-right">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2.5 mb-3">
              <Image
                src="/brand/darklogo.webp"
                alt="مدونات"
                width={1536}
                height={1024}
                className="h-[96px] sm:h-[120px] w-auto object-contain"
                draggable={false}
              />
            </div>
            <p className="text-[12.5px] leading-7 text-[#9c9c9c] md:text-right">
              مرجع جامع قوانین و مقررات جمهوری اسلامی ایران. این پایگاه با هدف
              تسهیل دسترسی شهروندان، حقوقدانان و پژوهشگران به متن قوانین،
              اصلاحات و ارجاعات متقابل تأسیس شده است.
            </p>
          </div>

          {/* Quick links */}
          <nav aria-label="پیوندهای سریع" className="flex flex-col items-center md:items-start">
            <h3 className="text-[13px] font-semibold text-white mb-3 tracking-wide">
              پیوندهای سریع
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/" className="hover:text-white text-center md:text-right">صفحه نخست</Link></li>
              <li><Link href="/browse" className="hover:text-white text-center md:text-right">مرور قوانین</Link></li>
              <li><Link href="/search" className="hover:text-white text-center md:text-right">جستجوی پیشرفته</Link></li>
              <li><Link href="/about" className="hover:text-white text-center md:text-right">درباره ما</Link></li>
              <li><Link href="/guide" className="hover:text-white">شبکه ارجاعات</Link></li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="منابع" className="flex flex-col items-center md:items-start">
            <h3 className="text-[13px] font-semibold text-white mb-3 tracking-wide">
              منابع و راهنما
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/guide" className="hover:text-white">راهنمای استفاده</Link></li>
              <li><Link href="/guide#vocabulary" className="hover:text-white">واژه‌نامه حقوقی</Link></li>
              <li><Link href="/guide#faq" className="hover:text-white">سؤالات رایج</Link></li>
              <li><Link href="/guide#citation" className="hover:text-white">قواعد نقل قول</Link></li>
              <li><Link href="/guide#api" className="hover:text-white">دسترسی از طریق API</Link></li>
            </ul>
          </nav>

          {/* About */}
          <nav aria-label="درباره" className="flex flex-col items-center md:items-start">
            <h3 className="text-[13px] font-semibold text-white mb-3 tracking-wide">
              درباره مدونات
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/about" className="hover:text-white text-center md:text-right">درباره ما</Link></li>
              <li><Link href="/accessibility" className="hover:text-white">دسترسی‌پذیری</Link></li>
              <li><Link href="/privacy" className="hover:text-white">حریم خصوصی</Link></li>
              <li><Link href="/terms" className="hover:text-white">شرایط استفاده</Link></li>
              <li><Link href="/contact" className="hover:text-white">تماس با ما</Link></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <div className="container-legal py-4 flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-3 text-[12px] text-[#8d8d8d] text-center sm:text-right">
          <p>
            © ۱۴۰۴ مدونات (modavanat.ir). تمامی حقوق محفوظ است. مدونات یک
            پایگاه خصوصی و غیررسمی است؛ محتوای آن بر اساس قوانین جمهوری
            اسلامی ایران تهیه شده و قابل نقل قول با ذکر منبع است.
          </p>
          <p className="shrink-0">
            نسخه ۲.۴.۱ —{" "}
            <Link href="/contact" className="hover:text-white underline underline-offset-2">
              گزارش خطا
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
