import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/layout";
import { ShoppingBag, AlertTriangle, Package, TrendingUp, CheckCircle, Clock } from "lucide-react";
import type { Order, Product } from "@shared/schema";

const IQD = (n: string | number) => Number(n).toLocaleString("ar-IQ") + " د.ع";

type Notification = {
  id: string;
  type: "new_order" | "low_stock" | "out_stock" | "delivered";
  title: string;
  body: string;
  time: Date;
  severity: "info" | "warning" | "danger" | "success";
};

const iconMap = {
  new_order: ShoppingBag,
  low_stock: AlertTriangle,
  out_stock: Package,
  delivered: CheckCircle,
};

const severityStyle = {
  info:    "bg-blue-50 border-blue-100 text-blue-700",
  warning: "bg-amber-50 border-amber-100 text-amber-700",
  danger:  "bg-red-50 border-red-100 text-red-700",
  success: "bg-green-50 border-green-100 text-green-700",
};

const iconColor = {
  info:    "text-blue-500 bg-blue-100",
  warning: "text-amber-500 bg-amber-100",
  danger:  "text-red-500 bg-red-100",
  success: "text-green-500 bg-green-100",
};

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

export default function NotificationsPage() {
  const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({ queryKey: ["/api/products"] });

  const notifications: Notification[] = [];

  // New orders (last 48h)
  const cutoff48 = new Date(Date.now() - 48 * 3600 * 1000);
  orders
    .filter(o => o.status === "pending" && new Date(o.createdAt!) > cutoff48)
    .slice(0, 10)
    .forEach(o => {
      notifications.push({
        id: `order-${o.id}`,
        type: "new_order",
        severity: "info",
        title: `طلب جديد #${o.id}`,
        body: `${o.customerName} · ${o.city} · ${IQD(o.totalAmount)}`,
        time: new Date(o.createdAt!),
      });
    });

  // Delivered orders (last 24h)
  const cutoff24 = new Date(Date.now() - 24 * 3600 * 1000);
  orders
    .filter(o => o.status === "delivered" && new Date(o.createdAt!) > cutoff24)
    .slice(0, 5)
    .forEach(o => {
      notifications.push({
        id: `delivered-${o.id}`,
        type: "delivered",
        severity: "success",
        title: `تم التوصيل — طلب #${o.id}`,
        body: `${o.customerName} · ${IQD(o.totalAmount)}`,
        time: new Date(o.createdAt!),
      });
    });

  // Low stock (1–5)
  products
    .filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5 && p.isActive)
    .forEach(p => {
      notifications.push({
        id: `low-${p.id}`,
        type: "low_stock",
        severity: "warning",
        title: `مخزون منخفض: ${p.nameAr}`,
        body: `تبقّى ${p.stock} وحدة فقط`,
        time: new Date(p.createdAt!),
      });
    });

  // Out of stock
  products
    .filter(p => (p.stock ?? 0) === 0 && p.isActive)
    .forEach(p => {
      notifications.push({
        id: `out-${p.id}`,
        type: "out_stock",
        severity: "danger",
        title: `نفد المخزون: ${p.nameAr}`,
        body: "المنتج غير متاح للبيع الآن",
        time: new Date(p.createdAt!),
      });
    });

  // Sort by severity then time
  const severityOrder = { danger: 0, warning: 1, info: 2, success: 3 };
  notifications.sort((a, b) =>
    severityOrder[a.severity] - severityOrder[b.severity] || b.time.getTime() - a.time.getTime()
  );

  const isLoading = loadingOrders || loadingProducts;

  const counts = {
    danger:  notifications.filter(n => n.severity === "danger").length,
    warning: notifications.filter(n => n.severity === "warning").length,
    info:    notifications.filter(n => n.severity === "info").length,
    success: notifications.filter(n => n.severity === "success").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900 arabic-text">الإشعارات</h1>
          {notifications.length > 0 && (
            <span className="px-3 py-1 bg-[#C9A14A] text-white text-xs rounded-full font-bold">
              {notifications.length} إشعار
            </span>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "عاجل", count: counts.danger, color: "text-red-600 border-red-200 bg-red-50" },
            { label: "تحذير", count: counts.warning, color: "text-amber-600 border-amber-200 bg-amber-50" },
            { label: "طلبات جديدة", count: counts.info, color: "text-blue-600 border-blue-200 bg-blue-50" },
            { label: "تم التوصيل", count: counts.success, color: "text-green-600 border-green-200 bg-green-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="text-xl font-bold">{s.count}</p>
              <p className="text-[10px] arabic-text mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Notifications list */}
        {isLoading ? (
          <div className="p-10 text-center text-gray-400 arabic-text">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-600 arabic-text font-medium">لا توجد إشعارات</p>
            <p className="text-gray-400 text-sm arabic-text mt-1">كل شيء يسير بشكل ممتاز!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = iconMap[n.type];
              return (
                <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border ${severityStyle[n.severity]}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconColor[n.severity]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm arabic-text">{n.title}</p>
                    <p className="text-xs arabic-text opacity-80 mt-0.5">{n.body}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs opacity-60 shrink-0 arabic-text">
                    <Clock className="w-3 h-3" />
                    {timeAgo(n.time)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
