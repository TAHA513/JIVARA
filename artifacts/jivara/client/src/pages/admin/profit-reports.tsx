import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  TrendingUp, TrendingDown, DollarSign, Package, Target, Percent,
  ShoppingCart, AlertCircle, CheckCircle, Calendar, BarChart3
} from "lucide-react";
import type { FinancialProduct, SalesRecord } from "@shared/schema";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProfitReports() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();

  const { data: financialProducts = [] } = useQuery<FinancialProduct[]>({
    queryKey: ["/api/financial-products"],
  });

  const { data: salesRecords = [] } = useQuery<SalesRecord[]>({
    queryKey: ["/api/sales-records"],
  });

  // الإحصائيات الإجمالية
  const totalRevenue = salesRecords.reduce((s, r) => s + parseFloat(r.revenue), 0);
  const totalCost = salesRecords.reduce((s, r) => s + parseFloat(r.totalCost), 0);
  const totalNetProfit = salesRecords.reduce((s, r) => s + parseFloat(r.netProfit), 0);
  const totalQuantitySold = salesRecords.reduce((s, r) => s + r.quantitySold, 0);
  const totalShippingCost = salesRecords.reduce((s, r) => s + parseFloat(r.shippingCost || "0"), 0);
  const totalPromotionCost = salesRecords.reduce((s, r) => s + parseFloat(r.promotionCost || "0"), 0);
  const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
  const avgOrderValue = salesRecords.length > 0 ? totalRevenue / salesRecords.length : 0;

  // تحليل المنتجات المالية
  const productAnalysis = financialProducts.map(fp => {
    const fpSales = salesRecords.filter(r => r.financialProductId === fp.id);
    const soldQuantity = fpSales.reduce((s, r) => s + r.quantitySold, 0);
    const revenue = fpSales.reduce((s, r) => s + parseFloat(r.revenue), 0);
    const cost = fpSales.reduce((s, r) => s + parseFloat(r.totalCost), 0);
    const profit = fpSales.reduce((s, r) => s + parseFloat(r.netProfit), 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const quantityProgress = fp.targetQuantity ? (soldQuantity / fp.targetQuantity) * 100 : 0;
    const revenueProgress = fp.targetRevenue ? (revenue / parseFloat(fp.targetRevenue)) * 100 : 0;
    return {
      id: fp.id,
      name: fp.nameAr,
      soldQuantity, revenue, cost, profit,
      profitMargin: margin,
      targetQuantity: fp.targetQuantity,
      targetRevenue: fp.targetRevenue ? parseFloat(fp.targetRevenue) : null,
      quantityProgress, revenueProgress,
      salesCount: fpSales.length,
    };
  }).filter(p => p.soldQuantity > 0);

  const topProducts = [...productAnalysis].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const bottomProducts = [...productAnalysis].sort((a, b) => a.profit - b.profit).slice(0, 5);

  const profitChartData = topProducts.map(p => ({
    name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
    revenue: p.revenue, cost: p.cost, profit: p.profit,
  }));

  const pieChartData = [
    { name: 'الربح الصافي', value: Math.max(totalNetProfit, 0), color: '#10b981' },
    { name: 'تكلفة الشراء', value: Math.max(totalCost - totalShippingCost - totalPromotionCost, 0), color: '#f59e0b' },
    { name: 'تكلفة التوصيل', value: totalShippingCost, color: '#3b82f6' },
    { name: 'تكلفة الترويج', value: totalPromotionCost, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const trendData = last7Days.map(dateStr => {
    const daySales = salesRecords.filter(r => {
      if (!r.date) return false;
      return new Date(r.date).toISOString().split('T')[0] === dateStr;
    });
    return {
      date: new Date(dateStr).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' }),
      revenue: daySales.reduce((s, r) => s + parseFloat(r.revenue), 0),
      profit: daySales.reduce((s, r) => s + parseFloat(r.netProfit), 0),
      quantity: daySales.reduce((s, r) => s + r.quantitySold, 0),
    };
  });

  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:mr-64">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold arabic-text flex items-center gap-3">
              <BarChart3 className="w-8 h-8" /> تقارير الأرباح والأداء
            </h1>
            <p className="text-muted-foreground arabic-text mt-2">تحليل شامل للمبيعات، الأرباح، والأداء المالي</p>
          </div>

          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="arabic-text">الربح الصافي</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{totalNetProfit.toLocaleString()} د.ع</div>
                <Badge variant={profitMargin > 20 ? "default" : "secondary"} className="arabic-text mt-2">
                  {profitMargin.toFixed(1)}% هامش ربح
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                  <DollarSign className="w-4 h-4" />
                  <span className="arabic-text">إجمالي الإيرادات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{totalRevenue.toLocaleString()} د.ع</div>
                <p className="text-xs text-muted-foreground mt-2 arabic-text">متوسط الطلب: {avgOrderValue.toLocaleString()} د.ع</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700">
                  <TrendingDown className="w-4 h-4" />
                  <span className="arabic-text">إجمالي التكاليف</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{totalCost.toLocaleString()} د.ع</div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">شحن: {totalShippingCost.toLocaleString()}</Badge>
                  <Badge variant="outline" className="text-xs">ترويج: {totalPromotionCost.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
                  <Package className="w-4 h-4" />
                  <span className="arabic-text">القطع المباعة</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{totalQuantitySold.toLocaleString()} قطعة</div>
                <p className="text-xs text-muted-foreground mt-2 arabic-text">من {salesRecords.length} عملية بيع</p>
              </CardContent>
            </Card>
          </div>

          {/* لا توجد بيانات */}
          {salesRecords.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-semibold arabic-text text-muted-foreground mb-2">لا توجد بيانات مبيعات بعد</p>
                <p className="text-sm arabic-text text-muted-foreground">
                  أضف منتجات في صفحة "المنتجات المالية" ثم سجّل مبيعاتك من صفحة "تسجيل المبيعات"
                </p>
              </CardContent>
            </Card>
          )}

          {salesRecords.length > 0 && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="arabic-text">نظرة عامة</TabsTrigger>
                <TabsTrigger value="products" className="arabic-text">تحليل المنتجات</TabsTrigger>
                <TabsTrigger value="goals" className="arabic-text">الأهداف</TabsTrigger>
              </TabsList>

              {/* نظرة عامة */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="arabic-text flex items-center gap-2">
                        <Calendar className="w-5 h-5" /> اتجاهات المبيعات (آخر 7 أيام)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(val: number) => val.toLocaleString() + ' د.ع'} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="الإيرادات" strokeWidth={2} />
                          <Line type="monotone" dataKey="profit" stroke="#10b981" name="الربح" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {pieChartData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="arabic-text">توزيع التكاليف والأرباح</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                              {pieChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(val: number) => val.toLocaleString() + ' د.ع'} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {profitChartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="arabic-text">أعلى 5 منتجات ربحاً</CardTitle>
                      <CardDescription className="arabic-text">مقارنة الإيرادات، التكاليف، والأرباح</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={profitChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(val: number) => val.toLocaleString() + ' د.ع'} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#3b82f6" name="الإيرادات" />
                          <Bar dataKey="cost" fill="#f59e0b" name="التكاليف" />
                          <Bar dataKey="profit" fill="#10b981" name="الربح" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* تحليل المنتجات */}
              <TabsContent value="products" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="arabic-text flex items-center gap-2 text-green-700">
                        <TrendingUp className="w-5 h-5" /> أعلى المنتجات ربحاً
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {topProducts.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground arabic-text">لا توجد بيانات</p>
                      ) : topProducts.map((p, i) => (
                        <div key={p.id} className="border rounded-lg p-4 bg-green-50/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-600">{i + 1}</Badge>
                              <h3 className="font-semibold arabic-text">{p.name}</h3>
                            </div>
                            <Badge variant="outline" className="bg-green-100">{p.profitMargin.toFixed(1)}% هامش</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><p className="text-muted-foreground arabic-text">المبيعات</p><p className="font-bold">{p.soldQuantity} قطعة</p></div>
                            <div><p className="text-muted-foreground arabic-text">الإيرادات</p><p className="font-bold text-blue-600">{p.revenue.toLocaleString()} د.ع</p></div>
                            <div><p className="text-muted-foreground arabic-text">التكلفة</p><p className="font-bold text-orange-600">{p.cost.toLocaleString()} د.ع</p></div>
                            <div><p className="text-muted-foreground arabic-text">الربح</p><p className="font-bold text-green-600">{p.profit.toLocaleString()} د.ع</p></div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="arabic-text flex items-center gap-2 text-orange-700">
                        <AlertCircle className="w-5 h-5" /> منتجات تحتاج تحسين
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {bottomProducts.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground arabic-text">لا توجد بيانات</p>
                      ) : bottomProducts.map((p, i) => (
                        <div key={p.id} className="border rounded-lg p-4 bg-orange-50/50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{i + 1}</Badge>
                              <h3 className="font-semibold arabic-text">{p.name}</h3>
                            </div>
                            <Badge variant="outline" className={p.profit < 0 ? "bg-red-100" : "bg-orange-100"}>
                              {p.profitMargin.toFixed(1)}% هامش
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><p className="text-muted-foreground arabic-text">المبيعات</p><p className="font-bold">{p.soldQuantity} قطعة</p></div>
                            <div><p className="text-muted-foreground arabic-text">الإيرادات</p><p className="font-bold text-blue-600">{p.revenue.toLocaleString()} د.ع</p></div>
                            <div><p className="text-muted-foreground arabic-text">التكلفة</p><p className="font-bold text-orange-600">{p.cost.toLocaleString()} د.ع</p></div>
                            <div><p className="text-muted-foreground arabic-text">الربح</p>
                              <p className={`font-bold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{p.profit.toLocaleString()} د.ع</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* الأهداف */}
              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="arabic-text flex items-center gap-2">
                      <Target className="w-5 h-5" /> تتبع الأهداف الشهرية
                    </CardTitle>
                    <CardDescription className="arabic-text">تقدم المنتجات نحو تحقيق الأهداف المحددة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {productAnalysis.filter(p => p.targetQuantity || p.targetRevenue).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="arabic-text">لا توجد أهداف محددة</p>
                        <p className="text-sm arabic-text mt-1">حدد الأهداف من صفحة "المنتجات المالية"</p>
                      </div>
                    ) : productAnalysis.filter(p => p.targetQuantity || p.targetRevenue).map(p => (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold arabic-text text-lg">{p.name}</h3>
                            <p className="text-sm text-muted-foreground arabic-text">{p.salesCount} عملية بيع</p>
                          </div>
                          {p.quantityProgress >= 100 ? (
                            <Badge className="bg-green-600 arabic-text">
                              <CheckCircle className="w-3 h-3 ml-1" /> تم تحقيق الهدف
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="arabic-text">قيد التقدم</Badge>
                          )}
                        </div>

                        {p.targetQuantity && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1 arabic-text">
                              <span>هدف الكمية</span>
                              <span className="font-semibold">{p.soldQuantity} / {p.targetQuantity} قطعة</span>
                            </div>
                            <Progress value={Math.min(p.quantityProgress, 100)} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1 arabic-text">
                              {p.quantityProgress.toFixed(1)}% مكتمل
                              {p.targetQuantity - p.soldQuantity > 0 && <span> • متبقي {p.targetQuantity - p.soldQuantity} قطعة</span>}
                            </p>
                          </div>
                        )}

                        {p.targetRevenue && (
                          <div>
                            <div className="flex justify-between text-sm mb-1 arabic-text">
                              <span>الهدف المالي</span>
                              <span className="font-semibold">{p.revenue.toLocaleString()} / {p.targetRevenue.toLocaleString()} د.ع</span>
                            </div>
                            <Progress value={Math.min(p.revenueProgress, 100)} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1 arabic-text">
                              {p.revenueProgress.toFixed(1)}% مكتمل
                              {p.targetRevenue > p.revenue && <span> • متبقي {(p.targetRevenue - p.revenue).toLocaleString()} د.ع</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
