import Link from "next/link";

/**
 * App-root 404 page.
 *
 * Shown when no route matches. Stays on-brand — same editorial
 * typography, charcoal accent — and offers a clear path back home.
 */
export default function NotFound() {
  return (
    <div className="container-legal py-20 flex flex-col items-center justify-center text-center gap-5">
      <div className="max-w-md">
        <p className="text-[12.5px] tracking-[0.12em] text-[#6b6b6b] mb-2 uppercase">
          ۴۰۴ — صفحه یافت نشد
        </p>
        <h1 className="font-legal text-[28px] font-light text-[#1a1a1a] mb-3">
          صفحه‌ای که دنبال آن بودید پیدا نشد.
        </h1>
        <p className="text-[14px] leading-7 text-[#3d3d3d] mb-6">
          ممکن است نشانی را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.
          می‌توانید به صفحه نخست بازگردید یا از جستجو استفاده کنید.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-legal">
            بازگشت به صفحه نخست
          </Link>
          <Link href="/search" className="btn-legal-ghost">
            جستجوی قوانین
          </Link>
        </div>
      </div>
    </div>
  );
}
