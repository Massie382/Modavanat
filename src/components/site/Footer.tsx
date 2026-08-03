"use client";

interface FooterProps {
  onNavigate: (view: "home" | "browse" | "search" | "about") => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-auto bg-[#1f1f1f] text-[#bdbdbd]">
      {/* Top: footer columns — centered on mobile, left-aligned on desktop */}
      <div className="container-legal py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-right">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2.5 mb-3">
              <img
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
              <li><button onClick={() => onNavigate("home")} className="hover:text-white text-center md:text-right">صفحه نخست</button></li>
              <li><button onClick={() => onNavigate("browse")} className="hover:text-white text-center md:text-right">مرور قوانین</button></li>
              <li><button onClick={() => onNavigate("search")} className="hover:text-white text-center md:text-right">جستجوی پیشرفته</button></li>
              <li><button onClick={() => onNavigate("about")} className="hover:text-white text-center md:text-right">درباره ما</button></li>
              <li><a href="#" className="hover:text-white">شبکه ارجاعات</a></li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="منابع" className="flex flex-col items-center md:items-start">
            <h3 className="text-[13px] font-semibold text-white mb-3 tracking-wide">
              منابع و راهنما
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><a href="/guide" className="hover:text-white">راهنمای استفاده</a></li>
              <li><a href="#" className="hover:text-white">واژه‌نامه حقوقی</a></li>
              <li><a href="#" className="hover:text-white">سؤالات رایج</a></li>
              <li><a href="#" className="hover:text-white">قواعد نقل قول</a></li>
              <li><a href="#" className="hover:text-white">دسترسی از طریق API</a></li>
            </ul>
          </nav>

          {/* About */}
          <nav aria-label="درباره" className="flex flex-col items-center md:items-start">
            <h3 className="text-[13px] font-semibold text-white mb-3 tracking-wide">
              درباره مدونات
            </h3>
            <ul className="space-y-2 text-[13px]">
              <li><button onClick={() => onNavigate("about")} className="hover:text-white text-center md:text-right">درباره ما</button></li>
              <li><a href="/accessibility" className="hover:text-white">دسترسی‌پذیری</a></li>
              <li><a href="#" className="hover:text-white">حریم خصوصی</a></li>
              <li><a href="#" className="hover:text-white">شرایط استفاده</a></li>
              <li><a href="/contact" className="hover:text-white">تماس با ما</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <div className="container-legal py-4 flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-3 text-[12px] text-[#8d8d8d] text-center sm:text-right">
          <p>
            © ۱۴۰۴ مدونات (modavanat.ir). تمامی حقوق محفوظ است. محتوای این
            پایگاه بر اساس قوانین رسمی جمهوری اسلامی ایران تهیه شده و قابل نقل
            قول با ذکر منبع است.
          </p>
          <p className="shrink-0">
            نسخه ۲.۴.۱ —{" "}
            <a href="#" className="hover:text-white underline underline-offset-2">
              گزارش خطا
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
