import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { FinancialProduct, InsertFinancialProduct } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Pencil, Trash2, TrendingUp, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function FinancialProducts() {
  useAdminAuth();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FinancialProduct | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    sku: "",
    category: "",
    costPrice: "",
    sellingPrice: "",
    shippingCost: "",
    promotionCost: "",
    initialStock: "",
    currentStock: "",
    targetQuantity: "",
    targetRevenue: "",
    notes: "",
    isActive: true,
  });

  const { data: products = [], isLoading } = useQuery<FinancialProduct[]>({
    queryKey: ["/api/financial-products"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const cleanedData = {
        ...productData,
        costPrice: productData.costPrice.toString(),
        sellingPrice: productData.sellingPrice.toString(),
        shippingCost: productData.shippingCost ? productData.shippingCost.toString() : "0",
        promotionCost: productData.promotionCost ? productData.promotionCost.toString() : "0",
        initialStock: parseInt(productData.initialStock) || 0,
        currentStock: parseInt(productData.currentStock) || parseInt(productData.initialStock) || 0,
        targetQuantity: productData.targetQuantity ? parseInt(productData.targetQuantity) : null,
        targetRevenue: productData.targetRevenue ? productData.targetRevenue.toString() : null,
        sku: productData.sku || null,
        category: productData.category || null,
        notes: productData.notes || null,
      };
      
      await apiRequest("POST", "/api/financial-products", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم إنشاء المنتج المالي",
        description: "تم إضافة المنتج بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء المنتج",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const cleanedData = {
        ...productData,
        costPrice: productData.costPrice.toString(),
        sellingPrice: productData.sellingPrice.toString(),
        shippingCost: productData.shippingCost ? productData.shippingCost.toString() : "0",
        promotionCost: productData.promotionCost ? productData.promotionCost.toString() : "0",
        initialStock: parseInt(productData.initialStock) || 0,
        currentStock: parseInt(productData.currentStock) || 0,
        targetQuantity: productData.targetQuantity ? parseInt(productData.targetQuantity) : null,
        targetRevenue: productData.targetRevenue ? productData.targetRevenue.toString() : null,
        sku: productData.sku || null,
        category: productData.category || null,
        notes: productData.notes || null,
      };
      
      await apiRequest("PUT", `/api/financial-products/${editingProduct!.id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      toast({
        title: "تم تحديث المنتج",
        description: "تم تحديث المنتج بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/financial-products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-products"] });
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنتج",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      sku: "",
      category: "",
      costPrice: "",
      sellingPrice: "",
      shippingCost: "",
      promotionCost: "",
      initialStock: "",
      currentStock: "",
      targetQuantity: "",
      targetRevenue: "",
      notes: "",
      isActive: true,
    });
  };

  const handleEdit = (product: FinancialProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameAr: product.nameAr,
      sku: product.sku || "",
      category: product.category || "",
      costPrice: product.costPrice || "",
      sellingPrice: product.sellingPrice || "",
      shippingCost: product.shippingCost || "",
      promotionCost: product.promotionCost || "",
      initialStock: product.initialStock?.toString() || "",
      currentStock: product.currentStock?.toString() || "",
      targetQuantity: product.targetQuantity?.toString() || "",
      targetRevenue: product.targetRevenue || "",
      notes: product.notes || "",
      isActive: product.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nameAr || !formData.costPrice || !formData.sellingPrice) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (editingProduct) {
      updateProductMutation.mutate(formData);
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const handleDelete = async (productId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "0";
    return parseFloat(value).toLocaleString('en-US');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">المنتجات المالية</h1>
                <p className="text-muted-foreground">إدارة المنتجات الخاصة بنظام التتبع المالي</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingProduct(null);
                resetForm();
                setIsDialogOpen(true);
              }}
              data-testid="button-add-financial-product"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة منتج مالي
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">إجمالي المنتجات</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">المنتجات النشطة</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">إجمالي المخزون</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {products.reduce((sum, p) => sum + (p.currentStock || 0), 0).toLocaleString('en-US')}
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">قيمة المخزون</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  products.reduce((sum, p) => {
                    const cost = parseFloat(p.costPrice || "0");
                    const stock = p.currentStock || 0;
                    return sum + (cost * stock);
                  }, 0).toString()
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المنتج</TableHead>
                <TableHead className="text-right">SKU / الفئة</TableHead>
                <TableHead className="text-right">سعر التكلفة</TableHead>
                <TableHead className="text-right">سعر البيع</TableHead>
                <TableHead className="text-right">المخزون الحالي</TableHead>
                <TableHead className="text-right">الربح المتوقع/قطعة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">لا توجد منتجات مالية</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setEditingProduct(null);
                        resetForm();
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة أول منتج مالي
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const costPrice = parseFloat(product.costPrice || "0");
                  const sellingPrice = parseFloat(product.sellingPrice || "0");
                  const shippingCost = parseFloat(product.shippingCost || "0");
                  const promotionCost = parseFloat(product.promotionCost || "0");
                  const profit = sellingPrice - (costPrice + shippingCost + promotionCost);
                  const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : "0";
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.nameAr}</p>
                          <p className="text-sm text-muted-foreground">{product.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {product.sku && (
                            <p className="text-sm font-mono">{product.sku}</p>
                          )}
                          {product.category && (
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product.costPrice)} د.ع
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(product.sellingPrice)} د.ع
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${product.currentStock! < 10 ? 'text-red-600' : 'text-green-600'}`}>
                          {product.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`font-medium ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(profit.toString())} د.ع
                          </p>
                          <p className="text-xs text-muted-foreground">{profitMargin}% هامش</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }`}
                        >
                          {product.isActive ? "نشط" : "غير نشط"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "تعديل منتج مالي" : "إضافة منتج مالي جديد"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">المعلومات الأساسية</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المنتج (عربي) *</Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: ساعة رولكس"
                    data-testid="input-name-ar"
                  />
                </div>

                <div className="space-y-2">
                  <Label>اسم المنتج (إنجليزي) *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Example: Rolex Watch"
                    data-testid="input-name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رمز المنتج (SKU)</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="مثال: WCH-001"
                    data-testid="input-sku"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="مثال: ساعات"
                    data-testid="input-category"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">التسعير والتكاليف</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>سعر التكلفة (د.ع) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-cost-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label>سعر البيع (د.ع) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-selling-price"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تكلفة الشحن/القطعة (د.ع)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-shipping-cost"
                  />
                </div>

                <div className="space-y-2">
                  <Label>تكلفة الترويج/القطعة (د.ع)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.promotionCost}
                    onChange={(e) => setFormData({ ...formData, promotionCost: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-promotion-cost"
                  />
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">المخزون</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المخزون الأولي *</Label>
                  <Input
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                    placeholder="0"
                    data-testid="input-initial-stock"
                  />
                </div>

                <div className="space-y-2">
                  <Label>المخزون الحالي</Label>
                  <Input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    placeholder={formData.initialStock || "0"}
                    data-testid="input-current-stock"
                  />
                </div>
              </div>
            </div>

            {/* Targets */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">الأهداف الشهرية</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>هدف الكمية (شهرياً)</Label>
                  <Input
                    type="number"
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: e.target.value })}
                    placeholder="0"
                    data-testid="input-target-quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>هدف الإيرادات (د.ع)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.targetRevenue}
                    onChange={(e) => setFormData({ ...formData, targetRevenue: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-target-revenue"
                  />
                </div>
              </div>
            </div>

            {/* Notes & Status */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أي ملاحظات إضافية..."
                  rows={3}
                  data-testid="input-notes"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Label htmlFor="is-active">المنتج نشط</Label>
                <Switch
                  id="is-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-is-active"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingProduct(null);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                data-testid="button-submit"
              >
                {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
