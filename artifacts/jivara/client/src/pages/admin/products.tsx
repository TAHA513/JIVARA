import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { SimpleImageUploader } from "@/components/SimpleImageUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Search, Package } from "lucide-react";
import { useLocation } from "wouter";
import type { Product, Category } from "@shared/schema";

export default function AdminProducts() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    originalPrice: "",
    costPrice: "",
    shippingCost: "",
    promotionCost: "",
    marketingBudget: "",
    initialStock: "",
    targetQuantity: "",
    targetRevenue: "",
    categoryId: "",
    images: [""],
    sku: "",
    stock: "",
    isActive: true,
    isFeatured: false,
    showOnJadaf: false,
    tags: [""],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-open dialog when navigating to /admin/products/new
  useEffect(() => {
    if (location === '/admin/products/new') {
      setIsDialogOpen(true);
      setEditingProduct(null);
      resetForm();
      // Navigate to /admin/products to clean URL
      setLocation('/admin/products');
    }
  }, [location, setLocation]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const cleanedData = {
        ...productData,
        price: productData.price.toString(),
        originalPrice: productData.originalPrice ? productData.originalPrice.toString() : null,
        costPrice: productData.costPrice ? productData.costPrice.toString() : null,
        shippingCost: productData.shippingCost ? productData.shippingCost.toString() : null,
        promotionCost: productData.promotionCost ? productData.promotionCost.toString() : null,
        marketingBudget: productData.marketingBudget ? productData.marketingBudget.toString() : null,
        initialStock: productData.initialStock ? parseInt(productData.initialStock) : null,
        targetQuantity: productData.targetQuantity ? parseInt(productData.targetQuantity) : null,
        targetRevenue: productData.targetRevenue ? productData.targetRevenue.toString() : null,
        categoryId: parseInt(productData.categoryId),
        stock: parseInt(productData.stock),
        images: productData.images.filter((img: string) => img.trim() !== ""),
        tags: productData.tags.filter((tag: string) => tag.trim() !== ""),
      };
      
      console.log('Sending product data:', cleanedData);
      console.log('Product images array:', cleanedData.images);
      
      await apiRequest("POST", "/api/products", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "تم إنشاء المنتج",
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
        price: productData.price.toString(),
        originalPrice: productData.originalPrice ? productData.originalPrice.toString() : null,
        costPrice: productData.costPrice ? productData.costPrice.toString() : null,
        shippingCost: productData.shippingCost ? productData.shippingCost.toString() : null,
        promotionCost: productData.promotionCost ? productData.promotionCost.toString() : null,
        marketingBudget: productData.marketingBudget ? productData.marketingBudget.toString() : null,
        initialStock: productData.initialStock ? parseInt(productData.initialStock) : null,
        targetQuantity: productData.targetQuantity ? parseInt(productData.targetQuantity) : null,
        targetRevenue: productData.targetRevenue ? productData.targetRevenue.toString() : null,
        categoryId: parseInt(productData.categoryId),
        stock: parseInt(productData.stock),
        images: productData.images.filter((img: string) => img.trim() !== ""),
        tags: productData.tags.filter((tag: string) => tag.trim() !== ""),
      };
      
      console.log('Updating product data:', cleanedData);
      console.log('Product images array:', cleanedData.images);
      
      await apiRequest("PUT", `/api/products/${editingProduct!.id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
      description: "",
      descriptionAr: "",
      price: "",
      originalPrice: "",
      costPrice: "",
      shippingCost: "",
      promotionCost: "",
      marketingBudget: "",
      initialStock: "",
      targetQuantity: "",
      targetRevenue: "",
      categoryId: "",
      images: [""],
      sku: "",
      stock: "",
      isActive: true,
      isFeatured: false,
      showOnJadaf: false,
      tags: [""],
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      nameAr: product.nameAr,
      description: product.description || "",
      descriptionAr: product.descriptionAr || "",
      price: product.price,
      originalPrice: product.originalPrice || "",
      costPrice: product.costPrice || "",
      shippingCost: product.shippingCost || "",
      promotionCost: product.promotionCost || "",
      marketingBudget: product.marketingBudget || "",
      initialStock: product.initialStock?.toString() || "",
      targetQuantity: product.targetQuantity?.toString() || "",
      targetRevenue: product.targetRevenue || "",
      categoryId: product.categoryId?.toString() || "",
      images: product.images?.length ? product.images : [""],
      sku: product.sku || "",
      stock: product.stock?.toString() || "",
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      showOnJadaf: product.showOnJadaf ?? false,
      tags: product.tags?.length ? product.tags : [""],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار فئة للمنتج",
        variant: "destructive",
      });
      return;
    }

    // التحقق من وجود صور قبل الحفظ
    const hasImages = formData.images.some(img => img.trim() !== "");
    if (!hasImages) {
      toast({
        title: "تحذير",
        description: "لم يتم رفع أي صورة للمنتج. يمكنك المتابعة بدون صور أو رفع صورة أولاً.",
      });
    }

    console.log('Form data before submit:', formData);
    console.log('Images in form:', formData.images);

    if (editingProduct) {
      updateProductMutation.mutate(formData);
    } else {
      createProductMutation.mutate(formData);
    }
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ""]
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImageField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const addTagField = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, ""]
    }));
  };

  const removeTagField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateTagField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const filteredProducts = products.filter(product =>
    product.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold arabic-text">إدارة المنتجات</h1>
              <p className="text-muted-foreground arabic-text">
                إضافة وتعديل وحذف المنتجات
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white hover:bg-gray-100 text-black border border-gray-300" onClick={() => { resetForm(); setEditingProduct(null); }}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة منتج جديد
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <DialogHeader>
                  <DialogTitle className="arabic-text text-gray-900 dark:text-gray-100">
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 text-gray-900 dark:text-gray-100">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nameAr" className="arabic-text text-gray-900 dark:text-gray-100">الاسم بالعربية *</Label>
                      <Input
                        id="nameAr"
                        value={formData.nameAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                        placeholder="اسم المنتج بالعربية"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">الاسم بالإنجليزية *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Product name in English"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="descriptionAr" className="arabic-text text-gray-900 dark:text-gray-100">الوصف بالعربية</Label>
                      <Textarea
                        id="descriptionAr"
                        value={formData.descriptionAr}
                        onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                        placeholder="وصف المنتج بالعربية"
                        rows={3}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">الوصف بالإنجليزية</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Product description in English"
                        rows={3}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price" className="arabic-text text-gray-900 dark:text-gray-100">السعر (د.ع) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="السعر"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="originalPrice" className="arabic-text">السعر الأصلي (د.ع)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: e.target.value }))}
                        placeholder="السعر قبل التخفيض"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stock" className="arabic-text">الكمية *</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="الكمية المتوفرة"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* قسم البيانات المالية - خاص بالأدمن فقط */}
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-4 arabic-text text-blue-900 dark:text-blue-100">📊 البيانات المالية والأهداف</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="costPrice" className="arabic-text text-gray-900 dark:text-gray-100">سعر التكلفة/الشراء (د.ع)</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          step="0.01"
                          value={formData.costPrice}
                          onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                          placeholder="تكلفة شراء المنتج"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">المبلغ الذي تدفعه للحصول على المنتج</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="shippingCost" className="arabic-text">تكلفة التوصيل (د.ع/قطعة)</Label>
                        <Input
                          id="shippingCost"
                          type="number"
                          step="0.01"
                          value={formData.shippingCost}
                          onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                          placeholder="تكلفة توصيل القطعة الواحدة"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">تكلفة شحن/توصيل القطعة الواحدة</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="promotionCost" className="arabic-text">تكلفة الترويج (د.ع/قطعة)</Label>
                        <Input
                          id="promotionCost"
                          type="number"
                          step="0.01"
                          value={formData.promotionCost}
                          onChange={(e) => setFormData(prev => ({ ...prev, promotionCost: e.target.value }))}
                          placeholder="تكلفة إعلان القطعة الواحدة"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">تكلفة الإعلانات للقطعة الواحدة</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="marketingBudget" className="arabic-text">ميزانية التسويق الكلية (د.ع)</Label>
                        <Input
                          id="marketingBudget"
                          type="number"
                          step="0.01"
                          value={formData.marketingBudget}
                          onChange={(e) => setFormData(prev => ({ ...prev, marketingBudget: e.target.value }))}
                          placeholder="ميزانية الإعلانات الإجمالية"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">الميزانية الإجمالية للترويج</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="initialStock" className="arabic-text">المخزون الأولي (قطعة)</Label>
                        <Input
                          id="initialStock"
                          type="number"
                          value={formData.initialStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, initialStock: e.target.value }))}
                          placeholder="عدد القطع عند الإضافة"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">المخزون الأولي عند إضافة المنتج</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="targetQuantity" className="arabic-text">الهدف الشهري (قطعة)</Label>
                        <Input
                          id="targetQuantity"
                          type="number"
                          value={formData.targetQuantity}
                          onChange={(e) => setFormData(prev => ({ ...prev, targetQuantity: e.target.value }))}
                          placeholder="عدد القطع المستهدف بيعها"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">عدد القطع المراد بيعها شهرياً</p>
                      </div>
                      
                      <div>
                        <Label htmlFor="targetRevenue" className="arabic-text">الهدف المالي (د.ع)</Label>
                        <Input
                          id="targetRevenue"
                          type="number"
                          step="0.01"
                          value={formData.targetRevenue}
                          onChange={(e) => setFormData(prev => ({ ...prev, targetRevenue: e.target.value }))}
                          placeholder="الإيرادات المستهدفة شهرياً"
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground mt-1 arabic-text">الإيرادات المستهدفة من المنتج شهرياً</p>
                      </div>
                    </div>
                    
                    {formData.price && formData.costPrice && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                        <p className="text-sm font-semibold arabic-text text-green-900 dark:text-green-100">
                          💰 الربح المتوقع للقطعة: {(parseFloat(formData.price) - parseFloat(formData.costPrice)).toLocaleString()} د.ع
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoryId" className="arabic-text">الفئة *</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sku">رمز المنتج (SKU)</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="SKU123"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <Label className="arabic-text">صور المنتج</Label>
                    <div className="space-y-3 mt-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={image}
                              onChange={(e) => updateImageField(index, e.target.value)}
                              placeholder="رابط الصورة أو استخدم زر الرفع"
                              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                            />
                            {formData.images.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => removeImageField(index)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                حذف
                              </Button>
                            )}
                          </div>
                          
                          <SimpleImageUploader
                            maxFileSize={5 * 1024 * 1024}
                            buttonClassName="w-full"
                            onUploadComplete={(imagePath) => {
                              updateImageField(index, imagePath);
                            }}
                          >
                            <Plus className="h-4 w-4 ml-2" />
                            رفع صورة
                          </SimpleImageUploader>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        size="sm"
                        onClick={addImageField}
                        className="bg-white hover:bg-gray-100 text-black border border-gray-300"
                      >
                        إضافة حقل صورة جديد
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="arabic-text">العلامات (Tags)</Label>
                    <div className="space-y-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={tag}
                            onChange={(e) => updateTagField(index, e.target.value)}
                            placeholder="علامة"
                          />
                          {formData.tags.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => removeTagField(index)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              حذف
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        onClick={addTagField}
                        className="bg-white hover:bg-gray-100 text-black border border-gray-300"
                      >
                        إضافة علامة
                      </Button>
                    </div>
                  </div>

                  {/* Switches */}
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive" className="arabic-text">منتج نشط</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                      />
                      <Label htmlFor="isFeatured" className="arabic-text">منتج مميز</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showOnJadaf"
                        checked={formData.showOnJadaf}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnJadaf: checked }))}
                      />
                      <Label htmlFor="showOnJadaf" className="arabic-text">إظهار في صفحة جداف</Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {editingProduct ? "تحديث المنتج" : "إضافة المنتج"}
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setIsDialogOpen(false)}
                      className="bg-white hover:bg-gray-100 text-black border border-gray-300"
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="البحث في المنتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="text-sm text-muted-foreground arabic-text">
                  {filteredProducts.length} منتج
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">قائمة المنتجات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-muted-foreground arabic-text">جاري تحميل المنتجات...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 arabic-text">لا توجد منتجات</h3>
                  <p className="text-muted-foreground arabic-text">
                    {searchQuery ? "لم يتم العثور على منتجات مطابقة لبحثك" : "لم تتم إضافة أي منتجات بعد"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="arabic-text">الصورة</TableHead>
                      <TableHead className="arabic-text">اسم المنتج</TableHead>
                      <TableHead className="arabic-text">الفئة</TableHead>
                      <TableHead className="arabic-text">السعر</TableHead>
                      <TableHead className="arabic-text">الكمية</TableHead>
                      <TableHead className="arabic-text">الحالة</TableHead>
                      <TableHead className="arabic-text">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const category = categories.find(c => c.id === product.categoryId);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <img
                              src={product.images?.[0] || "/api/placeholder-image"}
                              alt={product.nameAr}
                              className="w-12 h-12 object-cover rounded-lg bg-gray-100 border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.src = "/api/placeholder-image";
                              }}
                              onLoad={() => {
                                console.log('Image loaded successfully:', product.images?.[0]);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium arabic-text">{product.nameAr}</p>
                              <p className="text-sm text-muted-foreground">{product.name}</p>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="arabic-text">{category?.nameAr || "غير محدد"}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold">{parseFloat(product.price).toLocaleString()} د.ع</p>
                              {product.originalPrice && (
                                <p className="text-sm text-muted-foreground line-through">
                                  {parseFloat(product.originalPrice).toLocaleString()} د.ع
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={product.stock === 0 ? "text-red-600" : "text-green-600"}>
                              {product.stock || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {product.isActive ? (
                                <Badge variant="secondary">نشط</Badge>
                              ) : (
                                <Badge variant="outline">غير نشط</Badge>
                              )}
                              {product.isFeatured && (
                                <Badge>مميز</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEdit(product)}
                                className="bg-white hover:bg-gray-100 text-black border border-gray-300"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                className="bg-red-500 hover:bg-red-600 text-white border border-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
