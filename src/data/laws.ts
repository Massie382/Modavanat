import type { Law, DecadeStat } from "@/lib/types";

/**
 * Dataset of Iranian laws for modavanat.ir
 * Content is realistic but illustrative — modeled on the structure of actual
 * Iranian statutes. Article text uses show [تN] markers for amendments with
 * matching commentary footnotes, mirroring legislation.gov.uk's F-marker system.
 */

// ----------  Helper: short provision ref  ----------
const ref = (
  lawId: string,
  title: string,
  year: number,
  provisionLabel?: string,
  number?: string,
) => ({ lawId, title, year, provisionLabel, number });

// ============================================================
//   1.  قانون مدنی ایران  (۱۳۰۷)
// ============================================================
const qanoonMadani: Law = {
  id: "q-madani-1307",
  title: "قانون مدنی",
  shortTitle: "قانون مدنی",
  type: "قانون عادی",
  year: 1307,
  number: "۲۵۳",
  status: "amended",
  extent: "کشوری",
  subject: "مدنی",
  promulgatingAuthority: "مجلس شورای ملی",
  approvedDate: "۱۳۰۷/۰۵/۰۷",
  effectiveDate: "۱۳۰۷/۰۵/۰۷",
  lastRevisionDate: "۱۳۸۷/۰۹/۲۳",
  description:
    "مجموعه‌ای از قواعد حقوقی که روابط خصوصی اشخاص را در زمینه اموال، خانواده و ادله اثبات دعوی تنظیم می‌کند. این قانون در ۱۳۳۵ ماده و سه کتاب تدوین شده است.",
  longDescription:
    "قانون مدنی ایران که در سال ۱۳۰۷ خورشیدی به تصویب رسید، یکی از کهن‌ترین و پایدارترین قوانین نظام حقوقی کشور محسوب می‌شود. تدوین آن به دستور رضا شاه و با همکاری بزرگان حقوق ایران از جمله علی اکبر داور انجام گرفت و بر اساس فقه امامیه تنظیم شد. این قانون به سه کتاب تقسیم می‌شود: کتاب اول در اموال، کتاب دوم در خانواده، و کتاب سوم در ادله اثبات دعوی. قانون مدنی پایه‌گذار بسیاری از مفاهیم بنیادین حقوق خصوصی ایران است و هرچند در طول دهه‌ها بارها اصلاح شده، ساختار اصلی خود را حفظ کرده است.",
  originalVersion: {
    approvedDate: "۱۳۰۷/۰۵/۰۷",
    description: "نسخه مصوب ۱۳۰۷ — متشکل از ۱۳۳۵ ماده در سه کتاب.",
  },
  toc: [
    {
      id: "qm-book-1",
      label: "کتاب اول",
      title: "اموال",
      type: "book",
      children: [
        {
          id: "qm-c1",
          label: "فصل اول",
          title: "مقدمه",
          type: "chapter",
          children: [
            {
              id: "qm-s1",
              label: "باب اول",
              title: "کلیات",
              type: "section",
              children: [
                {
                  id: "qm-t1",
                  label: "مبحث نخست",
                  title: "نافذ بودن و اجرای قانون",
                  type: "topic",
                  articleIds: ["qm-a1", "qm-a2", "qm-a3"],
                },
              ],
            },
          ],
        },
        {
          id: "qm-c2",
          label: "فصل دوم",
          title: "احکام اموال",
          type: "chapter",
          children: [
            {
              id: "qm-s2",
              label: "باب اول",
              title: "اقرار",
              type: "section",
              children: [
                {
                  id: "qm-t2",
                  label: "مبحث نخست",
                  title: "ماهیت و شرایط اقرار",
                  type: "topic",
                  articleIds: ["qm-a10", "qm-a11", "qm-a12", "qm-a13", "qm-a14"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qm-book-2",
      label: "کتاب دوم",
      title: "خانواده",
      type: "book",
      children: [
        {
          id: "qm-c3",
          label: "فصل اول",
          title: "در عقد نکاح",
          type: "chapter",
          children: [
            {
              id: "qm-s3",
              label: "باب اول",
              title: "مقررات عمومی نکاح",
              type: "section",
              children: [
                {
                  id: "qm-t3",
                  label: "مبحث نخست",
                  title: "صیغه و شرایط نکاح",
                  type: "topic",
                  articleIds: ["qm-a1062", "qm-a1065"],
                },
                {
                  id: "qm-t4",
                  label: "مبحث دوم",
                  title: "مهریه",
                  type: "topic",
                  articleIds: ["qm-a1082"],
                },
                {
                  id: "qm-t5",
                  label: "مبحث سوم",
                  title: "طلاق و وکالت در طلاق",
                  type: "topic",
                  articleIds: ["qm-a1133"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qm-book-3",
      label: "کتاب سوم",
      title: "ادله اثبات دعوی",
      type: "book",
      children: [
        {
          id: "qm-c4",
          label: "فصل اول",
          title: "اقرار",
          type: "chapter",
          children: [
            {
              id: "qm-s4",
              label: "باب اول",
              title: "احکام اقرار",
              type: "section",
              children: [
                {
                  id: "qm-t6",
                  label: "مبحث نخست",
                  title: "شرایط شنود اقرار",
                  type: "topic",
                  articleIds: ["qm-a1275"],
                },
              ],
            },
            {
              id: "qm-s5",
              label: "باب دوم",
              title: "بینه و شهادت",
              type: "section",
              children: [
                {
                  id: "qm-t7",
                  label: "مبحث نخست",
                  title: "تعریف بینه",
                  type: "topic",
                  articleIds: ["qm-a1284"],
                },
              ],
            },
          ],
        },
      ],
    },    ],
  articles: [
    {
      id: "qm-a1",
      number: "ماده ۱",
      text:
        "هیچ قانونی پس از هفت روز از انتشار آن قابل اجرا نیست مگر در مواردی که در خود قانون صریحاً اجرای آن را در مدتی کمتر یا بیشتر مقرر داشته باشد. [ت۱] هر قانونی فقط در موردی که بعد از تاریخ اجرای آن واقع شده است اجرا می‌شود و قانون نسبت به گذشته应有的 رجعی نیست. [ت۲]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۴۳/۰۶/۱۵",
          affectingLaw: ref("q-madani-amend-1343", "قانون اصلاح برخی مواد قانون مدنی", 1343, "ماده ۱", "۴۸۹"),
          text:
            "عبارت «هیچ قانونی پس از هفت روز از انتشار آن قابل اجرا نیست مگر در مواردی که در خود قانون صریحاً اجرای آن را در مدتی کمتر یا بیشتر مقرر داشته باشد» جایگزین عبارت قدیمی شد.",
        },
        {
          marker: "ت۲",
          effectType: "افزوده",
          date: "۱۳۴۳/۰۶/۱۵",
          affectingLaw: ref("q-madani-amend-1343", "قانون اصلاح برخی مواد قانون مدنی", 1343, "ماده ۱", "۴۸۹"),
          text: "این بند با عنوان تبصره به ماده ۱ الحاق شد.",
        },
      ],
    },
    {
      id: "qm-a2",
      number: "ماده ۲",
      text:
        "قانون اعم است از هر کلمه‌ای که نشان‌دهنده قاعده‌ای باشد که در راه هدایت انسان‌ها وضع شده و آورده شده باشد، اعم از اینکه اجباری باشد یا ارشادی یا تمکینی یا تخویفی یا ترخیصی.",
    },
    {
      id: "qm-a3",
      number: "ماده ۳",
      text:
        "هر عقدی که موضوع آن باطل باشد آن عقد هم باطل است.",
    },
    {
      id: "qm-a10",
      number: "ماده ۱۰",
      text:
        "اقرار عبارت است از این که شخص امری را به ضرر خود به صورت قانونی اقرار کند.",
    },
    {
      id: "qm-a11",
      number: "ماده ۱۱",
      text:
        "اقرار در مقابل اقرارکننده دلیل قاطع است و در مقابل غیر اقرارکننده دلیل قاطع نیست.",
    },
    {
      id: "qm-a12",
      number: "ماده ۱۲",
      text:
        "اقرار بر امری برخلاف حق ثابت شده قابل شنود نیست.",
    },
    {
      id: "qm-a13",
      number: "ماده ۱۳",
      text:
        "اقرارکننده در صورتی که در حال اقرار کنه باشد مکلف است که به اقرار خود عمل کند.",
    },
    {
      id: "qm-a14",
      number: "ماده ۱۴",
      text:
        "هرگاه کسی به دیگری اقرار کند که نزد او مالی دارد و مدت و مشخصات آن را تعیین نماید اقرار مسموع است.",
    },
    {
      id: "qm-a1062",
      number: "ماده ۱۰۶۲",
      text:
        "نکاح با عقدی واقع می‌شود که به صیغه عربی خوانده شود و الفاظ آن صریحاً دلالت بر قصد نکاح کند.",
    },
    {
      id: "qm-a1065",
      number: "ماده ۱۰۶۵",
      text:
        "عقد نکاح باید به اذن ولی زوجه واقع شود و فقط زمانی صحه دارد که زوجه در حال عقد به نکاح راضی باشد. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۵۳/۰۲/۲۵",
          affectingLaw: ref("q-hoghoogh-khanevadeh-1353", "قانون حمایت خانواده", 1353, "ماده ۴", "۲۴۰"),
          text: "این ماده به موجب ماده ۴ قانون حمایت خانواده اصلاح و شرط رضایت زوجه صراحتاً به آن افزوده شد.",
        },
      ],
    },
    {
      id: "qm-a1082",
      number: "ماده ۱۰۸۲",
      text:
        "زن به مجرد عقد مالک مهر می‌شود و می‌تواند هر تصرفی در آن بکند که بخواهد. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "افزوده",
          date: "۱۴۰۱/۰۳/۲۰",
          affectingLaw: ref("q-hoghoogh-khanevadeh-1391", "قانون حمایت خانواده", 1391, "ماده ۳۲", "۴۰"),
          text:
            "تبصره‌ای به این ماده الحاق شد که بر اساس آن تا سقف ۱۱۰ سکه تمام بهار آزادی فوراً قابل اجراست و مابقی بر اساس شاخص تورم سالانه محاسبه می‌شود.",
        },
      ],
    },
    {
      id: "qm-a1133",
      number: "ماده ۱۱۳۳",
      text:
        "زن می‌تواند با انجام شرایطی که در قانون مدنی مقرر است حق طلاق داشته باشد. [ت۱] [ت۲]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۴۶/۰۳/۱۰",
          affectingLaw: ref("q-hoghoogh-khanevadeh-1346", "قانون حمایت خانواده (اصلاحی ۱۳۴۶)", 1346, "ماده ۱۶", "۵۱۲"),
          text: "ماده ۱۱۳۳ اصلاح و امکان اعطای وکالت در طلاق به زن پیش‌بینی شد.",
        },
        {
          marker: "ت۲",
          effectType: "اصلاح",
          date: "۱۳۷۰/۱۱/۲۸",
          affectingLaw: ref("q-hoghoogh-khanevadeh-1370-1", "قانون حمایت خانواده (اصلاحی ۱۳۷۰)", 1370, "ماده ۸", "۱۲۸"),
          text:
            "این ماده با الحاق تبصره‌ای تکمیل شد که شروط ضمن عقد نکاح و امکان اجرای طلاق توسط زوجه را روشن ساخت.",
        },
      ],
    },
    {
      id: "qm-a1275",
      number: "ماده ۱۲۷۵",
      text:
        "اقرار به امری که ثبوت آن برای اقرارکننده نفعی نداشته باشد قابل شنود نیست.",
    },
    {
      id: "qm-a1284",
      number: "ماده ۱۲۸۴",
      text:
        "بینه عبارت است از شهادت دو مرد عادل که موضوع ادعا را با شرائط مقرره شرعاً شهادت دهند.",
    },
  ],
  amendments: [
    {
      date: "۱۳۴۳/۰۶/۱۵",
      dateLabel: "شهریور ۱۳۴۳",
      effectType: "اصلاح",
      affectedProvision: "ماده ۱",
      affectedProvisionId: "qm-a1",
      affectingLaw: ref("q-madani-amend-1343", "قانون اصلاح برخی مواد قانون مدنی", 1343, "ماده ۱", "۴۸۹"),
      description: "عبارت مربوط به زمان اجرای قانون پس از انتشار بازنویسی شد و تبصره‌ای به ماده ۱ الحاق گردید.",
      appliedToText: true,
      note: "این اصلاح در راستای یکپارچه‌سازی قواعد عمومی اجرای قوانین انجام شد.",
      beforeText:
        "هیچ قانونی پس از انتشار آن قابل اجرا نیست مگر در مواردی که در خود قانون صریحاً اجرای آن را در مدتی کمتر یا بیشتر مقرر داشته باشد.",
      afterText:
        "هیچ قانونی پس از هفت روز از انتشار آن قابل اجرا نیست مگر در مواردی که در خود قانون صریحاً اجرای آن را در مدتی کمتر یا بیشتر مقرر داشته باشد. تبصره — هر قانونی فقط در موردی که بعد از تاریخ اجرای آن واقع شده است اجرا می‌شود و قانون نسبت به گذشته رجعی نیست.",
    },
    {
      date: "۱۳۴۶/۰۳/۱۰",
      dateLabel: "خرداد ۱۳۴۶",
      effectType: "اصلاح",
      affectedProvision: "ماده ۱۱۳۳",
      affectedProvisionId: "qm-a1133",
      affectingLaw: ref("q-hoghoogh-khanevadeh-1346", "قانون حمایت خانواده (اصلاحی ۱۳۴۶)", 1346, "ماده ۱۶", "۵۱۲"),
      description: "امکان اعطای وکالت در طلاق به زوجه پیش‌بینی شد.",
      appliedToText: true,
    },
    {
      date: "۱۳۵۳/۰۲/۲۵",
      dateLabel: "اردیبهشت ۱۳۵۳",
      effectType: "اصلاح",
      affectedProvision: "ماده ۱۰۶۵",
      affectedProvisionId: "qm-a1065",
      affectingLaw: ref("q-hoghoogh-khanevadeh-1353", "قانون حمایت خانواده", 1353, "ماده ۴", "۲۴۰"),
      description: "شرط رضایت زوجه در عقد نکاح صراحتاً به ماده ۱۰۶۵ افزوده شد.",
      appliedToText: true,
      beforeText:
        "عقد نکاح باید به اذن ولی زوجه واقع شود.",
      afterText:
        "عقد نکاح باید به اذن ولی زوجه واقع شود و فقط زمانی صحه دارد که زوجه در حال عقد به نکاح راضی باشد.",
    },
    {
      date: "۱۳۷۰/۱۱/۲۸",
      dateLabel: "بهمن ۱۳۷۰",
      effectType: "اصلاح",
      affectedProvision: "ماده ۱۱۳۳",
      affectedProvisionId: "qm-a1133",
      affectingLaw: ref("q-hoghoogh-khanevadeh-1370-1", "قانون حمایت خانواده (اصلاحی ۱۳۷۰)", 1370, "ماده ۸", "۱۲۸"),
      description: "الحاق تبصره‌ای درباره شروط ضمن عقد و امکان اجرای طلاق توسط زوجه.",
      appliedToText: true,
      note: "شروط ضمن عقد نکاح در فرم رسمی ازدواج به ثبت می‌رسد.",
    },
    {
      date: "۱۳۸۲/۱۱/۲۴",
      dateLabel: "بهمن ۱۳۸۲",
      effectType: "توضیح",
      affectedProvision: "ماده ۱۰۸۲",
      affectedProvisionId: "qm-a1082",
      affectingLaw: ref("q-madani-tavzih-1382", "بخشنامه تفسیری ماده ۱۰۸۲", 1382, "تبصره ۱", "۹۸۱۰/۱"),
      description: "تأکید بر لزوم رعایت شروط ضمن عقد هنگام اعمال حق زوجه در مهریه.",
      appliedToText: true,
    },
    {
      date: "۱۳۸۷/۰۹/۲۳",
      dateLabel: "آذر ۱۳۸۷",
      effectType: "اصلاح",
      affectedProvision: "مواد ۱۱۹۲ و ۱۱۹۳",
      affectingLaw: ref("q-sabt-ahval-1387", "قانون ثبت وقایع خانوادگی", 1387, "ماده ۳", "۸۹"),
      description: "الزام ثبت وقایع خانوادگی (ازدواج، طلاق، ولادت و وفات) در اداره ثبت احوال.",
      appliedToText: true,
    },
    {
      date: "۱۴۰۱/۰۳/۲۰",
      dateLabel: "خرداد ۱۴۰۱",
      effectType: "افزوده",
      affectedProvision: "تبصره ماده ۱۰۸۲",
      affectedProvisionId: "qm-a1082",
      affectingLaw: ref("q-hoghoogh-khanevadeh-1391", "قانون حمایت خانواده", 1391, "ماده ۳۲", "۴۰"),
      description: "الزام تودیع مهریه تا سقف ۱۱۰ سکه در زمان اجرا، با مابقی بر اساس شاخص تورم.",
      appliedToText: true,
      note: "این اصلاح به منظور کاهش طول دادرسی پرونده‌های مهریه صورت گرفت.",
      beforeText:
        "زن به مجرد عقد مالک مهر می‌شود و می‌تواند هر تصرفی در آن بکند که بخواهد.",
      afterText:
        "زن به مجرد عقد مالک مهر می‌شود و می‌تواند هر تصرفی در آن بکند که بخواهد. تبصره — در صورت مطالبه مهریه، تا سقف ۱۱۰ سکه تمام بهار آزادی فوراً قابل اجراست و مابقی بر اساس شاخص تورم سالانه محاسبه و پرداخت می‌شود.",
    },
  ],
  outstandingChanges: [
    {
      affectedProvision: "ماده ۱۰۴۱",
      effectType: "افزوده",
      affectingLaw: ref("q-tashil-zowaj-1403", "قانون حمایت تکمیلی از خانواده", 1403, "ماده ۳", "۳۱۲"),
      description: "افزودن شرطی در خصوص سن داماد و الزام مشاوره پیش از ازدواج.",
      expectedDate: "۱۴۰۴/۰۹/۰۱",
    },
    {
      affectedProvision: "ماده ۱۱۷۷",
      effectType: "اصلاح",
      affectingLaw: ref("q-tashil-zowaj-1403", "قانون حمایت تکمیلی از خانواده", 1403, "ماده ۵", "۳۱۲"),
      description: "اصلاح مربوط به شرایط حضانت فرزند پس از طلاق.",
      expectedDate: "۱۴۰۴/۰۹/۰۱",
    },
  ],
  references: [
    {
      direction: "cites",
      target: ref("q-tejarat-1302", "قانون تجارت", 1302, "ماده ۵"),
      sourceProvision: "ماده ۱",
      context: "قانون مدنی در باب مفهوم قانون به قانون تجارت ارجاع می‌دهد.",
    },
    {
      direction: "cites",
      target: ref("q-majazat-islami-1392", "قانون مجازات اسلامی", 1392, "ماده ۱۴"),
      sourceProvision: "ماده ۳",
      context: "ارجاع به ضمانت اجرای کیفری در صورت نقض تعهدات قراردادی.",
    },
    {
      direction: "cited-by",
      target: ref("q-hoghoogh-khanevadeh-1391", "قانون حمایت خانواده (مصوب ۱۳۹۱)", 1391, "ماده ۲۲"),
      targetProvision: "ماده ۱۰۸۲",
      context: "قانون حمایت خانواده در مواد متعدد به مقررات مهریه قانون مدنی ارجاع می‌دهد.",
    },
    {
      direction: "amended-by",
      target: ref("q-hoghoogh-khanevadeh-1353", "قانون حمایت خانواده", 1353),
      context: "اصلاح ماده ۱۰۶۵ در خصوص رضایت زوجه.",
    },
    {
      direction: "amended-by",
      target: ref("q-hoghoogh-khanevadeh-1370-1", "قانون حمایت خانواده (اصلاحی ۱۳۷۰)", 1370),
      context: "اصلاح ماده ۱۱۳۳ و الحاق تبصره شروط ضمن عقد.",
    },
    {
      direction: "amended-by",
      target: ref("q-tashil-mahriyeh-1401", "قانون تسهیل ازدواج و حمایت از خانواده", 1401),
      context: "افزودن تبصره به ماده ۱۰۸۲ در خصوص مهریه.",
    },
    {
      direction: "related",
      target: ref("q-kar-1369", "قانون کار", 1369),
      context: "مواردی از قانون کار در قراردادهای کار به اصول کلی قانون مدنی ارجاع می‌دهد.",
    },
  ],
};

// ============================================================
//   2.  قانون مجازات اسلامی  (۱۳۹۲)
// ============================================================
const qanoonMajazat: Law = {
  id: "q-majazat-islami-1392",
  title: "قانون مجازات اسلامی",
  shortTitle: "قانون مجازات اسلامی (کتاب اول)",
  type: "قانون عادی",
  year: 1392,
  number: "۱۲۵",
  status: "amended",
  extent: "کشوری",
  subject: "کیفری",
  promulgatingAuthority: "مجلس شورای اسلامی",
  approvedDate: "۱۳۹۲/۰۱/۲۹",
  effectiveDate: "۱۳۹۲/۰۶/۰۱",
  lastRevisionDate: "۱۴۰۲/۰۵/۱۵",
  description:
    "این قانون که جایگزین قانون مجازات اسلامی مصوب ۱۳۷۰ شد، مجموعه‌ای از قواعد عمومی مسئولیت کیفری و مجازات‌های اسلامی را در ۴ کتاب و ۷۲۸ ماده تدوین کرده است.",
  longDescription:
    "قانون مجازات اسلامی مصوب ۱۳۹۲ در پی یکپارچه‌سازی و رفع ایرادات قانون مجازات اسلامی ۱۳۷۰ تدوین شد. این قانون در چهار کتاب «کلیات»، «حدود»، «قصاص» و «دیات» تنظیم شده و نوآوری‌های مهمی نظیر تفکیک مسئولیت کیفری فردی از سازمانی، تشدید حقوق متهم و بازنگری در قواعد عمومی مسئولیت را به همراه دارد. این قانون از منابع اصلی حقوق کیفری ایران به شمار می‌رود.",
  originalVersion: {
    approvedDate: "۱۳۹۲/۰۱/۲۹",
    description: "نسخه مصوب ۱۳۹۲ — ۷۲۸ ماده در ۴ کتاب.",
  },
  toc: [
    {
      id: "qmi-book-1",
      label: "کتاب اول",
      title: "کلیات",
      type: "book",
      children: [
        {
          id: "qmi-c1",
          label: "فصل اول",
          title: "مقدمه و تعاریف",
          type: "chapter",
          children: [
            {
              id: "qmi-s1",
              label: "باب اول",
              title: "مفاهیم پایه",
              type: "section",
              children: [
                {
                  id: "qmi-t1",
                  label: "مبحث نخست",
                  title: "مفهوم قانون کیفری",
                  type: "topic",
                  articleIds: ["qmi-a1", "qmi-a2"],
                },
                {
                  id: "qmi-t2",
                  label: "مبحث دوم",
                  title: "عمد و قصد",
                  type: "topic",
                  articleIds: ["qmi-a14", "qmi-a18"],
                },
                {
                  id: "qmi-t3",
                  label: "مبحث سوم",
                  title: "تناسب جرم و مجازات",
                  type: "topic",
                  articleIds: ["qmi-a38"],
                },
              ],
            },
          ],
        },
        {
          id: "qmi-c2",
          label: "فصل دوم",
          title: "مسئولیت کیفری",
          type: "chapter",
          children: [
            {
              id: "qmi-s2",
              label: "باب اول",
              title: "عوامل رافع مسئولیت",
              type: "section",
              children: [
                {
                  id: "qmi-t4",
                  label: "مبحث نخست",
                  title: "سازمان مجرمانه",
                  type: "topic",
                  articleIds: ["qmi-a100"],
                },
                {
                  id: "qmi-t5",
                  label: "مبحث دوم",
                  title: "اکراه و اجبار",
                  type: "topic",
                  articleIds: ["qmi-a145"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qmi-book-2",
      label: "کتاب دوم",
      title: "حدود",
      type: "book",
      children: [
        {
          id: "qmi-c3",
          label: "فصل اول",
          title: "مقررات عمومی حدود",
          type: "chapter",
          children: [
            {
              id: "qmi-s3",
              label: "باب اول",
              title: "احکام عمومی",
              type: "section",
              children: [
                {
                  id: "qmi-t6",
                  label: "مبحث نخست",
                  title: "تعاریف و دامنه",
                  type: "topic",
                  articleIds: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qmi-book-3",
      label: "کتاب سوم",
      title: "قصاص",
      type: "book",
      children: [
        {
          id: "qmi-c4",
          label: "فصل اول",
          title: "قصاص نفس",
          type: "chapter",
          children: [
            {
              id: "qmi-s4",
              label: "باب اول",
              title: "شرایط قصاص",
              type: "section",
              children: [
                {
                  id: "qmi-t7",
                  label: "مبحث نخست",
                  title: "قیود قصاص",
                  type: "topic",
                  articleIds: ["qmi-a345"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qmi-book-4",
      label: "کتاب چهارم",
      title: "دیات",
      type: "book",
      children: [
        {
          id: "qmi-c5",
          label: "فصل اول",
          title: "احکام عمومی دیات",
          type: "chapter",
          children: [
            {
              id: "qmi-s5",
              label: "باب اول",
              title: "تعریف و اقسام",
              type: "section",
              children: [
                {
                  id: "qmi-t8",
                  label: "مبحث نخست",
                  title: "مفهوم دیه",
                  type: "topic",
                  articleIds: ["qmi-a500"],
                },
              ],
            },
          ],
        },
      ],
    },    ],
  articles: [
    {
      id: "qmi-a1",
      number: "ماده ۱",
      text:
        "قانون مجازات مجموعه‌ای است از احکام و مقررات کیفری که به منظور حفظ نظم عمومی و آسایش اجتماعی و حفظ آزادی‌ها و حقوق شهروندان وضع شده است.",
    },
    {
      id: "qmi-a2",
      number: "ماده ۲",
      text:
        "هر فعلی یا ترک فعلی که در قانون برای آن مجازات تعیین شده است جرم محسوب می‌شود. هیچ فعلی را نمی‌توان جرم دانست مگر به موجب قانون.",
    },
    {
      id: "qmi-a14",
      number: "ماده ۱۴",
      text:
        "عمدی بودن وقوع جرم با علم و ارتکاب آن همراه است. در مواردی که قانون به اشتباه یا جهل به موضوع اشاره کرده باشد، احکام مربوطه بر اساس آن مواد جاری می‌شود. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۹۶/۰۳/۱۸",
          affectingLaw: ref("q-majazat-amend-1396", "قانون اصلاح قانون مجازات اسلامی", 1396, "ماده ۲", "۱۸۹"),
          text: "این ماده به منظور روشن‌سازی مرز میان عمد و اشتباه اصلاح شد.",
        },
      ],
    },
    {
      id: "qmi-a18",
      number: "ماده ۱۸",
      text:
        "مقصود از قصد، هدف داشتن به انجام عملی است که به موجب قانون جرم محسوب می‌شود.",
    },
    {
      id: "qmi-a38",
      number: "ماده ۳۸",
      text:
        "هیچ مجازاتی باید با تناسب با جرم ارتکابی و شرایط مجرم تعیین شود. [ت۱] قاضی موظف است در تعیین مجازات، شرایط فردی، سابقه و انگیزه مجرم را لحاظ کند. [ت۲]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "افزوده",
          date: "۱۳۹۶/۰۳/۱۸",
          affectingLaw: ref("q-majazat-amend-1396", "قانون اصلاح قانون مجازات اسلامی", 1396, "ماده ۴", "۱۸۹"),
          text: "اصول تناسب جرم و مجازات صراحتاً به قانون افزوده شد.",
        },
        {
          marker: "ت۲",
          effectType: "افزوده",
          date: "۱۴۰۲/۰۵/۱۵",
          affectingLaw: ref("q-majazat-amend-1402", "قانون اصلاح برخی مواد قانون مجازات اسلامی", 1402, "ماده ۱۲", "۲۲۱"),
          text: "تبصره‌ای در خصوص الزام قاضی به لحاظ شرایط فردی مجرم الحاق شد.",
        },
      ],
    },
    {
      id: "qmi-a100",
      number: "ماده ۱۰۰",
      text:
        "سازمان مجرمانه زمانی مسئول است که جرم به دست مدیران یا نمایندگان آن مرتکب شود و در راستای منافع سازمان باشد.",
    },
    {
      id: "qmi-a145",
      number: "ماده ۱۴۵",
      text:
        "هرگاه شخصی به سبب اکراه یا اجبار مرتکب جرمی شود، مسئولیتی متوجه او نخواهد بود.",
    },
    {
      id: "qmi-a345",
      number: "ماده ۳۴۵",
      text:
        "قصاص در صورتی ثابت می‌شود که قاتل عمداً و با قصد کشتن، جان شخص دیگری را سلب کرده باشد.",
    },
    {
      id: "qmi-a500",
      number: "ماده ۵۰۰",
      text:
        "دیه مال معینی است که در صورت جنایت عمدی یا شبه‌عمدی به نفس یا عضو، باید به مجنی‌علیه یا اولیای دم پرداخت شود.",
    },
  ],
  amendments: [
    {
      date: "۱۳۹۲/۰۶/۰۱",
      dateLabel: "شهریور ۱۳۹۲",
      effectType: "اجرا",
      affectedProvision: "همه مواد",
      affectingLaw: ref("q-majazat-islami-1392", "قانون مجازات اسلامی", 1392, "ماده ۷۲۸"),
      description: "تاریخ اجرای قانون پس از یک دوره بررسی به تأیید مجلس رسید.",
      appliedToText: true,
    },
    {
      date: "۱۳۹۶/۰۳/۱۸",
      dateLabel: "خرداد ۱۳۹۶",
      effectType: "اصلاح",
      affectedProvision: "ماده ۱۴",
      affectedProvisionId: "qmi-a14",
      affectingLaw: ref("q-majazat-amend-1396", "قانون اصلاح قانون مجازات اسلامی", 1396, "ماده ۲", "۱۸۹"),
      description: "روش‌سازی مرز عمد و اشتباه در وقوع جرم.",
      appliedToText: true,
      beforeText:
        "عمدی بودن وقوع جرم با علم و ارتکاب آن همراه است.",
      afterText:
        "عمدی بودن وقوع جرم با علم و ارتکاب آن همراه است. در مواردی که قانون به اشتباه یا جهل به موضوع اشاره کرده باشد، احکام مربوطه بر اساس آن مواد جاری می‌شود.",
    },
    {
      date: "۱۳۹۶/۰۳/۱۸",
      dateLabel: "خرداد ۱۳۹۶",
      effectType: "افزوده",
      affectedProvision: "ماده ۳۸",
      affectedProvisionId: "qmi-a38",
      affectingLaw: ref("q-majazat-amend-1396", "قانون اصلاح قانون مجازات اسلامی", 1396, "ماده ۴", "۱۸۹"),
      description: "الحاق اصل تناسب جرم و مجازات به قانون.",
      appliedToText: true,
    },
    {
      date: "۱۳۹۹/۰۸/۰۱",
      dateLabel: "آبان ۱۳۹۹",
      effectType: "حذف",
      affectedProvision: "ماده ۴۹",
      affectingLaw: ref("q-majazat-amend-1399", "قانون کاهش مجازات تعزیری", 1399, "ماده ۱", "۱۱۹"),
      description: "حذف حبس برای برخی جرایم تعزیری با مجازات کم و جایگزینی آن با مجازات‌های جایگزین.",
      appliedToText: true,
    },
    {
      date: "۱۴۰۲/۰۵/۱۵",
      dateLabel: "مرداد ۱۴۰۲",
      effectType: "افزوده",
      affectedProvision: "ماده ۳۸",
      affectedProvisionId: "qmi-a38",
      affectingLaw: ref("q-majazat-amend-1402", "قانون اصلاح برخی مواد قانون مجازات اسلامی", 1402, "ماده ۱۲", "۲۲۱"),
      description: "الحاق تبصره الزام قاضی به لحاظ شرایط فردی مجرم در تعیین مجازات.",
      appliedToText: true,
      beforeText:
        "هیچ مجازاتی باید با تناسب با جرم ارتکابی و شرایط مجرم تعیین شود.",
      afterText:
        "هیچ مجازاتی باید با تناسب با جرم ارتکابی و شرایط مجرم تعیین شود. قاضی موظف است در تعیین مجازات، شرایط فردی، سابقه و انگیزه مجرم را لحاظ کند.",
    },
    {
      date: "۱۴۰۲/۰۵/۱۵",
      dateLabel: "مرداد ۱۴۰۲",
      effectType: "اصلاح",
      affectedProvision: "ماده ۵۸",
      affectingLaw: ref("q-majazat-amend-1402", "قانون اصلاح برخی مواد قانون مجازات اسلامی", 1402, "ماده ۸", "۲۲۱"),
      description: "اصلاح مقررات مربوط به تعلیق اجرای مجازات.",
      appliedToText: true,
    },
  ],
  outstandingChanges: [
    {
      affectedProvision: "ماده ۱۳۳",
      effectType: "افزوده",
      affectingLaw: ref("q-majazat-amend-1404", "قانون اصلاح مواد حدی", 1404, "ماده ۳", "۲۹۰"),
      description: "اصلاح مقررات مربوط به حدود و قواعد عمومی اجرای آن.",
      expectedDate: "۱۴۰۵/۰۳/۲۱",
    },
  ],
  references: [
    {
      direction: "cites",
      target: ref("q-asasi-1358", "قانون اساسی جمهوری اسلامی ایران", 1358, "اصل ۱۶۹"),
      sourceProvision: "ماده ۲",
      context: "اصل ۱۶۹ قانون اساسی شرط لزوم تعیین مجازات به موجب قانون را تبیین می‌کند.",
    },
    {
      direction: "amended-by",
      target: ref("q-majazat-amend-1396", "قانون اصلاح قانون مجازات اسلامی", 1396),
      context: "اصلاح مواد ۱۴ و ۳۸.",
    },
    {
      direction: "amended-by",
      target: ref("q-majazat-amend-1402", "قانون اصلاح برخی مواد قانون مجازات اسلامی", 1402),
      context: "الحاق تبصره به ماده ۳۸ و اصلاح ماده ۵۸.",
    },
    {
      direction: "related",
      target: ref("q-aghkam-1378", "قانون آیین دادرسی کیفری", 1378),
      context: "آیین دادرسی کیفری نحوه تعقیب، رسیدگی و اجرای مجازات را تنظیم می‌کند.",
    },
    {
      direction: "cited-by",
      target: ref("q-kar-1369", "قانون کار", 1369, "ماده ۱۴۲"),
      targetProvision: "ماده ۱۰۰",
      context: "قانون کار در باره مسئولیت کیفری اشخاص حقوقی به قانون مجازات اسلامی ارجاع می‌دهد.",
    },
  ],
};

// ============================================================
//   3.  قانون تجارت  (۱۳۰۲)
// ============================================================
const qanoonTejarat: Law = {
  id: "q-tejarat-1302",
  title: "قانون تجارت",
  shortTitle: "قانون تجارت",
  type: "قانون عادی",
  year: 1302,
  number: "۱۴۷",
  status: "amended",
  extent: "کشوری",
  subject: "تجاری",
  promulgatingAuthority: "مجلس شورای ملی",
  approvedDate: "۱۳۰۲/۰۲/۲۲",
  effectiveDate: "۱۳۰۲/۰۲/۲۲",
  lastRevisionDate: "۱۳۸۸/۰۴/۱۷",
  description:
    "این قانون روابط تجاری اشخاص، شرکت‌های تجاری و اسناد تجاری را در ۵۹۰ ماده تنظیم می‌کند و یکی از قدیمی‌ترین قوانین اقتصادی ایران است.",
  longDescription:
    "قانون تجارت مصوب ۱۳۰۲ یکی از کهن‌ترین قوانین مدوّن ایران است که در پی تجدید ساختار اقتصادی کشور در دوران پهلوی اول به تصویب رسید. این قانون به سه بخش اصلی تقسیم می‌شود: بخش اول در تجارت و کنش‌های تجاری، بخش دوم در شرکت‌های تجاری، و بخش سوم در اسناد تجاری. هرچند قانون تجارت در طول ده‌ها سال بارها اصلاح و تکمیل شده — از جمله با قانون تجارت الکترونیک مصوب ۱۳۸۲ — ساختار اولیه آن همچنان پابرجاست و بسیاری از مفاهیم بنیادین حقوق تجارت ایران را شکل می‌دهد.",
  originalVersion: {
    approvedDate: "۱۳۰۲/۰۲/۲۲",
    description: "نسخه مصوب ۱۳۰۲ — ۵۹۰ ماده در سه بخش.",
  },
  toc: [
    {
      id: "qt-book-1",
      label: "کتاب اول",
      title: "در تجارت و کنش‌های تجاری",
      type: "book",
      children: [
        {
          id: "qt-c1",
          label: "فصل اول",
          title: "کنش‌های تجاری",
          type: "chapter",
          children: [
            {
              id: "qt-s1",
              label: "باب اول",
              title: "معاملات تجاری",
              type: "section",
              children: [
                {
                  id: "qt-t1",
                  label: "مبحث نخست",
                  title: "تعریف معاملات تجاری",
                  type: "topic",
                  articleIds: ["qt-a1", "qt-a2", "qt-a3"],
                },
                {
                  id: "qt-t2",
                  label: "مبحث دوم",
                  title: "دفاتر تجاری",
                  type: "topic",
                  articleIds: ["qt-a5"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qt-book-2",
      label: "کتاب دوم",
      title: "در شرکت‌های تجاری",
      type: "book",
      children: [
        {
          id: "qt-c2",
          label: "فصل اول",
          title: "اقسام شرکت‌های تجاری",
          type: "chapter",
          children: [
            {
              id: "qt-s2",
              label: "باب اول",
              title: "شرکت‌های تجاری",
              type: "section",
              children: [
                {
                  id: "qt-t3",
                  label: "مبحث نخست",
                  title: "تعریف شرکت‌های تجاری",
                  type: "topic",
                  articleIds: ["qt-a20"],
                },
                {
                  id: "qt-t4",
                  label: "مبحث دوم",
                  title: "شرکت سهامی",
                  type: "topic",
                  articleIds: ["qt-a55"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qt-book-3",
      label: "کتاب سوم",
      title: "در اسناد تجاری",
      type: "book",
      children: [
        {
          id: "qt-c3",
          label: "فصل اول",
          title: "برات",
          type: "chapter",
          children: [
            {
              id: "qt-s3",
              label: "باب اول",
              title: "احکام برات",
              type: "section",
              children: [
                {
                  id: "qt-t5",
                  label: "مبحث نخست",
                  title: "تعریف برات",
                  type: "topic",
                  articleIds: ["qt-a223"],
                },
              ],
            },
          ],
        },
      ],
    },    ],
  articles: [
    {
      id: "qt-a1",
      number: "ماده ۱",
      text:
        "معاملات و کنش‌های ذیل تجاری محسوب می‌شود: ۱ - خرید و فروش هر قسم مال منقول برای کسب سود. ۲ - هر قراردادی راجع به تأسیس یا اداره شرکت‌های تجاری. ۳ - هر شرکت یا قرارداد مالی که برای انجام کار تجاری منعقد شود.",
    },
    {
      id: "qt-a2",
      number: "ماده ۲",
      text:
        "کسب‌وکارهایی که به وسیله اشخاص زیر به عمل می‌آید ذاتاً تجاری محسوب نمی‌شود ولی در صورت اعلام ورشکستگی تابع مقررات ورشکستگی تجاری خواهد بود: ۱ - خریداران ملبوس و ملزومات خانه. ۲ - اشخاصی که به اجرای درآوردن اموال منقول می‌پردازند.",
    },
    {
      id: "qt-a3",
      number: "ماده ۳",
      text:
        "کسب‌وکارهایی که در این قانون ذکر شده تجاری محسوب می‌شوند حتی اگر تجارت‌پیشه نباشند. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۴۷/۰۴/۲۶",
          affectingLaw: ref("q-tejarat-amend-1347", "قانون اصلاح قانون تجارت", 1347, "ماده ۱", "۶۸"),
          text: "این ماده در راستای روشن‌سازی حدود معاملات تجاری اصلاح شد.",
        },
      ],
    },
    {
      id: "qt-a5",
      number: "ماده ۵",
      text:
        "تجار مکلفند دفاتر تجاری اشاره‌شده در این قانون را داشته باشند و در آن تمامی معاملات تجاری خود را ثبت کنند.",
    },
    {
      id: "qt-a20",
      number: "ماده ۲۰",
      text:
        "شرکت‌های تجاری عبارت‌اند از: ۱ - شرکت سهامی. ۲ - شرکت با مسئولیت محدود. ۳ - شرکت تضامنی. ۴ - شرکت مختلط. ۵ - شرکت مختلط سهامی. ۶ - شرکت نسبی. ۷ - شرکت تعاونی.",
    },
    {
      id: "qt-a55",
      number: "ماده ۵۵",
      text:
        "شرکت سهامی شرکتی است که سرمایه آن به سهام مساوی تقسیم شده و مسئولیت صاحبان سهام محدود به مبلغ اسمی سهام آن‌هاست. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۴۸/۰۸/۰۷",
          affectingLaw: ref("q-sahami-1348", "لایحه اصلاح قانون تجارت (بخش شرکت‌های سهامی)", 1348, "ماده ۱", "۹۴"),
          text: "تعریف شرکت سهامی و قواعد مربوط به آن به صورت جامع‌تر بازنویسی شد.",
        },
      ],
    },
    {
      id: "qt-a223",
      number: "ماده ۲۲۳",
      text:
        "برات سندی است که به موجب آن امضاکننده به شخص دیگری دستور می‌دهد که وجه معینی را در موعد مقرر به شخصی که تعیین شده پرداخت نماید.",
    },
  ],
  amendments: [
    {
      date: "۱۳۴۷/۰۴/۲۶",
      dateLabel: "تیر ۱۳۴۷",
      effectType: "اصلاح",
      affectedProvision: "ماده ۳",
      affectedProvisionId: "qt-a3",
      affectingLaw: ref("q-tejarat-amend-1347", "قانون اصلاح قانون تجارت", 1347, "ماده ۱", "۶۸"),
      description: "روشن‌سازی حدود معاملات تجاری.",
      appliedToText: true,
    },
    {
      date: "۱۳۴۸/۰۸/۰۷",
      dateLabel: "آبان ۱۳۴۸",
      effectType: "اصلاح",
      affectedProvision: "ماده ۵۵",
      affectedProvisionId: "qt-a55",
      affectingLaw: ref("q-sahami-1348", "لایحه اصلاح قانون تجارت (بخش شرکت‌های سهامی)", 1348, "ماده ۱", "۹۴"),
      description: "تعریف شرکت سهامی به طور جامع بازنویسی شد.",
      appliedToText: true,
      note: "این اصلاح همراه با تدوین لایحه اصلاحی برای شرکت‌های سهامی انجام شد.",
      beforeText:
        "شرکت سهامی شرکتی است که سرمایه آن به سهام تقسیم شده باشد.",
      afterText:
        "شرکت سهامی شرکتی است که سرمایه آن به سهام مساوی تقسیم شده و مسئولیت صاحبان سهام محدود به مبلغ اسمی سهام آن‌هاست.",
    },
    {
      date: "۱۳۸۲/۱۰/۰۸",
      dateLabel: "دی ۱۳۸۲",
      effectType: "افزوده",
      affectedProvision: "کتاب جدید الکترونیکی",
      affectingLaw: ref("q-tejarat-elec-1382", "قانون تجارت الکترونیک", 1382, "ماده ۱", "۹۷"),
      description: "الحاق مقررات تجارت الکترونیک به نظام حقوقی تجارت.",
      appliedToText: true,
    },
    {
      date: "۱۳۸۸/۰۴/۱۷",
      dateLabel: "تیر ۱۳۸۸",
      effectType: "اصلاح",
      affectedProvision: "مواد ۶ و ۴۰",
      affectingLaw: ref("q-tejarat-amend-1388", "قانون اصلاح قانون تجارت", 1388, "ماده ۱", "۳۰۲"),
      description: "اصلاح مقررات ثبت شرکت‌ها و دفاتر تجاری.",
      appliedToText: true,
    },
  ],
  outstandingChanges: [],
  references: [
    {
      direction: "cites",
      target: ref("q-madani-1307", "قانون مدنی", 1307, "ماده ۱۰"),
      sourceProvision: "ماده ۱",
      context: "قانون تجارت در باب کلیات قراردادها به اصول کلی قانون مدنی ارجاع می‌دهد.",
    },
    {
      direction: "cited-by",
      target: ref("q-tejarat-elec-1382", "قانون تجارت الکترونیک", 1382, "ماده ۴"),
      targetProvision: "ماده ۵",
      context: "قانون تجارت الکترونیک در باب دفاتر تجاری به قانون تجارت ارجاع می‌دهد.",
    },
    {
      direction: "related",
      target: ref("q-sahami-1348", "لایحه اصلاح قانون تجارت (بخش شرکت‌های سهامی)", 1348),
      context: "مقررات تفصیلی شرکت‌های سهامی در این لایحه آورده شده است.",
    },
  ],
};

// ============================================================
//   4.  قانون کار  (۱۳۶۹)
// ============================================================
const qanoonKar: Law = {
  id: "q-kar-1369",
  title: "قانون کار",
  shortTitle: "قانون کار",
  type: "قانون عادی",
  year: 1369,
  number: "۱۳۴",
  status: "amended",
  extent: "کشوری",
  subject: "کار",
  promulgatingAuthority: "مجلس شورای اسلامی",
  approvedDate: "۱۳۶۹/۰۷/۲۰",
  effectiveDate: "۱۳۶۹/۱۱/۰۱",
  lastRevisionDate: "۱۴۰۰/۰۷/۱۰",
  description:
    "این قانون روابط کارفرما و کارگر، قرارداد کار، شرایط کار، حقوق و مزایا و تأمین اجتماعی را در ۲۷ فصل و ۱۹۲ ماده تنظیم می‌کند.",
  longDescription:
    "قانون کار مصوب ۱۳۶۹ پس از انقلاب اسلامی در راستای تنظیم روابط کار و حمایت از حقوق کارگران و کارفرمایان تدوین شد. این قانون جایگزین قانون کار مصوب ۱۳۳۸ گردید و در ۲۷ فصل و ۱۹۲ ماده، موضوعات مختلفی از جمله قرارداد کار، ساعت کار، مرخصی، حداقل دستمزد، ایمنی شغلی و تأمین اجتماعی را پوشش می‌دهد. قانون کار از منابع اصلی حقوق کار ایران محسوب می‌شود و هرچند در طول دهه‌ها بارها اصلاح شده، چارچوب اصلی آن همچنان پابرجاست.",
  originalVersion: {
    approvedDate: "۱۳۶۹/۰۷/۲۰",
    description: "نسخه مصوب ۱۳۶۹ — ۱۹۲ ماده در ۲۷ فصل.",
  },
  toc: [
    {
      id: "qk-book-1",
      label: "کتاب اول",
      title: "کلیات",
      type: "book",
      children: [
        {
          id: "qk-c1",
          label: "فصل اول",
          title: "مقدمه و دامنه",
          type: "chapter",
          children: [
            {
              id: "qk-s1",
              label: "باب اول",
              title: "تعاریف",
              type: "section",
              children: [
                {
                  id: "qk-t1",
                  label: "مبحث نخست",
                  title: "هدف قانون",
                  type: "topic",
                  articleIds: ["qk-a1"],
                },
                {
                  id: "qk-t2",
                  label: "مبحث دوم",
                  title: "دامنه کاربرد",
                  type: "topic",
                  articleIds: ["qk-a2"],
                },
                {
                  id: "qk-t3",
                  label: "مبحث سوم",
                  title: "تعریف کارگر",
                  type: "topic",
                  articleIds: ["qk-a3"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qk-book-2",
      label: "کتاب دوم",
      title: "قرارداد کار",
      type: "book",
      children: [
        {
          id: "qk-c2",
          label: "فصل اول",
          title: "انعقاد و اقسام قرارداد",
          type: "chapter",
          children: [
            {
              id: "qk-s2",
              label: "باب اول",
              title: "انعقاد قرارداد",
              type: "section",
              children: [
                {
                  id: "qk-t4",
                  label: "مبحث نخست",
                  title: "تعریف قرارداد کار",
                  type: "topic",
                  articleIds: ["qk-a10"],
                },
                {
                  id: "qk-t5",
                  label: "مبحث دوم",
                  title: "اقسام قرارداد",
                  type: "topic",
                  articleIds: ["qk-a11"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qk-book-3",
      label: "کتاب سوم",
      title: "ساعات کار، مرخصی و تعطیلات",
      type: "book",
      children: [
        {
          id: "qk-c3",
          label: "فصل اول",
          title: "ساعات کار",
          type: "chapter",
          children: [
            {
              id: "qk-s3",
              label: "باب اول",
              title: "حداکثر ساعات کار",
              type: "section",
              children: [
                {
                  id: "qk-t6",
                  label: "مبحث نخست",
                  title: "سقف ساعات کار هفتگی",
                  type: "topic",
                  articleIds: ["qk-a51"],
                },
              ],
            },
          ],
        },
        {
          id: "qk-c4",
          label: "فصل دوم",
          title: "مرخصی",
          type: "chapter",
          children: [
            {
              id: "qk-s4",
              label: "باب اول",
              title: "مرخصی استحقاقی",
              type: "section",
              children: [
                {
                  id: "qk-t7",
                  label: "مبحث نخست",
                  title: "حق مرخصی",
                  type: "topic",
                  articleIds: ["qk-a62"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "qk-book-4",
      label: "کتاب چهارم",
      title: "دستمزد و مزایا",
      type: "book",
      children: [
        {
          id: "qk-c5",
          label: "فصل اول",
          title: "حداقل دستمزد",
          type: "chapter",
          children: [
            {
              id: "qk-s5",
              label: "باب اول",
              title: "تعیین حداقل مزد",
              type: "section",
              children: [
                {
                  id: "qk-t8",
                  label: "مبحث نخست",
                  title: "حداقل مزد",
                  type: "topic",
                  articleIds: ["qk-a138"],
                },
              ],
            },
          ],
        },
        {
          id: "qk-c6",
          label: "فصل دوم",
          title: "ساعات اضافه‌کاری",
          type: "chapter",
          children: [
            {
              id: "qk-s6",
              label: "باب اول",
              title: "احکام اضافه‌کاری",
              type: "section",
              children: [
                {
                  id: "qk-t9",
                  label: "مبحث نخست",
                  title: "شرایط کار اضافه",
                  type: "topic",
                  articleIds: ["qk-a142"],
                },
              ],
            },
          ],
        },
      ],
    },    ],
  articles: [
    {
      id: "qk-a1",
      number: "ماده ۱",
      text:
        "قانون کار در راستای احیای حقوق شرعی و قانونی کارگران و کارفرمایان و رابطه سالم میان آن‌ها، تنظیم شده و هدف آن حفظ حقوق متقابل طرفین و ارتقای بهره‌وری است.",
    },
    {
      id: "qk-a2",
      number: "ماده ۲",
      text:
        "این قانون بر روابط کارگر و کارفرمای واحدهای موضوع این قانون اعم از کارگاه‌های تولیدی، صنعتی، خدماتی و کشاورزی کاربرد دارد.",
    },
    {
      id: "qk-a3",
      number: "ماده ۳",
      text:
        "کارگر کسی است که به هر عنوان در مقابل دریافت مزد، کار می‌کند بر حسب دستور کارفرما. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۸۰/۰۸/۲۳",
          affectingLaw: ref("q-kar-amend-1380", "قانون اصلاح قانون کار", 1380, "ماده ۲", "۸۹"),
          text: "تعریف کارگر با لحاظ قراردادهای جدید کاری بازنویسی شد.",
        },
      ],
    },
    {
      id: "qk-a10",
      number: "ماده ۱۰",
      text:
        "قرارداد کار عبارت است از توافق کارگر و کارفرما که به موجب آن، کارگر به کارفرما ملتزم می‌شود که کار معینی را به دستور کارفرما انجام دهد و کارفرما ملتزم است مزد معینی بپردازد.",
    },
    {
      id: "qk-a11",
      number: "ماده ۱۱",
      text:
        "قرارداد کار ممکن است به مدت معین، به مدت نامعین یا برای انجام کار معین باشد. در صورت انقضای مدت قرارداد معین و ادامه کار، قرارداد به قرارداد با مدت نامعین تبدیل می‌شود.",
    },
    {
      id: "qk-a51",
      number: "ماده ۵۱",
      text:
        "ساعات کار کارگران نباید از ۴۴ ساعت در هفته تجاوز کند. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۸۸/۰۷/۱۳",
          affectingLaw: ref("q-kar-amend-1388", "قانون اصلاح قانون کار", 1388, "ماده ۱۳", "۲۱۰"),
          text: "حداکثر ساعات کار از ۴۴ به ۴۴ ساعت در هفته (با احتساب کاهش در ماه رمضان) بازنگری شد.",
        },
      ],
    },
    {
      id: "qk-a62",
      number: "ماده ۶۲",
      text:
        "کارفرما مکلف است به کارگری که حداقل یک سال به او کار کرده است برای هر سال سابقه، ۲۶ روز کاری مرخصی استحقاقی بدهد.",
    },
    {
      id: "qk-a138",
      number: "ماده ۱۳۸",
      text:
        "حداقل مزد کارگران هر سال توسط شورای عالی کار تعیین می‌شود و هیچ قراردادی که مزد کمتر از این مبلغ تعیین کند، فاقد اعتبار است.",
    },
    {
      id: "qk-a142",
      number: "ماده ۱۴۲",
      text:
        "هیچ کارگری نباید بیش از ۸ ساعت در روز کار کند. کار اضافی باید با رضایت کارگر و با مزد اضافه‌کاری پرداخت شود. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "افزوده",
          date: "۱۴۰۰/۰۷/۱۰",
          affectingLaw: ref("q-kar-amend-1400", "قانون حمایت از حقوق کارگران", 1400, "ماده ۴", "۲۵۶"),
          text: "الزام رضایت کارگر برای کار اضافه‌کاری صراحتاً به قانون افزوده شد.",
        },
      ],
    },
  ],
  amendments: [
    {
      date: "۱۳۸۰/۰۸/۲۳",
      dateLabel: "آبان ۱۳۸۰",
      effectType: "اصلاح",
      affectedProvision: "ماده ۳",
      affectedProvisionId: "qk-a3",
      affectingLaw: ref("q-kar-amend-1380", "قانون اصلاح قانون کار", 1380, "ماده ۲", "۸۹"),
      description: "تعریف کارگر بازنویسی شد و قراردادهای جدید کاری لحاظ گردید.",
      appliedToText: true,
    },
    {
      date: "۱۳۸۸/۰۷/۱۳",
      dateLabel: "مهر ۱۳۸۸",
      effectType: "اصلاح",
      affectedProvision: "ماده ۵۱",
      affectedProvisionId: "qk-a51",
      affectingLaw: ref("q-kar-amend-1388", "قانون اصلاح قانون کار", 1388, "ماده ۱۳", "۲۱۰"),
      description: "بازنگری در ساعات کار هفتگی.",
      appliedToText: true,
    },
    {
      date: "۱۴۰۰/۰۷/۱۰",
      dateLabel: "مهر ۱۴۰۰",
      effectType: "افزوده",
      affectedProvision: "ماده ۱۴۲",
      affectedProvisionId: "qk-a142",
      affectingLaw: ref("q-kar-amend-1400", "قانون حمایت از حقوق کارگران", 1400, "ماده ۴", "۲۵۶"),
      description: "الزام رضایت کارگر برای کار اضافه‌کاری.",
      appliedToText: true,
      note: "این اصلاح در راستای کاهش پرونده‌های مربوط به کار اجباری صورت گرفت.",
      beforeText:
        "هیچ کارگری نباید بیش از ۸ ساعت در روز کار کند. کار اضافی باید با مزد اضافه‌کاری پرداخت شود.",
      afterText:
        "هیچ کارگری نباید بیش از ۸ ساعت در روز کار کند. کار اضافی باید با رضایت کارگر و با مزد اضافه‌کاری پرداخت شود.",
    },
  ],
  outstandingChanges: [
    {
      affectedProvision: "ماده ۱۵۰",
      effectType: "افزوده",
      affectingLaw: ref("q-kar-amend-1404", "قانون حمایت تکمیلی کارگران", 1404, "ماده ۲", "۲۸۹"),
      description: "افزودن مقررات جدید در خصوص بیمه بیکاری و حمایت از کارگران قرارداد موقت.",
      expectedDate: "۱۴۰۵/۰۱/۰۱",
    },
  ],
  references: [
    {
      direction: "cites",
      target: ref("q-madani-1307", "قانون مدنی", 1307, "ماده ۱۰"),
      sourceProvision: "ماده ۱۰",
      context: "اصول کلی قراردادها در قانون مدنی برای قرارداد کار نیز معتبر است.",
    },
    {
      direction: "cites",
      target: ref("q-majazat-islami-1392", "قانون مجازات اسلامی", 1392, "ماده ۱۰۰"),
      sourceProvision: "ماده ۱۴۲",
      context: "مسئولیت کیفری کارفرمایان ناقض حقوق کارگران بر اساس قانون مجازات اسلامی بررسی می‌شود.",
    },
    {
      direction: "related",
      target: ref("q-tamin-ejtemaei-1354", "قانون تأمین اجتماعی", 1354),
      context: "بیمه و تأمین اجتماعی کارگران تابع قانون تأمین اجتماعی است.",
    },
    {
      direction: "cited-by",
      target: ref("q-kar-amend-1388", "قانون اصلاح قانون کار", 1388, "ماده ۱۳"),
      targetProvision: "ماده ۵۱",
      context: "اصلاح ساعات کار هفتگی.",
    },
  ],
};

// ============================================================
//   5.  قانون اساسی  (۱۳۵۸ / بازنگری ۱۳۶۸)
// ============================================================
const qanoonAsasi: Law = {
  id: "q-asasi-1358",
  title: "قانون اساسی جمهوری اسلامی ایران",
  shortTitle: "قانون اساسی",
  type: "قانون اساسی",
  year: 1358,
  number: "—",
  status: "amended",
  extent: "کشوری",
  subject: "اساسی",
  promulgatingAuthority: "مجلس خبرگان قانون اساسی",
  approvedDate: "۱۳۵۸/۰۹/۲۴",
  effectiveDate: "۱۳۵۸/۰۹/۲۴",
  lastRevisionDate: "۱۳۶۸/۰۶/۲۴",
  description:
    "قانون اساسی که در پی پیروزی انقلاب اسلامی به تصویب مردم رسید، چارچوب کلی نظام سیاسی و حقوق بنیادین شهروندان ایران را در ۱۷۷ اصل تبیین می‌کند.",
  longDescription:
    "قانون اساسی جمهوری اسلامی ایران در روز ۱۲ فروردین ۱۳۵۸ به تصویب مردم رسید و در ۲۴ آذر همان سال به اجرا درآمد. این قانون پس از بازنگری در سال ۱۳۶۸ به شکل کنونی خود درآمد و در ۱۷۷ اصل، اصول کلی نظام سیاسی، حقوق بنیادین شهروندان، قوای سه‌گانه و سایر نهادهای حاکمیتی را تنظیم می‌کند. قانون اساسی بالاترین سند حقوقی کشور است و هیچ قانون یا مقرراتی نمی‌تواند با آن در تعارض باشد. شورای نگهبان وظیفه نظارت بر تطابق قوانین عادی با قانون اساسی را بر عهده دارد.",
  originalVersion: {
    approvedDate: "۱۳۵۸/۰۹/۲۴",
    description: "نسخه مصوب ۱۳۵۸ — ۱۷۷ اصل. در بازنگری ۱۳۶۸ برخی اصول اصلاح و اصول جدیدی افزوده شد.",
  },
  toc: [
    {
      id: "qa-c1",
      label: "فصل اول",
      title: "اصول کلی",
      type: "chapter",
      children: [
        {
          id: "qa-s1",
          label: "باب اول",
          title: "حاکمیت و نظام سیاسی",
          type: "section",
          children: [
            {
              id: "qa-t1",
              label: "مبحث نخست",
              title: "حاکمیت ملی و جمهوری اسلامی",
              type: "topic",
              articleIds: ["qa-a1", "qa-a2", "qa-a4"],
            },
          ],
        },
      ],
    },
    {
      id: "qa-c2",
      label: "فصل سوم",
      title: "حقوق ملت",
      type: "chapter",
      children: [
        {
          id: "qa-s2",
          label: "باب اول",
          title: "برابری و آزادی‌ها",
          type: "section",
          children: [
            {
              id: "qa-t2",
              label: "مبحث نخست",
              title: "برابری و حقوق بنیادین",
              type: "topic",
              articleIds: ["qa-a19", "qa-a20"],
            },
          ],
        },
      ],
    },
    {
      id: "qa-c3",
      label: "فصل ششم",
      title: "قوه مقننه",
      type: "chapter",
      children: [
        {
          id: "qa-s3",
          label: "باب اول",
          title: "مجلس شورای اسلامی",
          type: "section",
          children: [
            {
              id: "qa-t3",
              label: "مبحث نخست",
              title: "طرح‌ها و صلاحیت‌ها",
              type: "topic",
              articleIds: ["qa-a71"],
            },
            {
              id: "qa-t4",
              label: "مبحث دوم",
              title: "هیئت وزیران",
              type: "topic",
              articleIds: ["qa-a85"],
            },
          ],
        },
      ],
    },
    {
      id: "qa-c4",
      label: "فصل دوازدهم",
      title: "شورای نگهبان",
      type: "chapter",
      children: [
        {
          id: "qa-s4",
          label: "باب اول",
          title: "ترکیب و صلاحیت",
          type: "section",
          children: [
            {
              id: "qa-t5",
              label: "مبحث نخست",
              title: "ترکیب و وظایف شورا",
              type: "topic",
              articleIds: ["qa-a96", "qa-a98"],
            },
          ],
        },
      ],
    },
    {
      id: "qa-c5",
      label: "فصل سیزدهم",
      title: "شورای بازنگری",
      type: "chapter",
      children: [
        {
          id: "qa-s5",
          label: "باب اول",
          title: "اصلاح قانون اساسی",
          type: "section",
          children: [
            {
              id: "qa-t6",
              label: "مبحث نخست",
              title: "رویه اصلاح",
              type: "topic",
              articleIds: ["qa-a177"],
            },
          ],
        },
      ],
    },    ],
  articles: [
    {
      id: "qa-a1",
      number: "اصل یک",
      text:
        "حکومت ایران امر الهی است و در نظام جمهوری اسلامی، حاکمیت ملی بر اساس اصل ولایت امر بر مردم باز می‌گردد. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۶۸/۰۶/۲۴",
          affectingLaw: ref("q-asasi-baznegari-1368", "قانون اساسی بازنگری‌شده", 1368, "اصل یک"),
          text: "اصول مربوط به حاکمیت ملی در بازنگری ۱۳۶۸ بازنویسی شد.",
        },
      ],
    },
    {
      id: "qa-a2",
      number: "اصل دو",
      text:
        "نظام جمهوری اسلامی بر پایه یک رأی عمومی مردم استوار است و در آن امر قضاوت و سیادت سیاسی بر عهده مردم است.",
    },
    {
      id: "qa-a4",
      number: "اصل چهار",
      text:
        "همه قوانین و مقررات مدنی، کیفری، مالی، اقتصادی، اداری، فرهنگی، نظامی، سیاسی و سایر موارد باید بر اساس موازین اسلامی باشد.",
    },
    {
      id: "qa-a19",
      number: "اصل نوزده",
      text:
        "مردم ایران از هر قوم و قبیله که باشند از حقوق مساوی برخوردارند و رنگ، نژاد، زبان و مانند آن سبب امتیاز نخواهد بود.",
    },
    {
      id: "qa-a20",
      number: "اصل بیست",
      text:
        "همه افراد ملت اعم از زن و مرد یکسان تحت حمایت قانون قرار دارند و از همه حقوق انسانی، سیاسی، اقتصادی، اجتماعی و فرهنگی بر اساس موازین اسلامی برخوردارند.",
    },
    {
      id: "qa-a71",
      number: "اصل هفتاد و یک",
      text:
        "مجلس شورای اسلامی می‌تواند در موارد ضروری طرح‌های دو فوریتی را به تصویب برساند. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۶۸/۰۶/۲۴",
          affectingLaw: ref("q-asasi-baznegari-1368", "قانون اساسی بازنگری‌شده", 1368, "اصل هفتاد و یک"),
          text: "این اصل در بازنگری ۱۳۶۸ به منظور تنظیم رویه طرح‌های فوریتی اصلاح شد.",
        },
      ],
    },
    {
      id: "qa-a85",
      number: "اصل هشتاد و پنج",
      text:
        "تعیین وزیران پس از کسب رأی اعتماد مجلس به فهرست پیشنهادی رئیس‌جمهور انجام می‌گیرد.",
    },
    {
      id: "qa-a96",
      number: "اصل نود و شش",
      text:
        "مجلس شورای اسلامی از نمایندگان ملت که به طور مستقیم و با رأی مخفی انتخاب می‌شوند، تشکیل می‌گردد.",
    },
    {
      id: "qa-a98",
      number: "اصل نود و هشت",
      text:
        "شورای نگهبان از دوازده عضو تشکیل می‌شود: شش فقیه توسط رهبری و شش حقوق‌دان در رشته‌های مختلف حقوقی توسط مجلس از فهرست پیشنهادی رئیس قوه قضاییه انتخاب می‌شوند. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۳۶۸/۰۶/۲۴",
          affectingLaw: ref("q-asasi-baznegari-1368", "قانون اساسی بازنگری‌شده", 1368, "اصل نود و هشت"),
          text: "ترکیب شورای نگهبان و نحوه انتخاب اعضای آن در بازنگری ۱۳۶۸ بازنویسی شد.",
        },
      ],
    },
    {
      id: "qa-a177",
      number: "اصل صد و هفتاد و هفت",
      text:
        "اصلاح قانون اساسی در شرایط عادی به موجب قانونی انجام می‌گیرد که با اکثریت دو سوم کل نمایندگان مجلس شورای اسلامی تصویب شود و سپس به تأیید شورای بازنگری برسد.",
    },
  ],
  amendments: [
    {
      date: "۱۳۶۸/۰۶/۲۴",
      dateLabel: "شهریور ۱۳۶۸",
      effectType: "اصلاح",
      affectedProvision: "اصول متعدد",
      affectingLaw: ref("q-asasi-baznegari-1368", "قانون اساسی بازنگری‌شده", 1368),
      description: "بازنگری کامل قانون اساسی با اصلاح اصول متعدد و افزودن فصل جدید (شورای بازنگری).",
      appliedToText: true,
      note: "این بازنگری به منظور رفع ابهامات و تطبیق قانون اساسی با تجربه یک دهه اجرا انجام شد.",
    },
  ],
  outstandingChanges: [],
  references: [
    {
      direction: "cites",
      target: ref("q-majazat-islami-1392", "قانون مجازات اسلامی", 1392, "ماده ۲"),
      sourceProvision: "اصل ۴",
      context: "اصل ۴ لزوم تطبیق قوانین با موازین اسلامی را الزامی کرده است.",
    },
    {
      direction: "cited-by",
      target: ref("q-majazat-islami-1392", "قانون مجازات اسلامی", 1392, "ماده ۲"),
      targetProvision: "اصل ۱۶۹",
      context: "قانون مجازات اسلامی در باب ضرورت تعیین مجازات به موجب قانون به اصل ۱۶۹ ارجاع می‌دهد.",
    },
    {
      direction: "cited-by",
      target: ref("q-madani-1307", "قانون مدنی", 1307, "ماده ۱"),
      targetProvision: "اصل ۴",
      context: "قانون مدنی در مقدمه خود به اصل تطبیق با موازین اسلامی ارجاع می‌دهد.",
    },
    {
      direction: "related",
      target: ref("q-shorayeh-negahban-1361", "قانون شورای نگهبان", 1361),
      context: "قانون شورای نگهبان در تفصیل وظایف این شورا بر اساس اصل ۹۸ قانون اساسی وضع شده است.",
    },
  ],
};

// ============================================================
//   6.  قانون حمایت خانواده  (۱۳۹۱)
// ============================================================
const qanoonHemayatKhanevadeh: Law = {
  id: "q-hoghoogh-khanevadeh-1391",
  title: "قانون حمایت خانواده",
  shortTitle: "قانون حمایت خانواده (۱۳۹۱)",
  type: "قانون عادی",
  year: 1391,
  number: "۴۰",
  status: "in-force",
  extent: "کشوری",
  subject: "خانواده",
  promulgatingAuthority: "مجلس شورای اسلامی",
  approvedDate: "۱۳۹۱/۰۶/۱۴",
  effectiveDate: "۱۳۹۱/۰۶/۱۴",
  lastRevisionDate: "۱۴۰۱/۰۳/۲۰",
  description:
    "این قانون جایگزین قانون حمایت خانواده مصوب ۱۳۵۳ شد و در ۵۶ ماده، موضوعات مربوط به ازدواج، طلاق، مهریه، حضانت و سایر امور خانواده را تنظیم می‌کند.",
  longDescription:
    "قانون حمایت خانواده مصوب ۱۳۹۱ در راستای تحکیم بنیان خانواده و رفع ایرادات قانون پیشین تدوین شد. این قانون در ۵۶ ماده موضوعاتی نظیر ثبت رسمی ازدواج و طلاق، شروط ضمن عقد نکاح، الزام حضور در دادگاه خانواده، حضانت فرزندان، مهریه و نفقه را پوشش می‌دهد. این قانون یکی از منابع اصلی حقوق خانواده ایران به شمار می‌رود و در تفسیر و اجرای مواد قانون مدنی در باب خانواده نقش اساسی ایفا می‌کند.",
  originalVersion: {
    approvedDate: "۱۳۹۱/۰۶/۱۴",
    description: "نسخه مصوب ۱۳۹۱ — ۵۶ ماده.",
  },
  toc: [
    {
      id: "qhk-c1",
      label: "فصل اول",
      title: "کلیات",
      type: "chapter",
      children: [
        {
          id: "qhk-s1",
          label: "باب اول",
          title: "تأسیس و صلاحیت دادگاه‌های خانواده",
          type: "section",
          children: [
            {
              id: "qhk-t1",
              label: "مبحث نخست",
              title: "تأسیس دادگاه خانواده",
              type: "topic",
              articleIds: ["qhk-a1"],
            },
            {
              id: "qhk-t2",
              label: "مبحث دوم",
              title: "صلاحیت رسیدگی",
              type: "topic",
              articleIds: ["qhk-a2"],
            },
          ],
        },
      ],
    },
    {
      id: "qhk-c2",
      label: "فصل دوم",
      title: "در شروط ضمن عقد",
      type: "chapter",
      children: [
        {
          id: "qhk-s2",
          label: "باب اول",
          title: "شروط ضمن عقد نکاح",
          type: "section",
          children: [
            {
              id: "qhk-t3",
              label: "مبحث نخست",
              title: "اقسام شروط",
              type: "topic",
              articleIds: ["qhk-a22"],
            },
            {
              id: "qhk-t4",
              label: "مبحث دوم",
              title: "ثبت شروط",
              type: "topic",
              articleIds: ["qhk-a25"],
            },
          ],
        },
      ],
    },
    {
      id: "qhk-c3",
      label: "فصل سوم",
      title: "در مهریه و نفقه",
      type: "chapter",
      children: [
        {
          id: "qhk-s3",
          label: "باب اول",
          title: "احکام مهریه",
          type: "section",
          children: [
            {
              id: "qhk-t5",
              label: "مبحث نخست",
              title: "اجرای مهریه",
              type: "topic",
              articleIds: ["qhk-a32"],
            },
          ],
        },
      ],
    },    ],
  articles: [
    {
      id: "qhk-a1",
      number: "ماده ۱",
      text:
        "دادگاه‌های خانواده برای رسیدگی به دعاوی خانوادگی از جمله دعاوی راجع به مهریه، نفقه، طلاق، حضانت و سایر موضوعات مندرج در این قانون تأسیس می‌شوند.",
    },
    {
      id: "qhk-a2",
      number: "ماده ۲",
      text:
        "صلاحیت رسیدگی به دعاوی خانواده با دادگاه‌های خانواده است. در محلولی که دادگاه خانواده تأسیس نشده باشد، دادگاه عمومی صلاحیت دارد.",
    },
    {
      id: "qhk-a22",
      number: "ماده ۲۲",
      text:
        "زوجه می‌تواند شروط ذیل را ضمن عقد نکاح قرار دهد: ۱ - وکالت در طلاق. ۲ - حق تحصیل تا هر سطح که بخواهد. ۳ - حق اشتغال در شغل مورد نظر. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "افزوده",
          date: "۱۴۰۱/۰۳/۲۰",
          affectingLaw: ref("q-tashil-mahriyeh-1401", "قانون تسهیل ازدواج و حمایت از خانواده", 1401, "ماده ۱۲", "۲۳۴"),
          text: "افزوده شدن شرط حق مسکن مستقل به زوجه در شروط ضمن عقد پیشنهادی.",
        },
      ],
    },
    {
      id: "qhk-a25",
      number: "ماده ۲۵",
      text:
        "شروط ضمن عقد نکاغ باید در سند ازدواج ثبت شود و در صورت عدم ثبت، اداره ثبت احوال از پذیرش آن امتناع خواهد کرد.",
    },
    {
      id: "qhk-a32",
      number: "ماده ۳۲",
      text:
        "مهریه در صورت مطالبه زوجه باید فوراً پرداخت شود. دادگاه می‌تواند به زوجه اجازه فروش مال همسر را در صورت امتناع از پرداخت بدهد. [ت۱]",
      commentary: [
        {
          marker: "ت۱",
          effectType: "اصلاح",
          date: "۱۴۰۱/۰۳/۲۰",
          affectingLaw: ref("q-tashil-mahriyeh-1401", "قانون تسهیل ازدواج و حمایت از خانواده", 1401, "ماده ۷", "۲۳۴"),
          text: "تبصره‌ای الحاق شد که بر اساس آن تا ۱۱۰ سکه تمام بهار آزادی فوراً قابل اجراست و مابقی با توجه به شاخص تورم پرداخت می‌شود.",
        },
      ],
    },
  ],
  amendments: [
    {
      date: "۱۴۰۱/۰۳/۲۰",
      dateLabel: "خرداد ۱۴۰۱",
      effectType: "اصلاح",
      affectedProvision: "ماده ۳۲",
      affectedProvisionId: "qhk-a32",
      affectingLaw: ref("q-tashil-mahriyeh-1401", "قانون تسهیل ازدواج و حمایت از خانواده", 1401, "ماده ۷", "۲۳۴"),
      description: "الحاق تبصره به ماده ۳۲ در خصوص سقف فوری اجرای مهریه.",
      appliedToText: true,
      note: "این اصلاح با هدف کاهش پرونده‌های مهریه در محاکم انجام شد.",
    },
    {
      date: "۱۴۰۱/۰۳/۲۰",
      dateLabel: "خرداد ۱۴۰۱",
      effectType: "افزوده",
      affectedProvision: "ماده ۲۲",
      affectedProvisionId: "qhk-a22",
      affectingLaw: ref("q-tashil-mahriyeh-1401", "قانون تسهیل ازدواج و حمایت از خانواده", 1401, "ماده ۱۲", "۲۳۴"),
      description: "افزوده شدن شرط حق مسکن مستقل به شروط ضمن عقد پیشنهادی.",
      appliedToText: true,
    },
  ],
  outstandingChanges: [],
  references: [
    {
      direction: "cites",
      target: ref("q-madani-1307", "قانون مدنی", 1307, "ماده ۱۰۸۲"),
      sourceProvision: "ماده ۲۲",
      context: "قانون حمایت خانواده در باب مهریه به مقررات قانون مدنی ارجاع می‌دهد.",
    },
    {
      direction: "cites",
      target: ref("q-madani-1307", "قانون مدنی", 1307, "ماده ۱۱۳۳"),
      sourceProvision: "ماده ۲۲",
      context: "ارجاع به شروط ضمن عقد در ماده ۱۱۳۳ قانون مدنی.",
    },
    {
      direction: "amended-by",
      target: ref("q-tashil-mahriyeh-1401", "قانون تسهیل ازدواج و حمایت از خانواده", 1401),
      context: "اصلاح ماده ۳۲ و الحاق به ماده ۲۲.",
    },
    {
      direction: "related",
      target: ref("q-asasi-1358", "قانون اساسی جمهوری اسلامی ایران", 1358, "اصل ۱۰"),
      context: "اصل ۱۰ قانون اساسی خانواده را به عنوان واحد بنیادین جامعه رسمیت می‌دهد.",
    },
  ],
};

// ============================================================
//   Auxiliary laws referenced in amendments but not main entries
//   (light entries — just enough metadata for citation display)
// ============================================================
// These are not included in the main `laws` array but appear in cross-refs.

// ============================================================
//   All laws (main dataset)
// ============================================================
export const laws: Law[] = [
  qanoonMadani,
  qanoonMajazat,
  qanoonTejarat,
  qanoonKar,
  qanoonAsasi,
  qanoonHemayatKhanevadeh,
];

// ============================================================
//   Decade statistics (for browse-by-decade histogram)
// ============================================================
export const decadeStats: DecadeStat[] = [
  {
    decade: "۱۳۰۰-۱۳۰۹",
    counts: [
      { year: 1300, count: 8 },
      { year: 1301, count: 12 },
      { year: 1302, count: 24 },
      { year: 1303, count: 18 },
      { year: 1304, count: 15 },
      { year: 1305, count: 11 },
      { year: 1306, count: 9 },
      { year: 1307, count: 31 },
      { year: 1308, count: 17 },
      { year: 1309, count: 14 },
    ],
  },
  {
    decade: "۱۳۱۰-۱۳۱۹",
    counts: [
      { year: 1310, count: 19 },
      { year: 1311, count: 22 },
      { year: 1312, count: 18 },
      { year: 1313, count: 15 },
      { year: 1314, count: 21 },
      { year: 1315, count: 26 },
      { year: 1316, count: 24 },
      { year: 1317, count: 19 },
      { year: 1318, count: 17 },
      { year: 1319, count: 14 },
    ],
  },
  {
    decade: "۱۳۲۰-۱۳۲۹",
    counts: [
      { year: 1320, count: 11 },
      { year: 1321, count: 9 },
      { year: 1322, count: 8 },
      { year: 1323, count: 12 },
      { year: 1324, count: 16 },
      { year: 1325, count: 22 },
      { year: 1326, count: 28 },
      { year: 1327, count: 25 },
      { year: 1328, count: 31 },
      { year: 1329, count: 27 },
    ],
  },
  {
    decade: "۱۳۳۰-۱۳۳۹",
    counts: [
      { year: 1330, count: 24 },
      { year: 1331, count: 19 },
      { year: 1332, count: 17 },
      { year: 1333, count: 21 },
      { year: 1334, count: 28 },
      { year: 1335, count: 25 },
      { year: 1336, count: 22 },
      { year: 1337, count: 19 },
      { year: 1338, count: 24 },
      { year: 1339, count: 31 },
    ],
  },
  {
    decade: "۱۳۴۰-۱۳۴۹",
    counts: [
      { year: 1340, count: 35 },
      { year: 1341, count: 28 },
      { year: 1342, count: 31 },
      { year: 1343, count: 42 },
      { year: 1344, count: 38 },
      { year: 1345, count: 44 },
      { year: 1346, count: 39 },
      { year: 1347, count: 47 },
      { year: 1348, count: 52 },
      { year: 1349, count: 41 },
    ],
  },
  {
    decade: "۱۳۵۰-۱۳۵۹",
    counts: [
      { year: 1350, count: 38 },
      { year: 1351, count: 42 },
      { year: 1352, count: 35 },
      { year: 1353, count: 31 },
      { year: 1354, count: 28 },
      { year: 1355, count: 25 },
      { year: 1356, count: 22 },
      { year: 1357, count: 18 },
      { year: 1358, count: 41 },
      { year: 1359, count: 33 },
    ],
  },
  {
    decade: "۱۳۶۰-۱۳۶۹",
    counts: [
      { year: 1360, count: 28 },
      { year: 1361, count: 31 },
      { year: 1362, count: 35 },
      { year: 1363, count: 38 },
      { year: 1364, count: 41 },
      { year: 1365, count: 44 },
      { year: 1366, count: 39 },
      { year: 1367, count: 35 },
      { year: 1368, count: 38 },
      { year: 1369, count: 42 },
    ],
  },
  {
    decade: "۱۳۷۰-۱۳۷۹",
    counts: [
      { year: 1370, count: 45 },
      { year: 1371, count: 41 },
      { year: 1372, count: 38 },
      { year: 1373, count: 35 },
      { year: 1374, count: 39 },
      { year: 1375, count: 42 },
      { year: 1376, count: 44 },
      { year: 1377, count: 41 },
      { year: 1378, count: 38 },
      { year: 1379, count: 35 },
    ],
  },
  {
    decade: "۱۳۸۰-۱۳۸۹",
    counts: [
      { year: 1380, count: 38 },
      { year: 1381, count: 41 },
      { year: 1382, count: 44 },
      { year: 1383, count: 39 },
      { year: 1384, count: 42 },
      { year: 1385, count: 38 },
      { year: 1386, count: 35 },
      { year: 1387, count: 32 },
      { year: 1388, count: 34 },
      { year: 1389, count: 31 },
    ],
  },
  {
    decade: "۱۳۹۰-۱۳۹۹",
    counts: [
      { year: 1390, count: 28 },
      { year: 1391, count: 31 },
      { year: 1392, count: 35 },
      { year: 1393, count: 32 },
      { year: 1394, count: 29 },
      { year: 1395, count: 26 },
      { year: 1396, count: 24 },
      { year: 1397, count: 22 },
      { year: 1398, count: 19 },
      { year: 1399, count: 17 },
    ],
  },
  {
    decade: "۱۴۰۰-۱۴۰۹",
    counts: [
      { year: 1400, count: 21 },
      { year: 1401, count: 24 },
      { year: 1402, count: 22 },
      { year: 1403, count: 18 },
      { year: 1404, count: 15 },
    ],
  },
];

export function getLawById(id: string): Law | undefined {
  return laws.find((l) => l.id === id);
}

/** Lookup of all referenced laws (including auxiliary ones) by id */
export const referencedLawTitles: Record<string, { title: string; year: number }> = {
  "q-madani-1307": { title: "قانون مدنی", year: 1307 },
  "q-majazat-islami-1392": { title: "قانون مجازات اسلامی", year: 1392 },
  "q-tejarat-1302": { title: "قانون تجارت", year: 1302 },
  "q-kar-1369": { title: "قانون کار", year: 1369 },
  "q-asasi-1358": { title: "قانون اساسی جمهوری اسلامی ایران", year: 1358 },
  "q-hoghoogh-khanevadeh-1391": { title: "قانون حمایت خانواده", year: 1391 },
  "q-hoghoogh-khanevadeh-1353": { title: "قانون حمایت خانواده (۱۳۵۳)", year: 1353 },
  "q-hoghoogh-khanevadeh-1370-1": { title: "قانون حمایت خانواده (اصلاحی ۱۳۷۰)", year: 1370 },
  "q-hoghoogh-khanevadeh-1346": { title: "قانون حمایت خانواده (اصلاحی ۱۳۴۶)", year: 1346 },
  "q-madani-amend-1343": { title: "قانون اصلاح برخی مواد قانون مدنی", year: 1343 },
  "q-madani-tavzih-1382": { title: "بخشنامه تفسیری ماده ۱۰۸۲", year: 1382 },
  "q-sabt-ahval-1387": { title: "قانون ثبت وقایع خانوادگی", year: 1387 },
  "q-tashil-mahriyeh-1401": { title: "قانون تسهیل ازدواج و حمایت از خانواده", year: 1401 },
  "q-tashil-zowaj-1403": { title: "قانون حمایت تکمیلی از خانواده", year: 1403 },
  "q-majazat-amend-1396": { title: "قانون اصلاح قانون مجازات اسلامی", year: 1396 },
  "q-majazat-amend-1399": { title: "قانون کاهش مجازات تعزیری", year: 1399 },
  "q-majazat-amend-1402": { title: "قانون اصلاح برخی مواد قانون مجازات اسلامی", year: 1402 },
  "q-majazat-amend-1404": { title: "قانون اصلاح مواد حدی", year: 1404 },
  "q-aghkam-1378": { title: "قانون آیین دادرسی کیفری", year: 1378 },
  "q-tejarat-amend-1347": { title: "قانون اصلاح قانون تجارت", year: 1347 },
  "q-sahami-1348": { title: "لایحه اصلاح قانون تجارت (بخش شرکت‌های سهامی)", year: 1348 },
  "q-tejarat-elec-1382": { title: "قانون تجارت الکترونیک", year: 1382 },
  "q-tejarat-amend-1388": { title: "قانون اصلاح قانون تجارت", year: 1388 },
  "q-kar-amend-1380": { title: "قانون اصلاح قانون کار", year: 1380 },
  "q-kar-amend-1388": { title: "قانون اصلاح قانون کار", year: 1388 },
  "q-kar-amend-1400": { title: "قانون حمایت از حقوق کارگران", year: 1400 },
  "q-kar-amend-1404": { title: "قانون حمایت تکمیلی کارگران", year: 1404 },
  "q-tamin-ejtemaei-1354": { title: "قانون تأمین اجتماعی", year: 1354 },
  "q-asasi-baznegari-1368": { title: "قانون اساسی بازنگری‌شده", year: 1368 },
  "q-shorayeh-negahban-1361": { title: "قانون شورای نگهبان", year: 1361 },
};
