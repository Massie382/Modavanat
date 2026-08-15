import type { Metadata } from "next";
import { StaticPageLayout } from "@/components/site/StaticPageLayout";

export const metadata: Metadata = {
  title: "تماس با ما | مدونات",
  description:
    "راه‌های ارتباط با تیم مدونات — گزارش خطا، پیشنهاد بهبود، درخواست افزودن قانون و همکاری.",
};

export default function ContactPage() {
  return (
    <StaticPageLayout title="تماس با ما" subtitle="راه‌های ارتباط با تیم مدونات">
      <p>
        تیم مدونات (modavanat.ir) همواره از بازخورد کاربران استقبال می‌کند.
        چه حقوقدان حرفه‌ای باشید که خطای فنی در متن قانون یافته، چه
        شهروندی که به دنبال قانون خاصی می‌گردد و آن را در پایگاه پیدا نکرده،
        یا پژوهشگری که پیشنهاد امکان جدیدی برای سایت دارد — خوشحال می‌شویم
        نظر شما را بشنویم. در این صفحه، راه‌های مختلف ارتباط با ما را شرح
        داده‌ایم.
      </p>

      <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
        ایمیل
      </h2>
      <p>
        سریع‌ترین راه برای ارتباط با ما، ارسال ایمیل به نشانی‌های زیر است.
        همه ایمیل‌ها ظرف ۵ روز کاری پاسخ داده می‌شوند. لطفاً در ایمیل خود
        موضوع را به‌اختصار در خط موضوع ذکر کنید و در صورت گزارش خطا، شناسه
        قانون (نمونه: law-1387-1342) و شماره ماده را در متن درج کنید.
      </p>
      <ul className="space-y-3 list-none pr-0">
        <li className="flex gap-3">
          <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
          <span>
            <strong className="font-legal font-semibold">گزارش خطای محتوایی</strong> —
            خطاهای مربوط به متن قانون، تاریخ، شماره یا ارجاعات:{" "}
            <a href="mailto:content@modavanat.ir" className="link-legal cite">
              content@modavanat.ir
            </a>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
          <span>
            <strong className="font-legal font-semibold">گزارش مشکل فنی</strong> —
            خطاهای فنی سایت، شکستن طرح‌بندی، مشکل در جستجو:{" "}
            <a href="mailto:tech@modavanat.ir" className="link-legal cite">
              tech@modavanat.ir
            </a>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
          <span>
            <strong className="font-legal font-semibold">دسترسی‌پذیری</strong> —
            گزارش مشکلات مربوط به صفحه‌خوان، صفحه‌کلید یا کنتراست:{" "}
            <a href="mailto:accessibility@modavanat.ir" className="link-legal cite">
              accessibility@modavanat.ir
            </a>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="shrink-0 w-1 h-1 rounded-full bg-[#1f1f1f] mt-3" />
          <span>
            <strong className="font-legal font-semibold">سایر موارد</strong> —
            پیشنهاد بهبود، درخواست افزودن قانون، همکاری:{" "}
            <a href="mailto:info@modavanat.ir" className="link-legal cite">
              info@modavanat.ir
            </a>
          </span>
        </li>
      </ul>

      <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
        درخواست افزودن قانون
      </h2>
      <p>
        اگر قانونی در پایگاه مدونات وجود ندارد و فکر می‌کنید باید اضافه شود،
        خوشحال می‌شویم درخواست خود را به نشانی{" "}
        <a href="mailto:content@modavanat.ir" className="link-legal cite">
          content@modavanat.ir
        </a>{" "}
        ارسال کنید. لطفاً در ایمیل خود عنوان کامل قانون، سال تصویب، مرجع
        تصویب و — در صورت امکان — پیوند به متن رسمی قانون در روزنامه رسمی
        یا پایگاه مرکز پژوهش‌های مجلس را درج کنید. تیم ما درخواست‌ها را
        اولویت‌بندی می‌کند: قوانین پرارجاع و قوانین مصوب سال‌های اخیر
        معمولاً زودتر افزوده می‌شوند.
      </p>
      <p>
        فرآیند افزودن یک قانون شامل تأیید رسمیت، تهیه متن کامل، تطبیق با
        اصلاحات بعدی و ثبت ارجاعات متقابل است. بسته به پیچیدگی قانون، این
        فرآیند ممکن است بین یک تا چهار هفته طول بکشد. پس از افزودن،
        کاربری که درخواست داده به‌صورت خودکار با ایمیل مطلع می‌شود.
      </p>

      <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
        همکاری با ما
      </h2>
      <p>
        مدونات یک پروژه غیرانتفاعی است و از مشارکت داوطلبانه حقوقدانان،
        ویراستاران و توسعه‌دهندگان استقبال می‌کند. اگر تمایل به همکاری
        دارید — چه در تأیید متن قوانین، چه در توسعه فنی سایت، چه در ترجمه
        رابط کاربری به زبان‌های دیگر — لطفاً به نشانی{" "}
        <a href="mailto:info@modavanat.ir" className="link-legal cite">
          info@modavanat.ir
        </a>{" "}
        ایمیل بزنید و زمینه همکاری، سوابق و زمان در دسترس خود را شرح دهید.
        تیم ما ظرف یک هفته پاسخ می‌دهد و در صورت وجود ظرفیت، فرآیند همکاری
        را آغاز می‌کند.
      </p>

      <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
        سیاست پاسخ‌گویی
      </h2>
      <p>
        ما متعهد هستیم به همه ایمیل‌ها پاسخ دهیم، حتی اگر موضوع خارج از
        توانایی ما باشد. در صورتی که پاسخ مستقیم به سؤال شما نیازمند بررسی
        تخصصی باشد، ممکن است تا دو هفته زمان نیاز باشد. در مواردی که موضوع
        مربوط به پایگاه دیگری باشد، تلاش می‌کنیم شما را به مرجع مناسب
        ارجاع دهیم. لطفاً توجه داشته باشید که مدونات مشاوره حقوقی فردی
        ارائه نمی‌دهد — برای موارد خاص حقوقی باید با وکیل دادگستری مشورت
        کنید.
      </p>

      <h2 className="font-legal text-[19px] font-medium text-[#1a1a1a] pt-4 border-t border-[#ececea]">
        نشانی پستی
      </h2>
      <p>
        در صورت نیاز به مراجعه حضوری یا ارسال نامه پستی، نشانی دفتر
        ویراستاری مدونات به‌صورت زیر است. لطفاً پیش از مراجعه، با ایمیل
        هماهنگ کنید تا کارشناس مربوطه در دسترس باشد.
      </p>
      <p className="cite text-[13.5px] leading-7">
        دفتر ویراستاری مدونات<br />
        تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳۴، طبقه ۴<br />
        کد پستی: ۱۹۶۱۹۵۴۳۲۱
      </p>
    </StaticPageLayout>
  );
}
