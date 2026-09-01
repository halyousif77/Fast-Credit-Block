"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { storage } from "@/utils/storage";

export type Lang = "ar" | "en" | "hi";

export const LANGUAGES: {
  code: Lang;
  label: string;
  nativeLabel: string;
  dir: "rtl" | "ltr";
}[] = [
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
];

const dict = {
  home: { ar: "الرئيسية", en: "Home", hi: "होम" },
  van: { ar: "الفانات", en: "Vans", hi: "वैन" },
  exceptions: { ar: "الاستثناءات", en: "Exceptions", hi: "अपवाद" },
  reports: { ar: "التقارير", en: "Reports", hi: "रिपोर्ट" },
  settings: { ar: "الإعدادات", en: "Settings", hi: "सेटिंग्स" },
  more: { ar: "المزيد", en: "More", hi: "और" },
  login: { ar: "تسجيل الدخول", en: "Login", hi: "लॉग इन करें" },
  logout: { ar: "تسجيل الخروج", en: "Logout", hi: "लॉग आउट" },
  username: { ar: "اسم المستخدم", en: "Username", hi: "उपयोगकर्ता नाम" },
  password: { ar: "كلمة المرور", en: "Password", hi: "पासवर्ड" },
  cancel: { ar: "إلغاء", en: "Cancel", hi: "रद्द करें" },
  language: { ar: "اللغة", en: "Language", hi: "भाषा" },
  account: { ar: "الحساب", en: "Account", hi: "खाता" },
  loggedInAs: { ar: "مسجل الدخول باسم", en: "Logged in as", hi: "इस रूप में लॉग इन" },
  notLoggedIn: { ar: "لم يتم تسجيل الدخول", en: "Not logged in", hi: "लॉग इन नहीं है" },
  search: { ar: "بحث...", en: "Search...", hi: "खोजें..." },
  totalInvoices: { ar: "إجمالي الفواتير", en: "Total Invoices", hi: "कुल चालान" },
  totalAmount: { ar: "إجمالي المبلغ", en: "Total Amount", hi: "कुल राशि" },
  blocked: { ar: "محظور", en: "Blocked", hi: "अवरोधित" },
  unblocked: { ar: "غير محظور", en: "Unblocked", hi: "अनब्लॉक्ड" },
  vansCount: { ar: "عدد الفانات", en: "Vans", hi: "वैन" },
  viewAll: { ar: "عرض الكل", en: "View all", hi: "सभी देखें" },
  loading: { ar: "جارِ التحميل...", en: "Loading...", hi: "लोड हो रहा है..." },
  noData: { ar: "لا توجد بيانات", en: "No data", hi: "कोई डेटा नहीं" },
  invalidUsername: { ar: "اسم مستخدم غير صحيح", en: "Invalid username", hi: "अमान्य उपयोगकर्ता नाम" },
  invalidPassword: { ar: "كلمة مرور غير صحيحة", en: "Invalid password", hi: "अमान्य पासवर्ड" },
  desktopSite: { ar: "النسخة الكاملة (كمبيوتر)", en: "Full desktop site", hi: "पूर्ण डेस्कटॉप साइट" },
  customer: { ar: "العميل", en: "Customer", hi: "ग्राहक" },
  invoice: { ar: "الفاتورة", en: "Invoice", hi: "चालान" },
  status: { ar: "الحالة", en: "Status", hi: "स्थिति" },
  addException: { ar: "إضافة استثناء", en: "Add exception", hi: "अपवाद जोड़ें" },
  permanent: { ar: "دائم", en: "Permanent", hi: "स्थायी" },
  tillDate: { ar: "حتى تاريخ", en: "Till date", hi: "तिथि तक" },
  save: { ar: "حفظ", en: "Save", hi: "सहेजें" },
  delete: { ar: "حذف", en: "Delete", hi: "हटाएं" },
  back: { ar: "رجوع", en: "Back", hi: "वापस" },
  adminTools: { ar: "أدوات الإدارة (كمبيوتر فقط)", en: "Admin tools (desktop only)", hi: "एडमिन टूल्स (केवल डेस्कटॉप)" },
  summary: { ar: "الملخص", en: "Summary", hi: "सारांश" },
  users: { ar: "المستخدمون", en: "Users", hi: "उपयोगकर्ता" },
  logs: { ar: "السجلات", en: "Logs", hi: "लॉग्स" },
  notifications: { ar: "الإشعارات", en: "Notifications", hi: "सूचनाएं" },

  // Region filter
  regionFilter: { ar: "فلترة الريجون", en: "Region filter", hi: "क्षेत्र फ़िल्टर" },
  regionFilterHint: {
    ar: "اختر ريجون واحد أو أكثر، وسيتم تطبيقه تلقائيًا على كل الصفحات",
    en: "Pick one or more regions - it applies automatically across every page",
    hi: "एक या अधिक क्षेत्र चुनें - यह हर पेज पर अपने आप लागू होगा",
  },
  allRegions: { ar: "كل المناطق", en: "All regions", hi: "सभी क्षेत्र" },
  clear: { ar: "مسح", en: "Clear", hi: "साफ़ करें" },

  // Van / summary table
  employeeId: { ar: "رقم الموظف", en: "Employee ID", hi: "कर्मचारी आईडी" },
  permission: { ar: "الصلاحية", en: "Permission", hi: "अनुमति" },
  remaining: { ar: "متبقي", en: "Remaining", hi: "शेष" },
  allCollected: { ar: "تم التحصيل بالكامل", en: "All collected", hi: "सभी एकत्रित" },
  vanSummary: { ar: "ملخص الفانات", en: "Vans Summary", hi: "वैन सारांश" },

  // Exceptions
  autoDetected: { ar: "تم اكتشافه تلقائيًا", en: "Auto-detected", hi: "स्वतः पहचाना गया" },
  invoiceNotFound: {
    ar: "لم يتم العثور على الفاتورة في البيانات الحالية",
    en: "Invoice not found in current data",
    hi: "मौजूदा डेटा में चालान नहीं मिला",
  },
  onlyDeleteOwn: {
    ar: "يمكنك حذف الاستثناءات التي أضفتها أنت فقط",
    en: "You can only delete exceptions you added",
    hi: "आप केवल वही अपवाद हटा सकते हैं जो आपने जोड़े हैं",
  },
  addedBy: { ar: "أضيف بواسطة", en: "Added by", hi: "द्वारा जोड़ा गया" },
} as const;

export type DictKey = keyof typeof dict;

type I18nContextType = {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "ar",
  dir: "rtl",
  setLang: () => {},
  t: (key) => dict[key]?.ar ?? String(key),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem("appLang");
      if (saved === "ar" || saved === "en" || saved === "hi") {
        setLangState(saved);
      }
      setReady(true);
    })();
  }, []);

  const dir: "rtl" | "ltr" =
    LANGUAGES.find((l) => l.code === lang)?.dir ?? "rtl";

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    storage.setItem("appLang", l);
    window.dispatchEvent(new Event("lang-changed"));
  };

  const t = (key: DictKey) => dict[key]?.[lang] ?? String(key);

  if (!ready) return null;

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
