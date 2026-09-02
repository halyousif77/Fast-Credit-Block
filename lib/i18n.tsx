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
  vanCode: { ar: "رمز الفان", en: "Van Code", hi: "वैन कोड" },
  employeeName: { ar: "اسم الموظف", en: "Employee Name", hi: "कर्मचारी नाम" },
  atsCode: { ar: "رمز ATS", en: "ATS Code", hi: "ATS कोड" },
  customerCode: { ar: "رمز العميل", en: "Customer Code", hi: "ग्राहक कोड" },
  customerName: { ar: "اسم العميل", en: "Customer Name", hi: "ग्राहक नाम" },
  centralInvoice: { ar: "الفاتورة المركزية", en: "Central Invoice", hi: "केंद्रीय चालान" },
  paymentTerm: { ar: "شروط الدفع", en: "Payment Term", hi: "भुगतान शर्त" },
  invoiceNumber: { ar: "رقم الفاتورة", en: "Invoice #", hi: "चालान #" },
  trxDate: { ar: "تاريخ المعاملة", en: "Trx Date", hi: "लेनदेन तिथि" },
  creditAmount: { ar: "مبلغ الائتمان", en: "Credit Amount", hi: "क्रेडिट राशि" },
  pendingCim: { ar: "CIM المعلق", en: "Pending CIM", hi: "लंबित CIM" },
  creditDays: { ar: "أيام الائتمان", en: "Credit Days", hi: "क्रेडिट दिन" },
  rejectedCount: { ar: "عدد المرفوض", en: "Rejected Count", hi: "अस्वीकृत संख्या" },
  actions: { ar: "الإجراءات", en: "Actions", hi: "कार्रवाई" },
  days: { ar: "الأيام", en: "Days", hi: "दिन" },
  siteAppearance: { ar: "مظهر الموقع", en: "Site Appearance", hi: "साइट का रूप" },
  themeDescription: { ar: "اختر مظهرًا فاتحًا أو داكنًا مريحًا للموقع بالكامل.", en: "Choose a clean light or dark color scheme for the entire site.", hi: "पूरी साइट के लिए हल्की या गहरी रंग योजना चुनें।" },
  light: { ar: "فاتح", en: "Light", hi: "लाइट" },
  currentWhiteAppearance: { ar: "المظهر الفاتح الحالي", en: "Current white appearance", hi: "वर्तमान हल्का रूप" },
  dark: { ar: "داكن", en: "Dark", hi: "डार्क" },
  darkNavySlate: { ar: "كحلي/رمادي داكن بتباين واضح", en: "Dark navy/slate, high contrast", hi: "गहरा नेवी/स्लेट, उच्च कंट्रास्ट" },
  saving: { ar: "جارٍ الحفظ...", en: "Saving...", hi: "सहेजा जा रहा है..." },
  invoiceNo: { ar: "رقم الفاتورة", en: "Invoice No.", hi: "चालान संख्या" },
  fullName: { ar: "الاسم الكامل", en: "Full Name", hi: "पूरा नाम" },
  currentPassword: { ar: "كلمة المرور الحالية", en: "Current Password", hi: "वर्तमान पासवर्ड" },
  newPassword: { ar: "كلمة المرور الجديدة", en: "New Password", hi: "नया पासवर्ड" },
  confirmNewPassword: { ar: "تأكيد كلمة المرور الجديدة", en: "Confirm New Password", hi: "नया पासवर्ड पुष्टि करें" },
  searchVanCode: { ar: "البحث برمز الفان...", en: "Search Van Code...", hi: "वैन कोड खोजें..." },
  whatsapp: { ar: "واتساب", en: "WhatsApp", hi: "व्हाट्सऐप" },
  notificationsEnabled: { ar: "تم تفعيل الإشعارات", en: "Notifications Enabled", hi: "सूचनाएं सक्षम" },
  enableNotifications: { ar: "تفعيل الإشعارات", en: "Enable Notifications", hi: "सूचनाएं सक्षम करें" },
  notificationsPermissionDenied: { ar: "تم رفض صلاحية الإشعارات", en: "Notifications permission denied", hi: "सूचनाओं की अनुमति अस्वीकृत" },
  adminNotificationsEnabled: { ar: "تم تفعيل إشعارات المسؤول", en: "Admin notifications enabled", hi: "एडमिन सूचनाएं सक्षम" },
  failedEnableNotifications: { ar: "فشل تفعيل الإشعارات", en: "Failed to enable notifications", hi: "सूचनाएं सक्षम करने में विफल" },
  adminNotifications: { ar: "إشعارات المسؤول", en: "Admin Notifications", hi: "एडमिन सूचनाएं" },
  chooseNotificationSettings: { ar: "إدارة إعدادات الإشعارات", en: "Manage your notification preferences", hi: "अपनी सूचना प्राथमिकताएं प्रबंधित करें" },
  sendWhatsAppReport: { ar: "إرسال تقرير واتساب", en: "Send WhatsApp Report", hi: "व्हाट्सऐप रिपोर्ट भेजें" },
  collections: { ar: "التحصيلات", en: "Collections", hi: "कलेक्शन" },
  editException: { ar: "تعديل الاستثناء", en: "Edit Exception", hi: "अपवाद संपादित करें" },
  totalInvoicesLabel: { ar: "إجمالي الفواتير", en: "Total Invoices", hi: "कुल चालान" },
  totalCreditAmount: { ar: "إجمالي مبلغ الائتمان", en: "Total Credit Amount", hi: "कुल क्रेडिट राशि" },
  oldestCreditDays: { ar: "أقدم أيام ائتمان", en: "Oldest Credit Days", hi: "सबसे पुराने क्रेडिट दिन" },
  totalRejected: { ar: "إجمالي المرفوض", en: "Total Rejected", hi: "कुल अस्वीकृत" },
  creditDaysUnderscore: { ar: "أيام الائتمان", en: "Credit Days", hi: "क्रेडिट दिन" },
  totalRejectedCount: { ar: "إجمالي عدد المرفوض", en: "Total Rejected Count", hi: "कुल अस्वीकृत संख्या" },
  reportNotFound: { ar: "لم يتم العثور على التقرير", en: "Report Not Found", hi: "रिपोर्ट नहीं मिली" },
  processing: { ar: "جارٍ المعالجة...", en: "Processing...", hi: "प्रोसेसिंग..." },
  uploadingCollectionShort: { ar: "جارٍ رفع التحصيل...", en: "Uploading Collection...", hi: "कलेक्शन अपलोड हो रहा है..." },
  importingUsersShort: { ar: "جارٍ استيراد المستخدمين...", en: "Importing Users...", hi: "उपयोगकर्ता आयात हो रहे हैं..." },
  uploadingCreditShort: { ar: "جارٍ رفع الائتمان...", en: "Uploading Credit...", hi: "क्रेडिट अपलोड हो रहा है..." },
  importing: { ar: "جارٍ الاستيراد...", en: "Importing...", hi: "आयात हो रहा है..." },
  editing: { ar: "جارٍ التعديل...", en: "Editing...", hi: "संपादन हो रहा है..." },
  deleting: { ar: "جارٍ الحذف...", en: "Deleting...", hi: "हटाया जा रहा है..." },
  saveChanges: { ar: "حفظ التغييرات", en: "Save Changes", hi: "परिवर्तन सहेजें" },
  importCompleted: { ar: "اكتمل الاستيراد", en: "Import Completed", hi: "आयात पूरा हुआ" },
  exceptionUpdated: { ar: "تم تحديث الاستثناء بنجاح", en: "Exception updated successfully", hi: "अपवाद सफलतापूर्वक अपडेट हुआ" },
  exceptionAdded: { ar: "⚠️ تمت إضافة الاستثناءات", en: "⚠️ Exceptions Added", hi: "⚠️ अपवाद जोड़े गए" },
  exceptionDeleted: { ar: "🗑️ تم حذف الاستثناء", en: "🗑️ Exception Deleted", hi: "🗑️ अपवाद हटाया गया" },
  invoiceRequired: { ar: "رقم الفاتورة مطلوب", en: "Invoice number is required", hi: "चालान संख्या आवश्यक है" },
  tillDateRequired: { ar: "تاريخ الانتهاء مطلوب", en: "Till Date is required", hi: "अंतिम तिथि आवश्यक है" },
  invalidUsernameAlert: { ar: "اسم المستخدم غير صحيح", en: "Invalid Username", hi: "अमान्य उपयोगकर्ता नाम" },
  invalidPasswordAlert: { ar: "كلمة المرور غير صحيحة", en: "Invalid Password", hi: "अमान्य पासवर्ड" },
  invalidUsernamePassword: { ar: "اسم المستخدم أو كلمة المرور غير صحيحة", en: "Invalid Username or Password", hi: "अमान्य उपयोगकर्ता नाम या पासवर्ड" },
  permissionDeniedPage: { ar: "ليس لديك صلاحية للوصول إلى هذه الصفحة", en: "You do not have permission to access this page", hi: "आपको इस पेज तक पहुंचने की अनुमति नहीं है" },
  pleaseLoginFirst: { ar: "يرجى تسجيل الدخول أولاً", en: "Please Login First", hi: "कृपया पहले लॉग इन करें" },
  settingsSaved: { ar: "تم حفظ الإعدادات بنجاح", en: "Settings Saved Successfully", hi: "सेटिंग्स सफलतापूर्वक सहेजी गईं" },
  failedSaveSettings: { ar: "فشل حفظ الإعدادات", en: "Failed To Save Settings", hi: "सेटिंग्स सहेजने में विफल" },
  usernameExists: { ar: "اسم المستخدم موجود بالفعل", en: "Username Already Exists", hi: "उपयोगकर्ता नाम पहले से मौजूद है" },
  failedUpdateProfile: { ar: "فشل تحديث الملف الشخصي", en: "Failed To Update Profile", hi: "प्रोफ़ाइल अपडेट विफल" },
  enterCurrentPassword: { ar: "أدخل كلمة المرور الحالية", en: "Enter Current Password", hi: "वर्तमान पासवर्ड दर्ज करें" },
  enterNewPassword: { ar: "أدخل كلمة المرور الجديدة", en: "Enter New Password", hi: "नया पासवर्ड दर्ज करें" },
  passwordsDoNotMatch: { ar: "كلمتا المرور غير متطابقتين", en: "Passwords Do Not Match", hi: "पासवर्ड मेल नहीं खाते" },
  userNotFound: { ar: "المستخدم غير موجود", en: "User Not Found", hi: "उपयोगकर्ता नहीं मिला" },
  currentPasswordIncorrect: { ar: "كلمة المرور الحالية غير صحيحة", en: "Current Password Is Incorrect", hi: "वर्तमान पासवर्ड गलत है" },
  failedUpdatePassword: { ar: "فشل تحديث كلمة المرور", en: "Failed To Update Password", hi: "पासवर्ड अपडेट विफल" },
  passwordUpdated: { ar: "تم تحديث كلمة المرور بنجاح", en: "Password Updated Successfully", hi: "पासवर्ड सफलतापूर्वक अपडेट हुआ" },
  updating: { ar: "جارٍ التحديث...", en: "Updating...", hi: "अपडेट हो रहा है..." },
  resetting: { ar: "جارٍ إعادة الضبط...", en: "Resetting...", hi: "रीसेट हो रहा है..." },
  enterUsernamePassword: { ar: "أدخل اسم المستخدم وكلمة المرور", en: "Enter Username And Password", hi: "उपयोगकर्ता नाम और पासवर्ड दर्ज करें" },
  noNotifications: { ar: "لا توجد إشعارات", en: "No notifications", hi: "कोई सूचनाएं नहीं" },
  creditFileNotUpdated: { ar: "🚨 لم يتم تحديث ملف الائتمان اليوم", en: "🚨 Credit File Not Updated Today", hi: "🚨 आज क्रेडिट फ़ाइल अपडेट नहीं हुई" },
  uploadTodayCredit: { ar: "يرجى رفع ملف الائتمان الخاص باليوم.", en: "Please upload today's Credit file.", hi: "कृपया आज की क्रेडिट फ़ाइल अपलोड करें।" },
  filters: { ar: "الفلاتر", en: "Filters", hi: "फ़िल्टर" },
  addExceptions: { ar: "إضافة الاستثناءات", en: "Add Exceptions", hi: "अपवाद जोड़ें" },
  currentExceptions: { ar: "الاستثناءات الحالية", en: "Current Exceptions", hi: "वर्तमान अपवाद" },
  edit: { ar: "تعديل", en: "Edit", hi: "संपादित करें" },
  updatePassword: { ar: "تحديث كلمة المرور", en: "Update Password", hi: "पासवर्ड अपडेट करें" },
  resetToDefault: { ar: "إعادة إلى الافتراضي", en: "Reset To Default", hi: "डिफ़ॉल्ट पर रीसेट करें" },
  saveProfile: { ar: "حفظ الملف الشخصي", en: "Save Profile", hi: "प्रोफ़ाइल सहेजें" },
  exceptionDeleteAlerts: { ar: "تنبيهات حذف الاستثناءات", en: "Exception Delete Alerts", hi: "अपवाद हटाने की सूचनाएं" },
  creditBlockRules: { ar: "قواعد حظر الائتمان", en: "Credit Block Rules", hi: "क्रेडिट ब्लॉक नियम" },
  welcomeBack: { ar: "مرحبًا بعودتك", en: "Welcome Back", hi: "वापसी पर स्वागत है" },
  guestUser: { ar: "مستخدم زائر", en: "Guest User", hi: "अतिथि उपयोगकर्ता" },
  notSignedIn: { ar: "غير مسجل الدخول", en: "Not Signed In", hi: "साइन इन नहीं है" },
  activityLogs: { ar: "سجل النشاط", en: "Activity Logs", hi: "गतिविधि लॉग" },
  allUsers: { ar: "جميع المستخدمين", en: "All Users", hi: "सभी उपयोगकर्ता" },

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
