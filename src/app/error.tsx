"use client";

/**
 * App-root error boundary.
 *
 * Catches any uncaught runtime error in any route segment and shows
 * a calm, on-brand error screen with a «retry» button. The error is
 * also logged to the console (and would be sent to Sentry if wired up).
 *
 * Users get a «بازگشت به صفحه نخست» link as well so they're never stuck.
 */
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="container-legal py-20 flex flex-col items-center justify-center text-center gap-5">
      <div className="max-w-md">
        <p className="text-[12.5px] tracking-[0.12em] text-[#6b6b6b] mb-2 uppercase">
          خطای سامانه
        </p>
        <h1 className="font-legal text-[24px] font-light text-[#1a1a1a] mb-3">
          چیزی درست پیش نرفت.
        </h1>
        <p className="text-[14px] leading-7 text-[#3d3d3d] mb-5">
          خطایی هنگام بارگذاری این صفحه رخ داد. می‌توانید دوباره تلاش کنید
          یا به صفحه نخست بازگردید. اگر خطا ادامه داشت، لطفاً از طریق
          صفحهٔ تماس با ما گزارش دهید.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn-legal">
            تلاش مجدد
          </button>
          <Link href="/" className="btn-legal-ghost">
            بازگشت به صفحه نخست
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-[11.5px] text-[#9c9c9c] cite">
            شناسه خطا: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
