"use client";

import { toFa } from "@/lib/utils";

interface AboutViewProps {
  onHome: () => void;
}

export function AboutView({ onHome }: AboutViewProps) {
  return (
    <div className="container-legal py-10 md:py-14">
      <div className="max-w-3xl">
        <p className="text-[12.5px] tracking-[0.12em] text-[#6b6b6b] mb-3 uppercase">
          درباره مدونات
        </p>
        <h1 className="font-legal text-[28px] md:text-[32px] font-light text-[#1a1a1a] leading-tight mb-6">
          مرجع جامع قوانین جمهوری اسلامی ایران
        </h1>

        <div className="space-y-6 text-[14.5px] leading-8 text-[#1a1a1a]">
          <p>
            مدونات (modavanat.ir) پایگاهی است که با هدف تسهیل دسترسی شهروندان،
            حقوقدانان، پژوهشگران و دانشجویان به متن قوانین و مقررات جمهوری اسلامی
            ایران تأسیس شده است. این پایگاه علاوه بر ارائه متن کامل قوانین،
            امکان ردیابی اصلاحات اعمال‌شده بر هر قانون و مشاهده شبکه ارجاعات متقابل
            میان مواد قانونی را نیز فراهم می‌کند.
          </p>

          <p>
            یکی از چالش‌های پایدار در مطالعه قوانین ایران، پیگیری تاریخچه اصلاحات
            هر قانون است. بسیاری از قوانین مصوب دهه‌های گذشته طی سال‌ها بارها
            اصلاح شده‌اند و پیگیری نسخه معتبر و به‌روز هر ماده نیازمند جستجوی
            پرزحمت در منابع متعدد است. مدونات با ارائه خط زمانی تفصیلی برای
            هر قانون، این فرایند را ساده می‌کند: کاربر می‌تواند با یک کلیک،
            نسخه پیش و پس از هر اصلاح را به‌صورت کنار هم ببیند و دقیقاً متوجه شود
            کدام بخش تغییر کرده است.
          </p>

          <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
            ویژگی‌های کلیدی
          </h2>
          <ul className="space-y-3 list-none pr-0">
            <li className="flex gap-3">
              <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
              <span>
                <strong className="font-legal font-semibold">متن کامل قوانین</strong> —
                متن مصوب و نسخه اصلاح‌شده هر قانون به‌همراه نشانگرهای ویرایشی [تN]
                که هر اصلاح را به پاورقی متن قانون پیوند می‌دهد.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
              <span>
                <strong className="font-legal font-semibold">خط زمانی اصلاحات</strong> —
                برای هر قانون، فهرست کامل اصلاحات به ترتیب زمانی به‌همراه نوع اثر،
                قانون اصلاح‌کننده و تاریخ اجرا. هر اصلاح قابل کلیک است و نسخه پیش
                و پس از تغییر را به‌صورت کنار هم با رنگ‌گذاری متفاوت نمایش می‌دهد.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
              <span>
                <strong className="font-legal font-semibold">شبکه ارجاعات</strong> —
                فهرست کامل ارجاعات هر قانون به سایر قوانین و بالعکس، با نمایش ماده
                مبدأ و ماده مقصد. این امکان به درک روابط میان قوانین کمک می‌کند.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
              <span>
                <strong className="font-legal font-semibold">انتخاب‌گر مواد به سبک iOS</strong> —
                برای قوانین با صدها ماده، انتخاب‌گر استوانه‌ای با جستجوی فوری و
                اسکرول نرم که هم در دسکتاپ و هم در موبایل کار می‌کند.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
              <span>
                <strong className="font-legal font-semibold">اصلاحات در انتظار اجرا</strong> —
                قوانینی که تصویب شده‌اند اما هنوز لازم‌الاجرا نشده‌اند، به‌صورت
                جداگانه نمایش داده می‌شوند تا کاربر از وضعیت آینده قانون آگاه باشد.
              </span>
            </li>
          </ul>

          <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
            منابع و روش کار
          </h2>
          <p>
            محتوای مدونات بر اساس متن رسمی قوانین منتشرشده در روزنامه رسمی
            جمهوری اسلامی ایران و پایگاه حقوقی مجلس شورای اسلامی تهیه شده است.
            تیم ویراستاری مدونات، اصلاحات اعمال‌شده بر هر قانون را به‌صورت
            دستی ثبت و با متن قانون تطبیق می‌دهد تا دقت اطلاعات تضمین شود.
          </p>
          <p>
            در تنظیم خط زمانی اصلاحات، از مدل نشانگرهای ویرایشی الهام‌گرفته از
            پایگاه‌های حقوقی بین‌المللی (از جمله legislation.gov.uk) استفاده
            شده است. در این مدل، هر اصلاح با یک شناسه کوتاه (مانند [ت۱]) در متن
            قانون نشان‌گذاری می‌شود و پاورقی متناظر، جزئیات اصلاح را شرح می‌دهد.
          </p>

          <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
            محدودیت‌ها
          </h2>
          <p>
            با وجود تلاش برای ارائه دقیق و به‌روز، مدونات جایگزین منابع رسمی
            نیست. در موارد حساس حقوقی، توصیه می‌شود متن قانون در روزنامه رسمی یا
            پایگاه مرکز پژوهش‌های مجلس بررسی شود. همچنین، فهرست کامل قوانین ایران
            به‌مرور در حال افزودن به پایگاه است و ممکن است برخی قوانین کمتر شناخته‌شده
            هنوز در دسترس نباشند.
          </p>

          <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
            تماس با ما
          </h2>
          <p>
            برای گزارش خطا، پیشنهاد بهبود یا درخواست افزودن قانون خاص، می‌توانید
            از طریق فرم تماس با ما یا نشانی ایمیل{" "}
            <a href="mailto:info@modavanat.ir" className="link-legal cite">info@modavanat.ir</a> با تیم
            مدونات در ارتباط باشید.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-[#ececea] flex items-center justify-between text-[12.5px] text-[#6b6b6b]">
          <span>نسخه ۲.۴.۱ — اسفند ۱۴۰۳</span>
          <button onClick={onHome} className="link-legal">
            بازگشت به صفحه نخست ←
          </button>
        </div>
      </div>
    </div>
  );
}
