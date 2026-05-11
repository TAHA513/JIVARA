import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Package, AlertTriangle, CheckCircle, Search, Edit2, Save, X } from "lucide-react";
import type { Product } from "@shared/schema";

const IQD = (n: number | string) => Number(n).toLocaleString("ar-IQ") + " د.ع";

export default function InventoryPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editStock, setEditStock] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }: { id: number; stock: number }) =>
      apiRequest("PATCH", `/api/products/${id}`, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "تم تحديث المخزون" });
      setEditId(null);
    },
    onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
  });

  const filtered = products
    .filter(p => {
      const matchSearch = p.nameAr.includes(search) || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").includes(search);
      const stock = p.stock ?? 0;
      if (filter === "low") return matchSearch && stock > 0 && stock <= 5;
      if (filter === "out") return matchSearch && stock === 0;
      return matchSearch;
    })
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

  const totalItems = products.reduce((s, p) => s + (p.stock ?? 0), 0);
  const outOfStock = products.filter(p => (p.stock ?? 0) === 0).length;
  const lowStock = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;

  const stockColor = (s: number) =>
    s === 0 ? "text-red-600 bg-red-50" : s <= 5 ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50";

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        <h1 className="text-xl font-bold text-gray-900 mb-5 arabic-text">إدارة المخزون</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">إجمالي الوحدات</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{lowStock}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">مخزون منخفض (≤5)</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">نفد المخزون</p>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm arabic-text focus:outline-none focus:border-[#C9A14A]"
              placeholder="بحث بالاسم أو الكود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {(["all", "low", "out"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium arabic-text transition-colors ${
                filter === f ? "bg-[#C9A14A] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "الكل" : f === "low" ? "منخفض" : "نفد"}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400 arabic-text">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400 arabic-text">لا توجد منتجات</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">المنتج</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الكود</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">السعر</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">المخزون</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 arabic-text">الحالة</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const stock = p.stock ?? 0;
                  const isEditing = editId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 arabic-text">{p.nameAr}</p>
                        <p className="text-xs text-gray-400">{p.name}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{p.sku || "—"}</td>
                      <td className="px-4 py-3 text-center text-gray-700 arabic-text">{IQD(p.price)}</td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editStock}
                            onChange={e => setEditStock(e.target.value)}
                            className="w-20 border border-[#C9A14A] rounded-lg px-2 py-1 text-center text-sm focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${stockColor(stock)}`}>
                            {stock}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {stock === 0 ? (
                          <span className="flex items-center justify-center gap-1 text-red-500 text-xs arabic-text">
                            <AlertTriangle className="w-3.5 h-3.5" /> نفد
                          </span>
                        ) : stock <= 5 ? (
                          <span className="flex items-center justify-center gap-1 text-amber-500 text-xs arabic-text">
                            <AlertTriangle className="w-3.5 h-3.5" /> منخفض
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-green-500 text-xs arabic-text">
                            <CheckCircle className="w-3.5 h-3.5" /> متوفر
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateMutation.mutate({ id: p.id, stock: parseInt(editStock) || 0 })}
                              className="p-1.5 rounded-lg bg-[#C9A14A] text-white hover:bg-[#b8903e] transition-colors"
                              disabled={updateMutation.isPending}
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditId(p.id); setEditStock(String(stock)); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
