import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Search, ChevronDown } from "lucide-react";
import type { Order } from "@shared/schema";

const IQD = (n: string | number) => Number(n).toLocaleString("ar-IQ") + " د.ع";

const statusMap: Record<string, { label: string; color: string }> = {
  pending:   { label: "معلق",      color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "مؤكد",      color: "bg-blue-100 text-blue-700" },
  shipped:   { label: "شُحن",      color: "bg-purple-100 text-purple-700" },
  delivered: { label: "تم التوصيل", color: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي",      color: "bg-red-100 text-red-700" },
  returned:  { label: "مُرتجع",    color: "bg-orange-100 text-orange-700" },
};

export default function ReturnsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "تم تحديث حالة الطلب" });
    },
    onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
  });

  const returnOrders = orders.filter(o => o.status === "returned");
  const eligibleOrders = orders.filter(o =>
    ["delivered", "cancelled"].includes(o.status) &&
    (o.customerName.includes(search) || o.customerPhone.includes(search) || String(o.id).includes(search))
  );

  const totalReturned = returnOrders.length;
  const totalReturnedAmount = returnOrders.reduce((s, o) => s + Number(o.totalAmount), 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        <h1 className="text-xl font-bold text-gray-900 mb-5 arabic-text">المرتجعات</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{totalReturned}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">إجمالي المرتجعات</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-lg font-bold text-gray-900 arabic-text">{IQD(totalReturnedAmount)}</p>
            <p className="text-xs text-gray-500 arabic-text mt-1">قيمة المرتجعات</p>
          </div>
        </div>

        {/* Returned Orders */}
        {returnOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 arabic-text mb-3">الطلبات المُرتجعة</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {returnOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 arabic-text">{order.customerName}</p>
                    <p className="text-xs text-gray-500 arabic-text">{order.customerPhone} · {order.city}</p>
                    <p className="text-xs text-gray-400 arabic-text mt-0.5">
                      {(order.items as any[]).map((i: any) => i.nameAr).join("، ")}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 arabic-text">{IQD(order.totalAmount)}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 arabic-text">مُرتجع</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mark Orders as Returned */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 arabic-text mb-3">تسجيل مرتجع جديد</h2>
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm arabic-text focus:outline-none focus:border-[#C9A14A]"
              placeholder="ابحث باسم الزبون أو رقم الهاتف أو رقم الطلب..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-400 arabic-text">جاري التحميل...</div>
          ) : eligibleOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-400 arabic-text bg-white rounded-xl border border-gray-200">
              {search ? "لا توجد نتائج" : "ابحث عن طلب لتسجيله كمرتجع"}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {eligibleOrders.map(order => {
                const st = statusMap[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
                const isOpen = openOrderId === order.id;
                return (
                  <div key={order.id}>
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setOpenOrderId(isOpen ? null : order.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 arabic-text">{order.customerName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full arabic-text ${st.color}`}>{st.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 arabic-text">{order.customerPhone} · طلب #{order.id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-gray-900 arabic-text">{IQD(order.totalAmount)}</p>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="mt-3 space-y-1 text-xs text-gray-600 arabic-text mb-4">
                          {(order.items as any[]).map((item: any, i: number) => (
                            <p key={i}>• {item.nameAr} × {item.quantity} — {IQD(Number(item.price) * item.quantity)}</p>
                          ))}
                          <p className="text-gray-400 mt-1">العنوان: {order.shippingAddress}، {order.city}</p>
                        </div>
                        <button
                          onClick={() => updateMutation.mutate({ id: order.id, status: "returned" })}
                          disabled={updateMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm arabic-text hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          تسجيل كمرتجع
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
