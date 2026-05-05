// Shared form validation helpers for landing pages

export const IRAQ_PROVINCES = [
  "بغداد",
  "البصرة",
  "نينوى (الموصل)",
  "أربيل",
  "السليمانية",
  "دهوك",
  "الأنبار (الرمادي)",
  "صلاح الدين",
  "ديالى",
  "بابل",
  "كربلاء",
  "النجف",
  "القادسية (الديوانية)",
  "واسط",
  "ميسان",
  "ذي قار",
  "المثنى",
  "كركوك",
];

// Normalize phone: keep only digits, convert Arabic-Indic digits to Latin
export function normalizePhone(input: string): string {
  if (!input) return "";
  const arabicMap: Record<string, string> = {
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  };
  return input
    .split("")
    .map((c) => arabicMap[c] ?? c)
    .join("")
    .replace(/\D/g, "");
}

// Iraqi mobile: must be exactly 11 digits and start with 07
export function validateIraqiPhone(input: string): string | null {
  const digits = normalizePhone(input);
  if (digits.length === 0) return "يرجى إدخال رقم الهاتف";
  if (digits.length !== 11) return `رقم الهاتف يجب أن يكون 11 رقم بالضبط (أدخلت ${digits.length})`;
  if (!digits.startsWith("07")) return "رقم الهاتف يجب أن يبدأ بـ 07";
  return null;
}

export function validateRequiredText(value: string, fieldLabel: string): string | null {
  if (!value || !value.trim()) return `${fieldLabel} مطلوب`;
  if (value.trim().length < 2) return `${fieldLabel} غير صالح`;
  return null;
}
