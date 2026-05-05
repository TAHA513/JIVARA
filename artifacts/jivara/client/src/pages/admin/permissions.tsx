import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdminUserSchema, type AdminUser } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, X, ShieldCheck } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roleMap: Record<string, { label: string; color: string; desc: string }> = {
  owner:     { label: "مالك",           color: "bg-purple-100 text-purple-700", desc: "صلاحيات كاملة على كل شيء" },
  manager:   { label: "مدير",           color: "bg-blue-100 text-blue-700",     desc: "إدارة المتجر والموظفين" },
  sales:     { label: "موظف مبيعات",   color: "bg-green-100 text-green-700",   desc: "الطلبات والمنتجات فقط" },
  marketing: { label: "مسوّق",          color: "bg-orange-100 text-orange-700", desc: "الحملات والسوشيال ميديا" },
  support:   { label: "دعم العملاء",   color: "bg-cyan-100 text-cyan-700",     desc: "الطلبات والعملاء فقط" },
};

const formSchema = insertAdminUserSchema.extend({
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
type FormValues = z.infer<typeof formSchema>;

export default function PermissionsPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: adminUsers = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin-users"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/admin-users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      toast({ title: "تم إضافة المستخدم" });
      setShowForm(false);
      form.reset();
    },
    onError: (e: any) => toast({ title: e?.message || "خطأ في الحفظ", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin-users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] }),
    onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin-users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      toast({ title: "تم حذف المستخدم" });
    },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", username: "", password: "", role: "sales", isActive: true },
  });

  const activeCount = adminUsers.filter(u => u.isActive).length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900 arabic-text">الصلاحيات والمستخدمين</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A14A] text-white rounded-lg text-sm arabic-text hover:bg-[#b8903e] transition-colors"
          >
            <Plus className="w-4 h-4" /> إضافة مستخدم
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{adminUsers.length}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">إجمالي المستخدمين</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">مستخدمين نشطين</p>
          </div>
        </div>

        {/* Roles legend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 arabic-text mb-3">مستويات الصلاحيات</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(roleMap).map(([key, r]) => (
              <div key={key} className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full arabic-text font-medium ${r.color}`}>{r.label}</span>
                  <p className="text-[10px] text-gray-400 arabic-text mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400 arabic-text">جاري التحميل...</div>
          ) : adminUsers.length === 0 ? (
            <div className="p-10 text-center text-gray-400 arabic-text">لا يوجد مستخدمون — أضف أول مستخدم</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الاسم</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">اسم المستخدم</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الدور</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الحالة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminUsers.map(user => {
                  const role = roleMap[user.role] || { label: user.role, color: "bg-gray-100 text-gray-600", desc: "" };
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 arabic-text">{user.name}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs font-mono">{user.username}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs arabic-text font-medium ${role.color}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleMutation.mutate({ id: user.id, isActive: !user.isActive })}
                          className={`px-3 py-1 rounded-full text-xs arabic-text font-medium transition-colors ${
                            user.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {user.isActive ? "نشط" : "موقوف"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { if (confirm(`حذف ${user.name}؟`)) deleteMutation.mutate(user.id); }}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900 arabic-text">إضافة مستخدم جديد</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="p-5 space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">الاسم الكامل *</FormLabel>
                      <FormControl><Input {...field} placeholder="مثال: أحمد محمد" className="arabic-text" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">اسم المستخدم *</FormLabel>
                      <FormControl><Input {...field} placeholder="ahmed123" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">كلمة المرور *</FormLabel>
                      <FormControl><Input {...field} type="password" placeholder="6 أحرف على الأقل" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="arabic-text text-xs">الدور</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="arabic-text"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(roleMap).map(([key, r]) => (
                            <SelectItem key={key} value={key} className="arabic-text">{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#C9A14A] hover:bg-[#b8903e] arabic-text">
                      {createMutation.isPending ? "جاري الحفظ..." : "إضافة المستخدم"}
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
