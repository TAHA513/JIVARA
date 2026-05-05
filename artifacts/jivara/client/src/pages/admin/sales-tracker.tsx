import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, TrendingUp, Target, DollarSign, Package, Calendar, Trash2, TrendingDown, Percent, ShoppingCart } from "lucide-react";
import type { FinancialProduct, SalesRecord } from "@shared/schema";

export default function SalesTracker() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    financialProductId: "",
    quantitySold: "",
    shippingCost: "",
    promotionCost: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: financialProducts = [] } = useQuery<FinancialProduct[]>({
    queryKey: ["/api/financial-products"],
  });

  const { data: salesRecords = [] } = useQuery<SalesRecord[]>({
    queryKey: ["/api/sales-records"],
  });

  const createSalesMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/sales-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "تم تسجيل المبيعات", description: "تم إضافة سجل المبيعات بنجاح" });
    },
    onError: (error: any) => {
      toast({ title: "خطأ في التسجيل", description: error.message || "حدث خطأ غير متوقع", variant: "destructive" });
    },
  });

  const deleteSalesMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sales-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-products"] });
      toast({ title: "تم حذف السجل" });
    },
  });

  const resetForm = () => {
    setFormData({ financialProductId: "", quantitySold: "", shippingCost: "", promotionCost: "", notes: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product = financialProducts.find(p => p.id === parseInt(formData.financialProductId));
    if (!product) {
      toast({ title: "خطأ", description: "يرجى اختيار منتج صحيح", variant: "destructive" });
      return;
    }

    const quantitySold = parseInt(formData.quantitySold);
    const sellingPrice = parseFloat(product.sellingPrice);
    const revenue = sellingPrice * quantitySold;

    const costPrice = parseFloat(product.costPrice || "0");
    const shippingCostPerUnit = parseFloat(product.shippingCost || "0");
    const promotionCostPerUnit = parseFloat(product.promotionCost || "0");

    const additionalShipping = parseFloat(formData.shippingCost || "0");
    const additionalPromotion = parseFloat(formData.promotionCost || "0");

    const purchaseCost = costPrice * quantitySold;
    const totalShipping = shippingCostPerUnit * quantitySold + additionalShipping;
    const totalPromotion = promotionCostPerUnit * quantitySold + additionalPromotion;
    const totalCost = purchaseCost + totalShipping + totalPromotion;
    const netProfit = revenue - totalCost;

    createSalesMutation.mutate({
      financialProductId: parseInt(formData.financialProductId),
      quantitySold,
      revenue: revenue.toString(),
      totalCost: totalCost.toString(),
      shippingCost: totalShipping.toString(),
      promotionCost: totalPromotion.toString(),
      netProfit: netProfit.toString(),
      notes: formData.notes,
    });
  };

  // حساب الإحصائيات الإجمالية
  const totalRevenue = salesRecords.reduce((s, r) => s + parseFloat(r.revenue), 0);
  const totalCost = salesRecords.reduce((s, r) => s + parseFloat(r.totalCost), 0);
  const totalNetProfit = salesRecords.reduce((s, r) => s + parseFloat(r.netProfit), 0);
  const totalQuantitySold = salesRecords.reduce((s, r) => s + r.quantitySold, 0);
  const totalShippingCost = salesRecords.reduce((s, r) => s + parseFloat(r.shippingCost || "0"), 0);
  const totalPromotionCost = salesRecords.reduce((s, r) => s + parseFloat(r.promotionCost || "0"), 0);
  const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  // تقدم الأهداف
  const productsWithGoals = financialProducts.filter(p => p.targetQuantity || p.targetRevenue);
  const goalsProgress = productsWithGoals.map(product => {
    const productSales = salesRecords.filter(r => r.financialProductId === product.id);
    const soldQuantity = productSales.reduce((s, r) => s + r.quantitySold, 0);
    const revenue = productSales.reduce((s, r) => s + parseFloat(r.revenue), 0);
    const profit = productSales.reduce((s, r) => s + parseFloat(r.netProfit), 0);
    const quantityProgress = product.targetQuantity ? (soldQuantity / product.targetQuantity) * 100 : 0;
    const revenueProgress = product.targetRevenue ? (revenue / parseFloat(product.targetRevenue)) * 100 : 0;
    return { product, soldQuantity, revenue, profit, quantityProgress, revenueProgress };
  });

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:mr-64">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold arabic-text">إدارة المبيعات والأرباح</h1>
              <p className="text-muted-foreground arabic-text mt-2">تسجيل المبيعات اليومية من المنتجات المالية</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 ml-2" />
                  تسجيل مبيعات
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="arabic-text">تسجيل مبيعات جديدة</DialogTitle>
                  <DialogDescription className="arabic-text">
                    سجل المبيعات اليومية مع كل التكاليف لحساب الأرباح الصافية
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* اختيار المنتج المالي */}
                  <div>
                    <Label className="arabic-text">المنتج المالي *</Label>
                    {financialProducts.length === 0 ? (
                      <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center arabic-text text-sm text-amber-700">
                        لا توجد منتجات مالية — أضف منتجات من صفحة "المنتجات المالية" أولاً
                      </div>
                    ) : (
                      <Select value={formData.financialProductId} onValueChange={v => setFormData(p => ({ ...p, financialProductId: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {financialProducts.filter(fp => fp.isActive !== false).map(fp => {
                            const costPrice = parseFloat(fp.costPrice || "0");
                            const shipping = parseFloat(fp.shippingCost || "0");
                            const promotion = parseFloat(fp.promotionCost || "0");
                            const totalUnitCost = costPrice + shipping + promotion;
                            const unitProfit = parseFloat(fp.sellingPrice) - totalUnitCost;
                            return (
                              <SelectItem key={fp.id} value={fp.id.toString()}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{fp.nameAr}</span>
                                  <span className="text-xs text-muted-foreground">
                                    سعر البيع: {parseFloat(fp.sellingPrice).toLocaleString()} د.ع |
                                    التكلفة: {totalUnitCost.toLocaleString()} د.ع |
                                    الربح/قطعة: <span className={unitProfit >= 0 ? "text-green-600" : "text-red-600"}>{unitProfit.toLocaleString()} د.ع</span>
                                  </span>
                                  {fp.currentStock > 0 && (
                                    <span className="text-xs text-blue-600">المخزون: {fp.currentStock} قطعة</span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="arabic-text">الكمية المباعة *</Label>
                      <Input type="number" min="1" value={formData.quantitySold}
                        onChange={e => setFormData(p => ({ ...p, quantitySold: e.target.value }))}
                        placeholder="عدد القطع" required />
                    </div>
                    <div>
                      <Label className="arabic-text">تكلفة توصيل إضافية</Label>
                      <Input type="number" min="0" step="0.01" value={formData.shippingCost}
                        onChange={e => setFormData(p => ({ ...p, shippingCost: e.target.value }))}
                        placeholder="0" />
                      <span className="text-xs text-muted-foreground arabic-text">تكاليف توصيل خاصة بهذه الدفعة</span>
                    </div>
                    <div>
                      <Label className="arabic-text">تكلفة ترويج إضافية</Label>
                      <Input type="number" min="0" step="0.01" value={formData.promotionCost}
                        onChange={e => setFormData(p => ({ ...p, promotionCost: e.target.value }))}
                        placeholder="0" />
                      <span className="text-xs text-muted-foreground arabic-text">تكاليف إعلان خاصة بهذه الدفعة</span>
                    </div>
                  </div>

                  {/* ملخص مالي */}
                  {formData.financialProductId && formData.quantitySold && (() => {
                    const product = financialProducts.find(p => p.id === parseInt(formData.financialProductId));
                    if (!product) return null;
                    const qty = parseInt(formData.quantitySold);
                    const revenue = parseFloat(product.sellingPrice) * qty;
                    const costPrice = parseFloat(product.costPrice || "0");
                    const shippingPerUnit = parseFloat(product.shippingCost || "0");
                    const promotionPerUnit = parseFloat(product.promotionCost || "0");
                    const addShip = parseFloat(formData.shippingCost || "0");
                    const addPromo = parseFloat(formData.promotionCost || "0");
                    const purchaseCost = costPrice * qty;
                    const shippingCost = shippingPerUnit * qty + addShip;
                    const promotionCost = promotionPerUnit * qty + addPromo;
                    const totalCost = purchaseCost + shippingCost + promotionCost;
                    const netProfit = revenue - totalCost;
                    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
                    return (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                        <h4 className="font-bold mb-3 arabic-text text-green-900 flex items-center gap-2">
                          <DollarSign className="w-5 h-5" /> ملخص مالي تفصيلي
                        </h4>
                        <div className="space-y-3">
                          <div className="bg-white p-3 rounded-md border border-green-100">
                            <div className="text-sm font-semibold text-green-800 mb-1 arabic-text">الإيرادات</div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm arabic-text">{qty} × {parseFloat(product.sellingPrice).toLocaleString()} د.ع</span>
                              <span className="font-bold text-green-700 text-lg">{revenue.toLocaleString()} د.ع</span>
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-md border border-orange-100">
                            <div className="text-sm font-semibold text-orange-800 mb-2 arabic-text">المصروفات</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between arabic-text">
                                <span>تكلفة الشراء ({qty} × {costPrice.toLocaleString()}):</span>
                                <span className="font-medium">{purchaseCost.toLocaleString()} د.ع</span>
                              </div>
                              <div className="flex justify-between arabic-text">
                                <span>تكلفة التوصيل:</span>
                                <span className="font-medium">{shippingCost.toLocaleString()} د.ع</span>
                              </div>
                              <div className="flex justify-between arabic-text">
                                <span>تكلفة الترويج:</span>
                                <span className="font-medium">{promotionCost.toLocaleString()} د.ع</span>
                              </div>
                              <Separator className="my-1" />
                              <div className="flex justify-between font-semibold text-orange-700 arabic-text">
                                <span>إجمالي المصروفات:</span>
                                <span>{totalCost.toLocaleString()} د.ع</span>
                              </div>
                            </div>
                          </div>
                          <div className={`p-3 rounded-md border-2 ${netProfit >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm font-semibold arabic-text">الربح الصافي:</div>
                                <div className="text-xs text-muted-foreground">هامش الربح: {margin.toFixed(1)}%</div>
                              </div>
                              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString()} د.ع
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <Label className="arabic-text">ملاحظات</Label>
                    <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                      placeholder="أي ملاحظات..." rows={3} />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={createSalesMutation.isPending || financialProducts.length === 0} className="flex-1">
                      {createSalesMutation.isPending ? "جاري الحفظ..." : "حفظ وتسجيل"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">إلغاء</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 arabic-text">
                  <ShoppingCart className="w-4 h-4 text-blue-600" /> إجمالي الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{totalRevenue.toLocaleString()} د.ع</div>
                <div className="text-xs text-blue-600 mt-1">{totalQuantitySold} قطعة مباعة</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 arabic-text">
                  <TrendingDown className="w-4 h-4 text-orange-600" /> إجمالي المصروفات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{totalCost.toLocaleString()} د.ع</div>
                <div className="text-xs text-orange-600 mt-1">
                  توصيل: {totalShippingCost.toLocaleString()} | ترويج: {totalPromotionCost.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${totalNetProfit >= 0 ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 arabic-text">
                  <TrendingUp className={`w-4 h-4 ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} /> الربح الصافي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalNetProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {totalNetProfit >= 0 ? '+' : ''}{totalNetProfit.toLocaleString()} د.ع
                </div>
                <div className={`text-xs mt-1 ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>بعد خصم كل المصروفات</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 arabic-text">
                  <Percent className="w-4 h-4 text-purple-600" /> هامش الربح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{profitMargin.toFixed(1)}%</div>
                <div className="text-xs text-purple-600 mt-1">نسبة الربح من الإيرادات</div>
              </CardContent>
            </Card>
          </div>

          {/* تقدم الأهداف */}
          {goalsProgress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 arabic-text">
                  <Target className="w-5 h-5" /> تقدم الأهداف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goalsProgress.map(({ product, soldQuantity, revenue, profit, quantityProgress, revenueProgress }) => (
                  <div key={product.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold arabic-text">{product.nameAr}</h3>
                        <p className="text-xs text-muted-foreground arabic-text">
                          مباع: {soldQuantity} قطعة | إيرادات: {revenue.toLocaleString()} د.ع | ربح: {profit.toLocaleString()} د.ع
                        </p>
                      </div>
                      <Badge variant={quantityProgress >= 100 ? "default" : "secondary"} className="arabic-text">
                        {quantityProgress >= 100 ? "✅ تم تحقيق الهدف" : `${quantityProgress.toFixed(0)}%`}
                      </Badge>
                    </div>
                    {product.targetQuantity && (
                      <div>
                        <div className="flex justify-between text-sm mb-1 arabic-text">
                          <span>هدف الكمية</span>
                          <span className="font-semibold">{soldQuantity} / {product.targetQuantity} قطعة</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${quantityProgress >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(quantityProgress, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {product.targetRevenue && (
                      <div>
                        <div className="flex justify-between text-sm mb-1 arabic-text">
                          <span>الهدف المالي</span>
                          <span className="font-semibold">{revenue.toLocaleString()} / {parseFloat(product.targetRevenue).toLocaleString()} د.ع</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${revenueProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(revenueProgress, 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* جدول سجلات المبيعات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 arabic-text">
                <Calendar className="w-5 h-5" /> سجلات المبيعات
                <Badge variant="secondary">{salesRecords.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="arabic-text">لا توجد سجلات مبيعات بعد</p>
                  <p className="text-sm arabic-text mt-1">اضغط "تسجيل مبيعات" لإضافة أول سجل</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="arabic-text">المنتج</TableHead>
                        <TableHead className="arabic-text text-center">الكمية</TableHead>
                        <TableHead className="arabic-text text-right">الإيرادات</TableHead>
                        <TableHead className="arabic-text text-right">التكلفة</TableHead>
                        <TableHead className="arabic-text text-right">الربح</TableHead>
                        <TableHead className="arabic-text text-center">التاريخ</TableHead>
                        <TableHead className="arabic-text text-center">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesRecords.map(record => {
                        const product = financialProducts.find(p => p.id === record.financialProductId);
                        const profit = parseFloat(record.netProfit);
                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium arabic-text">
                              {product?.nameAr || `منتج #${record.financialProductId}`}
                            </TableCell>
                            <TableCell className="text-center">{record.quantitySold}</TableCell>
                            <TableCell className="text-right text-blue-600 font-semibold">
                              {parseFloat(record.revenue).toLocaleString()} د.ع
                            </TableCell>
                            <TableCell className="text-right text-orange-600">
                              {parseFloat(record.totalCost).toLocaleString()} د.ع
                            </TableCell>
                            <TableCell className={`text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}{profit.toLocaleString()} د.ع
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {record.date ? new Date(record.date).toLocaleDateString('ar-IQ') : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="sm" onClick={() => deleteSalesMutation.mutate(record.id)}
                                disabled={deleteSalesMutation.isPending} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
