import { safeStorage } from '@/lib/safe-storage';
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import AdminSidebar from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Tag, CheckCircle, XCircle, Copy } from "lucide-react";
import type { DiscountCode } from "@shared/schema";

export default function DiscountCodesPage() {
  useAdminAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountAmount: "",
    minOrderAmount: "",
    description: "",
    isActive: true,
  });

  const { data: codes = [], isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/admin/discount-codes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/discount-codes", {
        headers: { Authorization: `Bearer ${safeStorage.getItem("adminToken")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("POST", "/api/admin/discount-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      setShowForm(false);
      setForm({ code: "", discountAmount: "", minOrderAmount: "", description: "", isActive: true });
      toast({ title: "✅ تم إنشاء الكود بنجاح" });
    },
    onError: () => toast({ title: "❌ فشل إنشاء الكود", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PUT", `/api/admin/discount-codes/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/discount-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "✅ تم حذف الكود" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `📋 تم نسخ الكود: ${code}` });
  };

  const handleSubmit = () => {
    if (!form.code || !form.discountAmount || !form.minOrderAmount) {
      toast({ title: "❌ أدخل الكود والمبالغ المطلوبة", variant: "destructive" });
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 arabic-text">أكواد الخصم</h1>
              <p className="text-gray-500 text-sm arabic-text">إدارة أكواد الخصم للعملاء</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2 arabic-text">
              <Plus className="w-4 h-4" />
              إضافة كود جديد
            </Button>
          </div>

          {/* نموذج الإضافة */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 arabic-text">كود خصم جديد</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="arabic-text mb-1 block">الكود (بالإنجليزية)</Label>
                  <Input
                    placeholder="مثال: JIVARA25"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="font-mono text-lg tracking-widest"
                  />
                </div>
                <div>
                  <Label className="arabic-text mb-1 block">مبلغ الخصم (د.ع)</Label>
                  <Input
                    type="number"
                    placeholder="25000"
                    value={form.discountAmount}
                    onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="arabic-text mb-1 block">الحد الأدنى للطلب (د.ع)</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={form.minOrderAmount}
                    onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="arabic-text mb-1 block">وصف الكود (اختياري)</Label>
                  <Input
                    placeholder="خصم 25 ألف على الطلبات فوق 100 ألف"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="arabic-text"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSubmit} disabled={createMutation.isPending} className="arabic-text">
                  {createMutation.isPending ? "جاري الحفظ..." : "حفظ الكود"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="arabic-text">
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {/* قائمة الأكواد */}
          {isLoading ? (
            <div className="text-center py-12 text-gray-500 arabic-text">جاري التحميل...</div>
          ) : codes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 arabic-text text-lg">لا توجد أكواد خصم بعد</p>
              <p className="text-gray-400 arabic-text text-sm mt-1">اضغط "إضافة كود جديد" لإنشاء أول كود</p>
            </div>
          ) : (
            <div className="space-y-3">
              {codes.map(code => (
                <div key={code.id} className={`bg-white rounded-xl border p-5 shadow-sm flex items-center justify-between gap-4 ${!code.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-bold text-gray-800 tracking-widest">{code.code}</span>
                        <button onClick={() => copyCode(code.code)} className="text-gray-400 hover:text-primary transition-colors">
                          <Copy className="w-4 h-4" />
                        </button>
                        {code.isActive ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full arabic-text">فعّال</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full arabic-text">موقوف</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 arabic-text mt-0.5">
                        خصم <strong>{parseFloat(code.discountAmount).toLocaleString('en-US')} د.ع</strong> عند طلب أكثر من <strong>{parseFloat(code.minOrderAmount).toLocaleString('en-US')} د.ع</strong>
                      </p>
                      {code.description && (
                        <p className="text-xs text-gray-400 arabic-text mt-0.5">{code.description}</p>
                      )}
                      <p className="text-xs text-gray-400 arabic-text mt-0.5">استُخدم {code.usageCount || 0} مرة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: code.id, isActive: !code.isActive })}
                      className="gap-1 arabic-text"
                    >
                      {code.isActive ? (
                        <><XCircle className="w-4 h-4 text-orange-500" /> إيقاف</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 text-green-500" /> تفعيل</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(code.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تعليمات الاستخدام */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-800 arabic-text mb-2">💡 كيف يعمل الكود؟</h3>
            <ul className="text-sm text-blue-700 arabic-text space-y-1 list-disc list-inside">
              <li>الزبون يُدخل الكود عند إتمام الطلب في أي صفحة شراء</li>
              <li>إذا كان المبلغ يتجاوز الحد الأدنى، يُطبَّق الخصم تلقائياً</li>
              <li>اكتب الكود في إعلاناتك على تيك توك وإنستغرام لجذب الزبائن</li>
              <li>يمكنك إيقاف الكود أو حذفه في أي وقت</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
