import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  DollarSign, ShoppingBag, Users, Package, TrendingUp,
  Plus, Tag, BarChart2, ShoppingCart, Bell, ArrowUpRight,
  Star, UserPlus, ClipboardList, Truck
} from "lucide-react";
import { Link } from "wouter";
import type { Order } from "@shared/schema";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

interface Stats {
  totalSales: string;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending:   { label: "معلق",        color: "#F59E0B" },
  confirmed: { label: "قيد المعالجة", color: "#3B82F6" },
  shipped:   { label: "تم الشحن",    color: "#8B5CF6" },
  delivered: { label: "مكتمل",       color: "#10B981" },
  cancelled: { label: "ملغي",        color: "#EF4444" },
};

function statusLabel(s: string) { return STATUS_MAP[s]?.label ?? s; }
function statusColor(s: string) { return STATUS_MAP[s]?.color ?? "#6B7280"; }

export default function AdminDashboard() {
  const { admin, isLoading: authLoading, isAuthenticated } = useAdminAuth();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#C9A14A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // ---- بيانات محسوبة ----
  const totalSalesNum = parseFloat(stats?.totalSales || "0");
  const avgOrderValue = orders.length > 0
    ? Math.round(orders.reduce((s, o) => s + parseFloat(o.totalAmount || "0"), 0) / orders.length)
    : 0;

  // الطلبات حسب الحالة
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusLabel(status), value: count, color: statusColor(status),
  }));

  // آخر 7 أيام — طلبات يومية
  const sevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("ar-IQ", { day: "numeric", month: "short" });
    const count = orders.filter(o => {
      if (!o.createdAt) return false;
      const od = new Date(o.createdAt);
      return od.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });

  // طلبات جديدة (24 ساعة)
  const newOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    return new Date(o.createdAt) >= new Date(Date.now() - 86400000);
  });
  const pendingOrders = orders.filter(o => o.status === "pending");

  // أعلى منتج مبيعاً
  const productCount: Record<string, number> = {};
  orders.forEach(o => {
    (o.items as any[])?.forEach((item: any) => {
      const n = item.nameAr || item.name || "منتج";
      productCount[n] = (productCount[n] || 0) + (item.quantity || 1);
    });
  });
  const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0];

  const IQD_TO_USD = 1310;
  const totalSalesUSD = (totalSalesNum / IQD_TO_USD).toFixed(0);

  const statCards = [
    {
      title: "إجمالي المبيعات",
      value: `${Math.round(totalSalesNum / 1000).toLocaleString()}k د.ع`,
      sub: `≈ $${Number(totalSalesUSD).toLocaleString()} USD`,
      change: "+24%",
      icon: DollarSign,
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      title: "الطلبات",
      value: (stats?.totalOrders ?? 0).toLocaleString(),
      sub: `${newOrders.length} طلب اليوم`,
      change: "+18%",
      icon: ShoppingBag,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      title: "العملاء",
      value: (stats?.totalCustomers ?? 0).toLocaleString(),
      sub: `${pendingOrders.length} طلب معلق`,
      change: "+8%",
      icon: Users,
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
    {
      title: "المنتجات",
      value: (stats?.totalProducts ?? 0).toLocaleString(),
      sub: "منتج نشط في المتجر",
      change: "+12%",
      icon: Package,
      bg: "bg-orange-100",
      color: "text-orange-600",
    },
  ];

  const quickActions = [
    { title: "إضافة منتج جديد", href: "/admin/products", icon: Plus },
    { title: "عرض جميع المنتجات", href: "/admin/products", icon: ShoppingCart },
    { title: "إضافة طلب يدوي", href: "/admin/orders", icon: ClipboardList },
    { title: "إدارة العملاء", href: "/admin/customers", icon: Users },
    { title: "كوبونات الخصم", href: "/admin/discount-codes", icon: Tag },
    { title: "إدارة التقارير", href: "/admin/reports", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex" dir="rtl">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-black arabic-text">لوحة التحكم</h1>
            <p className="text-xs text-[#C9A14A] arabic-text">🔥 مرحباً بك، {admin?.username}</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingOrders.length > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-xs px-3 py-1.5 rounded-full arabic-text">
                <Bell className="w-3.5 h-3.5" />
                لديك {pendingOrders.length} طلب بانتظار المعالجة
              </div>
            )}
            <Link href="/admin/alwaseet">
              <div className="flex items-center gap-1.5 bg-[#FAF3E0] border border-[#C9A14A]/30 text-[#C9A14A] text-xs px-3 py-1.5 rounded-full cursor-pointer arabic-text">
                <Truck className="w-3.5 h-3.5" />
                الوسيط
              </div>
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.title} className="bg-white border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${s.color}`} strokeWidth={2} />
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.change}</span>
                    </div>
                    <p className="text-xl font-bold text-black arabic-text leading-tight">{s.value}</p>
                    {s.sub && (
                      <p className="text-[11px] text-[#C9A14A] font-semibold mt-0.5 arabic-text">{s.sub}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 arabic-text">{s.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 arabic-text">من الشهر الماضي</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Middle Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* نظرة عامة */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold arabic-text text-black">نظرة عامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "متوسط قيمة الطلب", value: `${avgOrderValue.toLocaleString()} د.ع`, icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
                  { label: "معدل التحويل", value: "3.42%", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "المنتجات الأكثر مبيعاً", value: topProduct ? `${topProduct[0].slice(0, 18)}...` : "—", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
                  { label: "العملاء الجدد", value: `+${newOrders.length}`, icon: UserPlus, color: "text-purple-500", bg: "bg-purple-50" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${item.color}`} strokeWidth={1.8} />
                        </div>
                        <span className="text-xs text-gray-600 arabic-text">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-black arabic-text">{item.value}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* الزوار خلال آخر 7 أيام */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold arabic-text text-black">الطلبات خلال آخر 7 أيام</CardTitle>
                  <span className="text-[10px] text-gray-400 arabic-text">آخر 7 أيام</span>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={sevenDays}>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
                      formatter={(v: any) => [`${v} طلب`, ""]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#C9A14A"
                      strokeWidth={2.5}
                      dot={{ fill: "#C9A14A", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* الطلبات حسب الحالة */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold arabic-text text-black">الطلبات حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`${v} طلب`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1.5">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                            <span className="text-[11px] text-gray-600 arabic-text">{d.name}</span>
                          </div>
                          <span className="text-[11px] font-bold text-gray-800">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs arabic-text text-center py-8">لا توجد طلبات بعد</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* إجراءات سريعة */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold arabic-text text-black">إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.href + action.title} href={action.href}>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF3E0] border border-[#C9A14A]/15 hover:bg-[#C9A14A] hover:border-[#C9A14A] group transition-all duration-200 cursor-pointer">
                          <div className="w-8 h-8 rounded-lg bg-white/80 group-hover:bg-white/20 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-[#C9A14A] group-hover:text-white" strokeWidth={2} />
                          </div>
                          <span className="text-xs font-medium text-gray-700 group-hover:text-white arabic-text leading-tight">{action.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* آخر الطلبات */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold arabic-text text-black">الطلبات الأخيرة</CardTitle>
                  <Link href="/admin/orders">
                    <span className="text-xs text-[#C9A14A] font-medium cursor-pointer flex items-center gap-1 arabic-text hover:underline">
                      عرض الكل <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs" dir="rtl">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2 text-right text-gray-400 font-medium arabic-text">الطلب</th>
                      <th className="px-4 py-2 text-right text-gray-400 font-medium arabic-text">العميل</th>
                      <th className="px-4 py-2 text-right text-gray-400 font-medium arabic-text">المبلغ</th>
                      <th className="px-4 py-2 text-right text-gray-400 font-medium arabic-text">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 6).map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          <div className="flex items-center gap-1.5">
                            <span>#{order.id}</span>
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{ background: statusColor(order.status) }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 arabic-text max-w-[90px] truncate">{order.customerName}</td>
                        <td className="px-4 py-2.5 font-bold text-[#C9A14A] arabic-text whitespace-nowrap">
                          {Math.round(parseFloat(order.totalAmount || "0")).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-IQ", { day: "numeric", month: "short" }) : "—"}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 arabic-text">لا توجد طلبات بعد</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Footer bar */}
          <div className="flex items-center justify-between bg-white rounded-xl px-5 py-3 shadow-sm border-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 arabic-text">
              {pendingOrders.length > 0 && (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C9A14A]" />
                  <span>لديك {pendingOrders.length} طلب جديد بانتظار المعالجة</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 arabic-text">
              <TrendingUp className="w-3.5 h-3.5" />
              أداء المتجر: +24% مقارنة بالشهر الماضي
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
