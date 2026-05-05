import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  TrendingUp, Package, CheckCircle, XCircle, Clock,
  Truck, DollarSign, BarChart3, MapPin, Calendar,
  ShoppingBag, Banknote, Percent, CalendarRange
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  city: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: Array<{ name?: string; nameAr?: string; quantity: number; price: string; productId?: number }>;
  alwaseetStatus?: string;
}

const USD_RATE = 1310;
const DELIVERY_FEE_IQD = 5000;

const STATUS_LABELS: Record<string, string> = {
  pending: 'انتظار', confirmed: 'مؤكد', shipped: 'في الطريق', delivered: 'مسلّم', cancelled: 'ملغي',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#6366F1', shipped: '#3B82F6', delivered: '#10B981', cancelled: '#EF4444',
};

function StatCard({ title, iqd, icon: Icon, color, extra, sub }: { title: string; iqd: number; icon: any; color: string; extra?: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {extra && <span className="text-xs text-gray-400 arabic-text">{extra}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{iqd.toLocaleString('ar-IQ')}</p>
      <p className="text-sm text-emerald-600 font-medium">${(iqd / USD_RATE).toFixed(2)}</p>
      <p className="text-xs text-gray-500 mt-1.5 arabic-text">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 arabic-text">{sub}</p>}
    </div>
  );
}

function CountCard({ title, value, icon: Icon, color, sub }: { title: string; value: number; icon: any; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 arabic-text">{title}</p>
        {sub && <p className="text-xs text-gray-400 arabic-text">{sub}</p>}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [period, setPeriod] = useState<'all' | '7d' | '30d' | '90d' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const filtered = useMemo(() => {
    if (period === 'custom' && (dateFrom || dateTo)) {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : -Infinity;
      const to   = dateTo   ? new Date(dateTo   + 'T23:59:59').getTime() :  Infinity;
      return orders.filter(o => {
        if (!o.createdAt) return false;
        const t = new Date(o.createdAt).getTime();
        return t >= from && t <= to;
      });
    }
    if (period === 'all') return orders;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return orders.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);
  }, [orders, period, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total      = filtered.length;
    const delivered  = filtered.filter(o => o.status === 'delivered');
    const cancelled  = filtered.filter(o => o.status === 'cancelled');
    const shipped    = filtered.filter(o => o.status === 'shipped');
    const confirmed  = filtered.filter(o => o.status === 'confirmed');
    const pending    = filtered.filter(o => o.status === 'pending');

    const totalRevenue     = filtered.reduce((s, o) => s + parseFloat(o.totalAmount || '0'), 0);
    const collectedRevenue = delivered.reduce((s, o) => s + parseFloat(o.totalAmount || '0'), 0);
    const expectedRevenue  = [...confirmed, ...shipped, ...pending].reduce((s, o) => s + parseFloat(o.totalAmount || '0'), 0);
    const lostRevenue      = cancelled.reduce((s, o) => s + parseFloat(o.totalAmount || '0'), 0);
    const nonCancelledCount      = total - cancelled.length;
    const totalDeliveryFees      = nonCancelledCount * DELIVERY_FEE_IQD;
    const deliveryFeesCollected  = delivered.length * DELIVERY_FEE_IQD;
    const netCollected           = collectedRevenue - deliveryFeesCollected;
    const avgOrderValue  = total > 0 ? totalRevenue / total : 0;
    const deliveryRate   = total > 0 ? (delivered.length / total) * 100 : 0;
    const cancelRate     = total > 0 ? (cancelled.length / total) * 100 : 0;
    const statusDist = ['delivered','shipped','confirmed','pending','cancelled'].map(s => ({
      name: STATUS_LABELS[s] || s, value: filtered.filter(o => o.status === s).length, color: STATUS_COLORS[s],
    })).filter(x => x.value > 0);

    return { total, delivered, cancelled, shipped, confirmed, pending,
      totalRevenue, collectedRevenue, expectedRevenue, lostRevenue,
      totalDeliveryFees, deliveryFeesCollected, netCollected,
      avgOrderValue, deliveryRate, cancelRate, statusDist, nonCancelledCount };
  }, [filtered]);

  const cityStats = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    for (const o of filtered) {
      const city = o.city || 'غير محدد';
      if (!map[city]) map[city] = { count: 0, revenue: 0 };
      map[city].count++;
      map[city].revenue += parseFloat(o.totalAmount || '0');
    }
    return Object.entries(map).map(([city, v]) => ({ city, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filtered]);

  const productStats = useMemo(() => {
    const map: Record<string, { count: number; qty: number; revenue: number }> = {};
    for (const o of filtered) {
      for (const item of (o.items || [])) {
        const name = item.nameAr || item.name || `منتج #${item.productId}`;
        if (!map[name]) map[name] = { count: 0, qty: 0, revenue: 0 };
        map[name].count++;
        map[name].qty += item.quantity || 1;
        map[name].revenue += parseFloat(item.price || '0') * (item.quantity || 1);
      }
    }
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [filtered]);

  const dailyChart = useMemo(() => {
    const map: Record<string, { revenue: number; count: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      map[d.toISOString().slice(0, 10)] = { revenue: 0, count: 0 };
    }
    for (const o of orders) {
      if (!o.createdAt) continue;
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!map[key]) continue;
      map[key].count++;
      map[key].revenue += parseFloat(o.totalAmount || '0');
    }
    return Object.entries(map).map(([date, v]) => ({
      date: date.slice(5),
      'إيرادات (ألف)': Math.round(v.revenue / 1000),
      'طلبات': v.count,
    }));
  }, [orders]);

  if (authLoading || isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">

        {/* Header */}
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold arabic-text">التقارير المالية</h1>
              <p className="text-xs text-gray-500 arabic-text">
                {filtered.length} طلب • أجور الوسيط 5,000 د.ع/طلب • 1$ = {USD_RATE.toLocaleString()} د.ع
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(['all','7d','30d','90d'] as const).map(p => (
                <button key={p} onClick={() => { setPeriod(p); setDateFrom(""); setDateTo(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs arabic-text font-medium transition-all ${
                    period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {p === 'all' ? 'الكل' : p === '7d' ? '7 أيام' : p === '30d' ? '30 يوم' : '90 يوم'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowDateFilter(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs arabic-text font-medium transition-all border ${
                period === 'custom' && (dateFrom || dateTo)
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}>
              <CalendarRange className="w-3.5 h-3.5" />
              {period === 'custom' && (dateFrom || dateTo) ? 'تاريخ مخصص ✓' : 'تاريخ مخصص'}
            </button>
          </div>
        </div>

        {/* لوحة التاريخ المخصص */}
        {showDateFilter && (
          <div className="bg-white border-b border-gray-100 px-5 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-gray-700 arabic-text font-semibold">عرض تقرير من:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 arabic-text">من</span>
              <input type="date" value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPeriod('custom'); }}
                className="border border-gray-200 text-gray-700 text-xs rounded-lg px-2 py-1 h-8 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 arabic-text">إلى</span>
              <input type="date" value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPeriod('custom'); }}
                className="border border-gray-200 text-gray-700 text-xs rounded-lg px-2 py-1 h-8 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: 'اليوم',     days: 0 },
                { label: 'أمس',        days: 1 },
                { label: 'هذا الأسبوع', days: 7 },
                { label: 'هذا الشهر',  days: 30 },
              ].map(p => (
                <button key={p.label}
                  onClick={() => {
                    const today = new Date();
                    const todayStr = today.toISOString().slice(0, 10);
                    if (p.days === 0) {
                      setDateFrom(todayStr); setDateTo(todayStr);
                    } else if (p.days === 1) {
                      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                      setDateFrom(y); setDateTo(y);
                    } else {
                      const start = new Date(Date.now() - p.days * 86400000).toISOString().slice(0, 10);
                      setDateFrom(start); setDateTo(todayStr);
                    }
                    setPeriod('custom');
                  }}
                  className="px-2.5 py-1 text-xs arabic-text rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-all">
                  {p.label}
                </button>
              ))}
            </div>
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(""); setDateTo(""); setPeriod('all'); }}
                className="px-2.5 py-1 text-xs arabic-text rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all flex items-center gap-1 mr-auto">
                <XCircle className="w-3 h-3" /> مسح
              </button>
            )}
          </div>
        )}

        <div className="p-5 space-y-5">

          {/* بطاقات الأعداد */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <CountCard title="إجمالي الطلبات"  value={stats.total}            icon={ShoppingBag} color="bg-indigo-100 text-indigo-600" />
            <CountCard title="مسلّم"            value={stats.delivered.length} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" sub={`${stats.deliveryRate.toFixed(0)}%`} />
            <CountCard title="في الطريق"        value={stats.shipped.length}   icon={Truck}       color="bg-blue-100 text-blue-600" />
            <CountCard title="انتظار + مؤكد"    value={stats.pending.length + stats.confirmed.length} icon={Clock} color="bg-amber-100 text-amber-600" />
            <CountCard title="ملغي"             value={stats.cancelled.length} icon={XCircle}     color="bg-red-100 text-red-600" sub={`${stats.cancelRate.toFixed(0)}%`} />
          </div>

          {/* بطاقات المبالغ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard title="إجمالي المبالغ (كل الطلبات)" iqd={stats.totalRevenue}    icon={Banknote}   color="bg-indigo-100 text-indigo-600"  extra={`${stats.total} طلب`} />
            <StatCard title="المُحصّل فعلياً (مسلّم)"     iqd={stats.collectedRevenue} icon={CheckCircle} color="bg-emerald-100 text-emerald-600" extra={`${stats.delivered.length} طلب`} />
            <StatCard title="أجور شركة الوسيط الكلية"     iqd={stats.totalDeliveryFees} icon={Truck}      color="bg-orange-100 text-orange-600"  extra={`${stats.nonCancelledCount} × 5,000`} sub="5,000 د.ع لكل طلب" />
            <StatCard title="صافي الإيراد بعد الأجور"     iqd={stats.netCollected}     icon={TrendingUp}  color={stats.netCollected >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"} extra="المحصّل − أجور التوصيل" />
          </div>

          {/* بطاقات إضافية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center"><Clock className="w-4 h-4" /></div>
                <p className="text-sm font-semibold text-gray-700 arabic-text">إيرادات متوقعة</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{stats.expectedRevenue.toLocaleString('ar-IQ')}</p>
              <p className="text-sm text-amber-600">${(stats.expectedRevenue / USD_RATE).toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1 arabic-text">طلبات لم تُسلَّم بعد</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded-xl flex items-center justify-center"><XCircle className="w-4 h-4" /></div>
                <p className="text-sm font-semibold text-gray-700 arabic-text">مبالغ الطلبات الملغاة</p>
              </div>
              <p className="text-xl font-bold text-red-600">{stats.lostRevenue.toLocaleString('ar-IQ')}</p>
              <p className="text-sm text-red-400">${(stats.lostRevenue / USD_RATE).toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1 arabic-text">من {stats.cancelled.length} طلب ملغي</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
                <p className="text-sm font-semibold text-gray-700 arabic-text">متوسط قيمة الطلب</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{Math.round(stats.avgOrderValue).toLocaleString('ar-IQ')}</p>
              <p className="text-sm text-purple-600">${(stats.avgOrderValue / USD_RATE).toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1 arabic-text">لكل طلب</p>
            </div>
          </div>

          {/* ملخص مالي */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-sm arabic-text mb-4 flex items-center gap-2">
              <Banknote className="w-4 h-4" /> الملخص المالي الكامل
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                {[
                  { label: 'إجمالي الطلبات الكلية',     val: stats.totalRevenue,         pos: true  },
                  { label: '➖ أجور الوسيط الكلية',     val: stats.totalDeliveryFees,    pos: false },
                  { label: '➖ مبالغ الطلبات الملغاة',  val: stats.lostRevenue,          pos: false },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center border-b border-white/10 pb-1.5">
                    <span className="text-xs arabic-text text-indigo-200">{row.label}</span>
                    <div className="text-left">
                      <span className={`text-sm font-bold ${row.pos ? 'text-white' : 'text-red-300'}`}>
                        {!row.pos && '-'}{row.val.toLocaleString('ar-IQ')} د.ع
                      </span>
                      <span className={`block text-xs ${row.pos ? 'text-indigo-300' : 'text-red-400'}`}>
                        {!row.pos && '-'}${(row.val / USD_RATE).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'المحصّل فعلياً (مسلّم)',     val: stats.collectedRevenue,        pos: true,  bold: false },
                  { label: '➖ أجور وسيط المسلّم فقط',   val: stats.deliveryFeesCollected,   pos: false, bold: false },
                  { label: '✅ صافي الإيراد المُحصّل',   val: stats.netCollected,            pos: stats.netCollected >= 0, bold: true  },
                ].map(row => (
                  <div key={row.label} className={`flex justify-between items-center pb-1.5 ${row.bold ? 'border-t-2 border-white/30 pt-2 mt-1' : 'border-b border-white/10'}`}>
                    <span className={`text-xs arabic-text ${row.bold ? 'text-white font-semibold' : 'text-indigo-200'}`}>{row.label}</span>
                    <div className="text-left">
                      <span className={`font-bold ${row.bold ? 'text-emerald-300 text-lg' : row.pos ? 'text-white text-sm' : 'text-red-300 text-sm'}`}>
                        {!row.pos && '-'}{Math.abs(row.val).toLocaleString('ar-IQ')} د.ع
                      </span>
                      <span className={`block text-xs ${row.bold ? 'text-emerald-400' : row.pos ? 'text-indigo-300' : 'text-red-400'}`}>
                        {!row.pos && '-'}${(Math.abs(row.val) / USD_RATE).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* المخططات */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-700 arabic-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> الإيرادات اليومية — آخر 30 يوم (بالألف دينار)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart} margin={{ right: 5, left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'inherit', direction: 'rtl' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="إيرادات (ألف)" fill="#6366F1" radius={[3,3,0,0]} />
                  <Bar dataKey="طلبات"         fill="#10B981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-700 arabic-text mb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-500" /> توزيع الحالات
              </h3>
              {stats.statusDist.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={stats.statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={28}>
                        {stats.statusDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, fontFamily: 'inherit', direction: 'rtl' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-1">
                    {stats.statusDist.map(s => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                          <span className="text-xs text-gray-600 arabic-text">{s.name}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-800">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm arabic-text">لا بيانات</div>
              )}
            </div>
          </div>

          {/* المدن + المنتجات */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-700 arabic-text mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> الطلبات حسب المدينة
              </h3>
              <div className="space-y-2.5">
                {cityStats.length > 0 ? cityStats.map((c, i) => {
                  const pct = stats.total > 0 ? (c.count / stats.total) * 100 : 0;
                  return (
                    <div key={c.city}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-400 w-4">{i+1}</span>
                          <span className="text-sm font-semibold text-gray-700 arabic-text">{c.city}</span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-gray-700">{c.count} طلب</span>
                          <span className="text-xs text-gray-400 mr-2">— {c.revenue.toLocaleString('ar-IQ')} د.ع</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : <div className="text-center text-gray-400 text-sm arabic-text py-8">لا بيانات</div>}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-sm text-gray-700 arabic-text mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" /> أكثر المنتجات مبيعاً
              </h3>
              <div className="space-y-2.5">
                {productStats.length > 0 ? productStats.map((p, i) => {
                  const pct = (p.qty / (productStats[0]?.qty || 1)) * 100;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i+1}</span>
                          <span className="text-sm font-semibold text-gray-700 arabic-text truncate">{p.name}</span>
                        </div>
                        <div className="text-left shrink-0 mr-2">
                          <span className="text-xs font-bold text-gray-700">{p.qty} قطعة</span>
                          <span className="text-xs text-gray-400 mr-1">({p.count} طلب)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : <div className="text-center text-gray-400 text-sm arabic-text py-8">لا بيانات</div>}
              </div>
            </div>
          </div>

          {/* جدول آخر الطلبات */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-gray-700 arabic-text">آخر الطلبات</h3>
              <span className="text-xs text-gray-400 arabic-text mr-auto">صافي = المبلغ − 5,000 د.ع أجرة</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['#', 'الزبون', 'المدينة', 'المبلغ الكلي', 'صافي (بعد أجرة الوسيط)', 'الحالة', 'التاريخ'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-xs font-semibold text-gray-500 arabic-text whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filtered].sort((a, b) => b.id - a.id).slice(0, 25).map(o => {
                    const amt = parseFloat(o.totalAmount || '0');
                    const net = amt - DELIVERY_FEE_IQD;
                    const color = STATUS_COLORS[o.status] || '#9CA3AF';
                    return (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-xs font-mono text-gray-400">#{o.id}</td>
                        <td className="px-3 py-2.5 text-sm font-semibold text-gray-700 arabic-text whitespace-nowrap">{o.customerName}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 arabic-text">{o.city}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-800">{amt.toLocaleString('ar-IQ')}</p>
                          <p className="text-xs text-gray-400">${(amt / USD_RATE).toFixed(2)}</p>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <p className="text-sm font-bold" style={{ color: net >= 0 ? '#10B981' : '#EF4444' }}>{net.toLocaleString('ar-IQ')}</p>
                          <p className="text-xs" style={{ color: net >= 0 ? '#6EE7B7' : '#FCA5A5' }}>${(net / USD_RATE).toFixed(2)}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium arabic-text" style={{ background: color + '20', color }}>
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-400 whitespace-nowrap" dir="ltr">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString('ar-IQ', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm arabic-text">لا توجد طلبات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
