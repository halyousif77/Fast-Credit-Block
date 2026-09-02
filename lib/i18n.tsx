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
  importFiles: { ar: "استيراد الملفات", en: "Import Files", hi: "फ़ाइलें आयात करें" },
  theme: { ar: "مظهر الموقع", en: "Site appearance", hi: "साइट का रूप" },
  lightTheme: { ar: "أبيض / فاتح", en: "Light", hi: "लाइट" },
  darkTheme: { ar: "داكن", en: "Dark", hi: "डार्क" },
  blockedInvoices: { ar: "الفواتير المحظورة", en: "Blocked Invoices", hi: "अवरोधित चालान" },
  active: { ar: "نشط", en: "Active", hi: "सक्रिय" },
  employees: { ar: "الموظفون", en: "Employees", hi: "कर्मचारी" },
  legal: { ar: "قانوني", en: "Legal", hi: "कानूनी" },
  uploadSystemFiles: { ar: "رفع ومعالجة ملفات النظام", en: "Upload and process system files", hi: "सिस्टम फ़ाइलें अपलोड और प्रोसेस करें" },
  uploadingCollection: { ar: "جارٍ رفع التحصيل...", en: "Uploading Collection...", hi: "कलेक्शन अपलोड हो रहा है..." },
  importCollection: { ar: "استيراد التحصيل", en: "Import Collection", hi: "कलेक्शन आयात करें" },
  collectedInvoicesFile: { ar: "ملف الفواتير المحصلة", en: "Collected Invoices File", hi: "एकत्रित चालान फ़ाइल" },
  importingUsers: { ar: "جارٍ استيراد المستخدمين...", en: "Importing Users...", hi: "उपयोगकर्ता आयात हो रहे हैं..." },
  importUsers: { ar: "استيراد المستخدمين", en: "Import Users", hi: "उपयोगकर्ता आयात करें" },
  usersVanMappingFile: { ar: "ملف المستخدمين وربط الفانات", en: "Users & Van Mapping File", hi: "उपयोगकर्ता और वैन मैपिंग फ़ाइल" },
  uploadingCredit: { ar: "جارٍ رفع الائتمان...", en: "Uploading Credit...", hi: "क्रेडिट अपलोड हो रहा है..." },
  importCredit: { ar: "استيراد الائتمان", en: "Import Credit", hi: "क्रेडिट आयात करें" },
  creditBlockFile: { ar: "ملف حظر الائتمان", en: "Credit Block File", hi: "क्रेडिट ब्लॉक फ़ाइल" },
  invalidUsersFile: { ar: "ملف المستخدمين غير صالح", en: "Invalid Users File", hi: "अमान्य उपयोगकर्ता फ़ाइल" },
  usersImported: { ar: "تم استيراد المستخدمين بنجاح", en: "Users imported successfully", hi: "उपयोगकर्ता सफलतापूर्वक आयात हुए" },
  failedImportUsers: { ar: "فشل استيراد المستخدمين", en: "Failed to import users", hi: "उपयोगकर्ता आयात विफल" },
  invalidCreditFile: { ar: "ملف الائتمان غير صالح", en: "Invalid Credit File", hi: "अमान्य क्रेडिट फ़ाइल" },
  correctCreditReport: { ar: "يرجى رفع تقرير الائتمان الصحيح.", en: "Please upload the correct Credit report.", hi: "कृपया सही क्रेडिट रिपोर्ट अपलोड करें।" },
  creditImported: { ar: "تم استيراد ملف الائتمان بنجاح", en: "Credit file imported successfully", hi: "क्रेडिट फ़ाइल सफलतापूर्वक आयात हुई" },
  failedImportCredit: { ar: "فشل استيراد ملف الائتمان", en: "Failed to import credit file", hi: "क्रेडिट फ़ाइल आयात विफल" },
  invalidCollectionFile: { ar: "ملف التحصيل غير صالح", en: "Invalid Collection File", hi: "अमान्य कलेक्शन फ़ाइल" },
  correctCollectionReport: { ar: "يرجى رفع تقرير التحصيل الصحيح.", en: "Please upload the correct Collection report.", hi: "कृपया सही कलेक्शन रिपोर्ट अपलोड करें।" },
  collectionImported: { ar: "تم استيراد ملف التحصيل بنجاح", en: "Collection file imported successfully", hi: "कलेक्शन फ़ाइल सफलतापूर्वक आयात हुई" },
  failedImportCollection: { ar: "فشل استيراد ملف التحصيل", en: "Failed to import collection file", hi: "कलेक्शन फ़ाइल आयात विफल" },

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
  dashboard: { ar: "لوحة التحكم", en: "Dashboard", hi: "डैशबोर्ड" },
  importFile: { ar: "استيراد ملف", en: "Import File", hi: "फ़ाइल आयात करें" },

  searchVanCode: { ar: "بحث برقم الفان...", en: "Search Van Code...", hi: "वैन कोड खोजें..." },
  vanCode: { ar: "رقم الفان", en: "Van Code", hi: "वैन कोड" },
  employeeName: { ar: "اسم الموظف", en: "Employee Name", hi: "कर्मचारी नाम" },
  atsCode: { ar: "رمز ATS", en: "ATS Code", hi: "ATS कोड" },
  customerCode: { ar: "رمز العميل", en: "Customer Code", hi: "ग्राहक कोड" },
  customerName: { ar: "اسم العميل", en: "Customer Name", hi: "ग्राहक नाम" },
  centralInvoice: { ar: "الفاتورة المركزية", en: "Central Invoice", hi: "केंद्रीय चालान" },
  paymentTerm: { ar: "شروط الدفع", en: "Payment Term", hi: "भुगतान शर्त" },
  invoiceNo: { ar: "رقم الفاتورة", en: "Invoice #", hi: "चालान #" },
  trxDate: { ar: "تاريخ المعاملة", en: "Trx Date", hi: "लेन-देन तिथि" },
  creditAmount: { ar: "مبلغ الائتمان", en: "Credit Amount", hi: "क्रेडिट राशि" },
  pendingCim: { ar: "CIM المعلق", en: "Pending CIM", hi: "लंबित CIM" },
  creditDays: { ar: "أيام الائتمان", en: "Credit Days", hi: "क्रेडिट दिन" },
  rejectedCount: { ar: "عدد المرفوض", en: "Rejected Count", hi: "अस्वीकृत संख्या" },

  invoiceNoDot: { ar: "رقم الفاتورة", en: "Invoice No.", hi: "चालान संख्या" },

  welcomeBack: { ar: "مرحبًا بعودتك", en: "Welcome Back", hi: "वापसी पर स्वागत है" },
  signInManagement: { ar: "سجل الدخول للوصول إلى أدوات الإدارة", en: "Sign in to access management features", hi: "प्रबंधन सुविधाओं तक पहुंचने के लिए साइन इन करें" },
  selectVan: { ar: "اختر الفان", en: "Select Van", hi: "वैन चुनें" },

  block: { ar: "حظر", en: "Block", hi: "ब्लॉक" },
  cleared: { ar: "تم التحصيل", en: "Cleared", hi: "क्लियर" },
  days: { ar: "الأيام", en: "Days", hi: "दिन" },

  open: { ar: "فتح", en: "Open", hi: "खोलें" },
  collectionData: { ar: "بيانات التحصيل", en: "Collection Data", hi: "कलेक्शन डेटा" },
  collectionReport: { ar: "تقرير التحصيل", en: "Collection Report", hi: "कलेक्शन रिपोर्ट" },
  creditData: { ar: "بيانات الائتمان", en: "Credit Data", hi: "क्रेडिट डेटा" },
  creditBlockReport: { ar: "تقرير حظر الائتمان", en: "Credit Block Report", hi: "क्रेडिट ब्लॉक रिपोर्ट" },
  latestFile: { ar: "أحدث ملف", en: "Latest File", hi: "नवीनतम फ़ाइल" },
  currentExceptions: { ar: "الاستثناءات الحالية", en: "Current Exceptions", hi: "वर्तमान अपवाद" },
  exceptionInvoices: { ar: "فواتير الاستثناءات", en: "Exception Invoices", hi: "अपवाद चालान" },

  employeesClearedToday: { ar: "الموظفون الذين تم تحصيلهم اليوم", en: "Employees Cleared Today", hi: "आज क्लियर किए गए कर्मचारी" },

  collectionProgress: { ar: "تقدم التحصيل", en: "Collection Progress", hi: "कलेक्शन प्रगति" },
  topVansWithBlocks: { ar: "الفانات الأكثر حظرًا", en: "Top Vans With Blocks", hi: "सबसे अधिक ब्लॉक वाले वैन" },
  addMultipleExceptions: { ar: "إضافة استثناءات متعددة", en: "Add Multiple Exceptions", hi: "एकाधिक अपवाद जोड़ें" },
  addedExceptions: { ar: "الاستثناءات المضافة", en: "Added Exceptions", hi: "जोड़े गए अपवाद" },
  actions: { ar: "الإجراءات", en: "Actions", hi: "कार्रवाई" },

  edit: { ar: "تعديل", en: "Edit", hi: "संपيرादित करें" },
  editException: { ar: "تعديل الاستثناء", en: "Edit Exception", hi: "अपवाद संपादित करें" },

  legalExceptions: { ar: "الاستثناءات القانونية", en: "Legal Exceptions", hi: "कानूनी अपवाद" },
  recentActivity: { ar: "النشاط الأخير", en: "Recent Activity", hi: "हाल की गतिविधि" },
  lastActions: { ar: "آخر الإجراءات", en: "Last Actions", hi: "अंतिम कार्रवाइयां" },
  totalRecords: { ar: "إجمالي السجلات", en: "Total Records", hi: "कुल रिकॉर्ड" },
  activityLogs: { ar: "سجلات النشاط", en: "Activity Logs", hi: "गतिविधि लॉग" },
  allActions: { ar: "كل الإجراءات", en: "All Actions", hi: "सभी कार्रवाइयां" },
  allUsers: { ar: "كل المستخدمين", en: "All Users", hi: "सभी उपयोगकर्ता" },
  dateTime: { ar: "التاريخ والوقت", en: "Date & Time", hi: "तारीख और समय" },
  action: { ar: "الإجراء", en: "Action", hi: "कार्रवाई" },
  details: { ar: "التفاصيل", en: "Details", hi: "विवरण" },
  imports: { ar: "الاستيرادات", en: "Imports", hi: "आयात" },
  noLogsFound: { ar: "لا توجد سجلات", en: "No logs found", hi: "कोई लॉग नहीं मिला" },
  reset: { ar: "إعادة تعيين", en: "Reset", hi: "रीसेट" },
  today: { ar: "اليوم", en: "Today", hi: "आज" },
  totalActivities: { ar: "إجمالي الأنشطة", en: "Total Activities", hi: "कुल गतिविधियां" },
  user: { ar: "المستخدم", en: "User", hi: "उपयोगकर्ता" },
  city: { ar: "المدينة", en: "City", hi: "शहर" },
  contact: { ar: "جهة الاتصال", en: "Contact", hi: "संपर्क" },
  organizationCode: { ar: "رمز المؤسسة", en: "Organization Code", hi: "संगठन कोड" },
  organizationName: { ar: "اسم المؤسسة", en: "Organization Name", hi: "संगठन नाम" },
  region: { ar: "المنطقة", en: "Region", hi: "क्षेत्र" },
  userCode: { ar: "رمز المستخدم", en: "User Code", hi: "उपयोगकर्ता कोड" },
  vanSubInventory: { ar: "المخزون الفرعي للفان", en: "Van Sub Inventory", hi: "वैन सब इन्वेंटरी" },
  siteAppearance: { ar: "مظهر الموقع", en: "Site Appearance", hi: "साइट का रूप" },
  light: { ar: "فاتح", en: "Light", hi: "लाइट" },
  dark: { ar: "داكن", en: "Dark", hi: "डार्क" },
  currentWhiteAppearance: { ar: "المظهر الأبيض الحالي", en: "Current white appearance", hi: "वर्तमान सफेद रूप" },
  darkNavySlate: { ar: "كحلي/رمادي داكن بتباين واضح", en: "Dark navy/slate, high contrast", hi: "गहरा नेवी/स्लेट, उच्च कंट्रास्ट" },
  profileInformation: { ar: "معلومات الملف الشخصي", en: "Profile Information", hi: "प्रोफ़ाइल जानकारी" },
  fullName: { ar: "الاسم الكامل", en: "Full Name", hi: "पूरा नाम" },
  currentPassword: { ar: "كلمة المرور الحالية", en: "Current Password", hi: "वर्तमान पासवर्ड" },
  newPassword: { ar: "كلمة المرور الجديدة", en: "New Password", hi: "नया पासवर्ड" },
  confirmNewPassword: { ar: "تأكيد كلمة المرور الجديدة", en: "Confirm New Password", hi: "नए पासवर्ड की पुष्टि करें" },

  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes", hi: "परिवर्तन सहेजें" },
  saveProfile: { ar: "حفظ الملف الشخصي", en: "Save Profile", hi: "प्रोफ़ाइल सहेजें" },

  security: { ar: "الأمان", en: "Security", hi: "सुरक्षा" },
  dashboardFilters: { ar: "فلاتر لوحة التحكم", en: "Dashboard Filters", hi: "डैशबोर्ड फ़िल्टर" },
  hideFullyCollectedInvoices: { ar: "إخفاء الفواتير المحصلة بالكامل", en: "Hide Fully Collected Invoices", hi: "पूरी तरह एकत्रित चालान छिपाएं" },
  hideUserBlock: { ar: "إخفاء حظر المستخدم", en: "Hide User Block", hi: "उपयोगकर्ता ब्लॉक छिपाएं" },
  invoiceVisibility: { ar: "ظهور الفاتورة", en: "Invoice Visibility", hi: "चालान दृश्यता" },
  normalInvoices: { ar: "الفواتير العادية", en: "Normal Invoices", hi: "सामान्य चालान" },
  exceptionAddAlerts: { ar: "تنبيهات إضافة الاستثناء", en: "Exception Add Alerts", hi: "अपवाद إضافة अलर्ट" },
  exceptionDeleteAlerts: { ar: "تنبيهات حذف الاستثناء", en: "Exception Delete Alerts", hi: "अपवाद हटाने के अलर्ट" },
  exceptionExpiredAlerts: { ar: "تنبيهات انتهاء الاستثناء", en: "Exception Expired Alerts", hi: "अपवाद समाप्ति अलर्ट" },
  invoiceDisappearedAlerts: { ar: "تنبيهات اختفاء الفاتورة", en: "Invoice Disappeared Alerts", hi: "चालान गायब होने के अलर्ट" },
  creditImportAlerts: { ar: "تنبيهات استيراد الائتمان", en: "Credit Import Alerts", hi: "क्रेडिट आयात अलर्ट" },
  collectionImportAlerts: { ar: "تنبيهات استيراد التحصيل", en: "Collection Import Alerts", hi: "कलेक्शन आयात अलर्ट" },
  manageNotificationPreferences: { ar: "إدارة تفضيلات الإشعارات", en: "Manage your notification preferences", hi: "अपनी अधिसूचना प्राथमिकताएं प्रबंधित करें" },
  manageSecuritySettings: { ar: "إدارة إعدادات الأمان", en: "Manage your security settings", hi: "अपनी सुरक्षा सेटिंग्स प्रबंधित करें" },
  creditBlockRules: { ar: "قواعد حظر الائتمان", en: "Credit Block Rules", hi: "क्रेडिट ब्लॉक नियम" },
  configureInvoiceThresholds: { ar: "تهيئة حدود حظر الفواتير.", en: "Configure invoice block thresholds.", hi: "चालान ब्लॉक सीमा कॉन्फ़िगर करें।" },
  invoiceStatus: { ar: "حالة الفاتورة", en: "Invoice Status", hi: "चालान स्थिति" },
  invoiceType: { ar: "نوع الفاتورة", en: "Invoice Type", hi: "चालान प्रकार" },
  due: { ar: "مستحق", en: "Due", hi: "देय" },
  overdue: { ar: "متأخر", en: "Overdue", hi: "अतिदेय" },
  sendWhatsappReport: { ar: "إرسال تقرير واتساب", en: "Send WhatsApp Report", hi: "व्हाट्सऐप रिपोर्ट भेजें" },
  allCollectedVans: { ar: "الفانات المحصلة بالكامل", en: "All Collected Vans", hi: "पूरी तरह एकत्रित वैन" },
  creditBlockStatusByVan: { ar: "حالة حظر الائتمان حسب الفان", en: "Credit block status by van", hi: "वैन के अनुसार क्रेडिट ब्लॉक स्थिति" },
  outstandingInvoicesByRegion: { ar: "الفواتير المستحقة حسب المنطقة", en: "Outstanding invoices by region", hi: "क्षेत्र के अनुसार बकाया चालान" },
  regionSummary: { ar: "ملخص المناطق", en: "Region Summary", hi: "क्षेत्र सारांश" },
  remainingInvoices: { ar: "الفواتير المتبقية", en: "Remaining Invoices", hi: "शेष चालान" },
  totalVans: { ar: "إجمالي الفانات", en: "Total Vans", hi: "कुल वैन" },
  vanPerformance: { ar: "أداء الفانات", en: "Van Performance", hi: "वैन प्रदर्शन" },
  firstSeen: { ar: "أول ظهور", en: "First Seen", hi: "पहली बार देखा गया" },
  missingFrom: { ar: "مفقود من", en: "Missing From", hi: "से गायब" },
  noDisappearedInvoices: { ar: "لا توجد فواتير مختفية", en: "No disappeared invoices found", hi: "कोई गायब चालान नहीं मिला" },
  uploadedBy: { ar: "تم الرفع بواسطة", en: "Uploaded By", hi: "द्वारा अपलोड किया गया" },
  creditFile: { ar: "ملف الائتمان", en: "Credit File", hi: "क्रेडिट फ़ाइल" },
  creditWithRouteBlock: { ar: "الائتمان مع حظر المسار", en: "Credit With Route Block", hi: "रूट ब्लॉक के साथ क्रेडिट" }
,
  activeCreditBlocks: { ar: "حظر الائتمان النشط", en: "Active Credit Blocks", hi: "सक्रिय क्रेडिट ब्लॉक" },
  exceptionsManagement: { ar: "إدارة الاستثناءات", en: "Exceptions Management", hi: "अपवाद प्रबंधन" },
  noPermissionPage: { ar: "ليس لديك صلاحية لدخول هذه الصفحة", en: "You Dont Have Permission To Enter This Page", hi: "आपको इस पृष्ठ में प्रवेश करने की अनुमति नहीं है" },
  addExceptionLog: { ar: "إضافة استثناء", en: "ADD EXCEPTION", hi: "अपवाद जोड़ें" },
  deleteExceptionLog: { ar: "حذف استثناء", en: "DELETE EXCEPTION", hi: "अपवाद हटाएं" },
  importCollectionLog: { ar: "استيراد التحصيل", en: "IMPORT COLLECTION", hi: "कलेक्शन आयात" },
  importCreditLog: { ar: "استيراد الائتمان", en: "IMPORT CREDIT", hi: "क्रेडिट आयात" },
  loginLog: { ar: "تسجيل الدخول", en: "LOGIN", hi: "लॉग इन" },
  logoutLog: { ar: "تسجيل الخروج", en: "LOGOUT", hi: "लॉग आउट" },
  configureInvoiceVisibility: { ar: "حدد الفواتير التي تظهر في لوحة التحكم.", en: "Configure which invoices appear on the dashboard.", hi: "डैशबोर्ड पर दिखने वाले चालान कॉन्फ़िगर करें।" },
  invoiceNoPlain: { ar: "رقم الفاتورة", en: "Invoice No", hi: "चालान संख्या" },
  adminNotifications: { ar: "إشعارات الإدارة", en: "Admin Notifications", hi: "एडमिन सूचनाएं" },
  noBlockInvoices: { ar: "لا توجد فواتير محظورة", en: "No block invoices found", hi: "कोई ब्लॉक चालान नहीं मिला" }
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
