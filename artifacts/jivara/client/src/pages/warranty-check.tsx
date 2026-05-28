import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ShieldCheck, ShieldX, Clock, Phone, MapPin, Package, User, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";

interface Warranty {
  id: number; code: string; product_name: string; product_sku: string;
  customer_name: string; customer_phone: string; warranty_months: number;
  purchase_date: string; expiry_date: string; is_void: boolean;
  store_name: string; notes: string;
}

const DAYS_AR = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatDateAr(d: string | Date) {
  const date = new Date(d);
  return `${DAYS_AR[date.getDay()]} ${date.getDate()} ${MONTHS_AR[date.getMonth()]} ${date.getFullYear()}`;
}
function formatTimeAr(d: string | Date) {
  const date = new Date(d);
  let h = date.getHours(); const m = date.getMinutes();
  const ampm = h >= 12 ? "مساءً" : "صباحاً";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}
function daysLeft(expiry: string) {
  const diff = new Date(expiry).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function WarrantyResult({ code }: { code: string }) {
  const { data: warranty, isLoading, error } = useQuery<Warranty>({
    queryKey: ["/api/warranty", code],
    queryFn: async () => {
      const r = await fetch(`/api/warranty/${code.toUpperCase()}`);
      if (!r.ok) throw new Error((await r.json()).error || "غير موجود");
      return r.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 border-4 border-[#C9A14A] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 arabic-text">جاري التحقق من الضمان...</p>
      </div>
    );
  }

  if (error || !warranty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <ShieldX className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-red-600 arabic-text">كود غير صالح</h2>
        <p className="text-gray-500 text-center arabic-text max-w-xs">
          هذا الكود غير موجود في نظامنا. تأكد من الكود وحاول مجدداً أو تواصل مع المتجر.
        </p>
        <a href="tel:07886333998" className="mt-2 bg-[#C9A14A] text-white px-6 py-2.5 rounded-full font-semibold arabic-text text-sm flex items-center gap-2">
          <Phone className="w-4 h-4" /> اتصل بالمتجر
        </a>
      </div>
    );
  }

  const days = daysLeft(warranty.expiry_date);
  const isExpired = days <= 0;
  const isVoid = warranty.is_void;
  const isValid = !isVoid && !isExpired;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Status Banner */}
      <div className={`rounded-2xl p-5 text-center ${isVoid ? "bg-gray-100" : isExpired ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isVoid ? "bg-gray-200" : isExpired ? "bg-orange-100" : "bg-green-100"}`}>
          {isVoid ? <ShieldX className="w-8 h-8 text-gray-500" /> :
           isExpired ? <Clock className="w-8 h-8 text-orange-500" /> :
           <ShieldCheck className="w-8 h-8 text-green-600" />}
        </div>
        <h2 className={`text-xl font-bold arabic-text ${isVoid ? "text-gray-600" : isExpired ? "text-orange-600" : "text-green-700"}`}>
          {isVoid ? "الضمان ملغي" : isExpired ? "الضمان منتهي" : "الضمان ساري ✓"}
        </h2>
        {isValid && (
          <p className="text-green-600 text-sm mt-1 arabic-text font-semibold">
            متبقي {days} يوم
          </p>
        )}
        {isExpired && !isVoid && (
          <p className="text-orange-500 text-sm mt-1 arabic-text">
            انتهى منذ {Math.abs(days)} يوم
          </p>
        )}
        <div className="mt-3 inline-block bg-white/80 px-4 py-1.5 rounded-full border border-current/20">
          <span className={`font-mono font-bold text-lg tracking-widest ${isVoid ? "text-gray-500" : isExpired ? "text-orange-600" : "text-green-700"}`}>
            {warranty.code}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#FAF3E0] border-b border-[#C9A14A]/20">
          <h3 className="font-bold text-[#C9A14A] arabic-text text-sm">تفاصيل الضمان</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { icon: Package, label: "المنتج", value: warranty.product_name },
            { icon: User, label: "الزبون", value: warranty.customer_name },
            { icon: Phone, label: "الهاتف", value: warranty.customer_phone },
            { icon: Calendar, label: "تاريخ الشراء", value: `${formatDateAr(warranty.purchase_date)} — ${formatTimeAr(warranty.purchase_date)}` },
            { icon: Clock, label: "انتهاء الضمان", value: formatDateAr(warranty.expiry_date) },
          ].map(row => (
            <div key={row.label} className="flex items-start gap-3 px-4 py-3">
              <row.icon className="w-4 h-4 text-[#C9A14A] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 arabic-text">{row.label}</p>
                <p className="text-sm font-semibold text-gray-800 arabic-text">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty Terms */}
      <div className="bg-[#FAF3E0] rounded-2xl border border-[#C9A14A]/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-[#C9A14A]" />
          <h3 className="font-bold text-[#C9A14A] arabic-text text-sm">شروط الضمان</h3>
        </div>
        <ul className="space-y-1.5 text-sm text-gray-600 arabic-text">
          <li className="flex items-start gap-2"><span className="text-[#C9A14A] mt-0.5">•</span> يشمل الضمان: الصيانة أو الاستبدال</li>
          <li className="flex items-start gap-2"><span className="text-[#C9A14A] mt-0.5">•</span> مدة التسليم: 1–3 أيام عمل من تاريخ المراجعة</li>
          <li className="flex items-start gap-2"><span className="text-[#C9A14A] mt-0.5">•</span> يجب إحضار المنتج مع بطاقة الضمان</li>
          <li className="flex items-start gap-2"><span className="text-[#C9A14A] mt-0.5">•</span> لا يشمل الضمان الكسر أو سوء الاستخدام</li>
        </ul>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-gray-700 arabic-text text-sm mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#C9A14A]" /> معلومات المتجر
        </h3>
        <div className="space-y-2 text-sm text-gray-600 arabic-text">
          <p className="font-semibold text-gray-800">جداف للهواتف والساعات والاكسسوارات والعطور</p>
          <p>الرمادي – نهاية شارع 20 قرب سوبر ماركت الزيتون</p>
          <div className="flex flex-wrap gap-3 mt-2">
            <a href="tel:07886333998" className="flex items-center gap-1.5 text-[#C9A14A] font-semibold">
              <Phone className="w-3.5 h-3.5" /> المبيعات: 07886333998
            </a>
            <a href="tel:07886333939" className="flex items-center gap-1.5 text-[#C9A14A] font-semibold">
              <Phone className="w-3.5 h-3.5" /> الصيانة: 07886333939
            </a>
          </div>
          <p className="text-gray-400 text-xs mt-1">السبت–الخميس: 10ص–11م | الجمعة: 4م–11م</p>
        </div>
      </div>
    </div>
  );
}

export default function WarrantyCheckPage() {
  const [match, params] = useRoute("/warranty/:code");
  const [inputCode, setInputCode] = useState("");
  const [searchCode, setSearchCode] = useState(match ? params?.code?.toUpperCase() : "");

  if (searchCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] to-white" dir="rtl">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-[#C9A14A] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 arabic-text">التحقق من الضمان</h1>
            <p className="text-sm text-gray-500 arabic-text mt-1">جداف للهواتف والساعات والاكسسوارات</p>
          </div>
          <WarrantyResult code={searchCode} />
          <button onClick={() => setSearchCode("")} className="mt-4 w-full py-2.5 text-sm text-[#C9A14A] font-semibold arabic-text hover:underline">
            ← البحث بكود آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF3E0] to-white flex items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C9A14A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C9A14A]/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 arabic-text">التحقق من الضمان</h1>
          <p className="text-gray-500 arabic-text mt-2 text-sm">أدخل كود الضمان الموجود على بطاقتك</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <label className="text-sm font-semibold text-gray-700 arabic-text mb-2 block">كود الضمان</label>
          <input
            type="text"
            placeholder="JD-XXXXXX"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && inputCode.length >= 3 && setSearchCode(inputCode)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/30 focus:border-[#C9A14A]"
            maxLength={10}
          />
          <button
            onClick={() => inputCode.length >= 3 && setSearchCode(inputCode)}
            disabled={inputCode.length < 3}
            className="mt-4 w-full bg-[#C9A14A] hover:bg-[#b8913e] disabled:opacity-40 text-white py-3 rounded-xl font-bold arabic-text text-sm transition-colors"
          >
            تحقق من الضمان
          </button>
        </div>

        <div className="mt-6 text-center space-y-1">
          <p className="text-xs text-gray-400 arabic-text">للتواصل مع المتجر:</p>
          <div className="flex justify-center gap-4">
            <a href="tel:07886333998" className="text-sm text-[#C9A14A] font-semibold arabic-text">المبيعات: 07886333998</a>
            <a href="tel:07886333939" className="text-sm text-[#C9A14A] font-semibold arabic-text">الصيانة: 07886333939</a>
          </div>
        </div>
      </div>
    </div>
  );
}
