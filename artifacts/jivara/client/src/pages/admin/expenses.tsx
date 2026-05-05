import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type Expense } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const IQD = (n: string | number) => Number(n).toLocaleString("ar-IQ") + " د.ع";

const categoryMap: Record<string, string> = {
  shipping:  "شحن وتوصيل",
  marketing: "تسويق وإعلان",
  packaging: "تغليف",
  rent:      "إيجار",
  salary:    "رواتب",
  other:     "أخرى",
};

const formSchema = insertExpenseSchema.extend({
  amount: z.string().min(1, "المبلغ مطلوب"),
});
type FormValues = z.infer<typeof formSchema>;

export default function ExpensesPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/expenses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "تم إضافة المصروف" });
      setShowForm(false);
      form.reset();
    },
    onError: () => toast({ title: "خطأ في الحفظ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "تم حذف المصروف" });
    },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", amount: "", category: "other", description: "" },
  });

  const filtered = filterCategory === "all" ? expenses : expenses.filter(e => e.category === filterCategory);
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const categoryTotals = Object.entries(categoryMap).map(([key, label]) => ({
    key, label,
    total: expenses.filter(e => e.category === key).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900 arabic-text">المصروفات</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A14A] text-white rounded-lg text-sm arabic-text hover:bg-[#b8903e] transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة مصروف
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 arabic-text mb-1">إجمالي المصروفات</p>
            <p className="text-xl font-bold text-gray-900 arabic-text">{IQD(expenses.reduce((s, e) => s + Number(e.amount), 0))}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 arabic-text mb-1">عدد السجلات</p>
            <p className="text-xl font-bold text-gray-900">{expenses.length}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
            <p className="text-xs font-semibold text-gray-500 arabic-text mb-3">توزيع المصروفات</p>
            <div className="space-y-2">
              {categoryTotals.map(c => {
                const grandTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
                const pct = grandTotal > 0 ? (c.total / grandTotal) * 100 : 0;
                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-xs arabic-text mb-1">
                      <span className="text-gray-600">{c.label}</span>
                      <span className="font-medium">{IQD(c.total)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-[#C9A14A] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium arabic-text transition-colors ${filterCategory === "all" ? "bg-[#C9A14A] text-white" : "bg-white border border-gray-200 text-gray-600"}`}
          >
            الكل
          </button>
          {Object.entries(categoryMap).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium arabic-text transition-colors ${filterCategory === key ? "bg-[#C9A14A] text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400 arabic-text">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400 arabic-text">لا توجد مصروفات</div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الوصف</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الفئة</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">المبلغ</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">التاريخ</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 arabic-text">{e.title}</p>
                        {e.description && <p className="text-xs text-gray-400 arabic-text">{e.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs arabic-text">
                          {categoryMap[e.category] || e.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-900 arabic-text">{IQD(e.amount)}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {e.date ? new Date(e.date).toLocaleDateString("ar-IQ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { if (confirm("حذف هذا المصروف؟")) deleteMutation.mutate(e.id); }}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filterCategory !== "all" && (
                <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                  <span className="text-xs text-gray-500 arabic-text">الإجمالي</span>
                  <span className="text-sm font-bold text-gray-900 arabic-text">{IQD(total)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 arabic-text">إضافة مصروف</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="p-5 space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">الوصف *</FormLabel>
                      <FormControl><Input {...field} placeholder="مثال: دفع الشحن لهذا الأسبوع" className="arabic-text" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">المبلغ (د.ع) *</FormLabel>
                      <FormControl><Input {...field} type="number" placeholder="50000" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">الفئة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="arabic-text"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(categoryMap).map(([key, label]) => (
                            <SelectItem key={key} value={key} className="arabic-text">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">ملاحظة (اختياري)</FormLabel>
                      <FormControl><Input {...field} value={field.value ?? ""} placeholder="تفاصيل إضافية..." className="arabic-text" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#C9A14A] hover:bg-[#b8903e] arabic-text">
                      {createMutation.isPending ? "جاري الحفظ..." : "حفظ المصروف"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="arabic-text">إلغاء</Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
