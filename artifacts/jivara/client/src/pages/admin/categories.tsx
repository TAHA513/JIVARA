import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import AdminSidebar from "@/components/admin/sidebar";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface CategoryFormData {
  name: string;
  nameAr: string;
  slug: string;
  description?: string;
  descriptionAr?: string;
}

export default function AdminCategories() {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    nameAr: "",
    slug: "",
    description: "",
    descriptionAr: "",
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated,
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => 
      apiRequest("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الفئة الجديدة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "حدث خطأ أثناء إضافة الفئة",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryFormData }) =>
      apiRequest(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: "تم بنجاح",
        description: "تم تحديث الفئة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "حدث خطأ أثناء تحديث الفئة",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الفئة بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error?.message || "حدث خطأ أثناء حذف الفئة",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      slug: "",
      description: "",
      descriptionAr: "",
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.nameAr.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الفئة باللغتين العربية والإنجليزية",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      nameAr: category.nameAr,
      slug: category.slug,
      description: category.description || "",
      descriptionAr: category.descriptionAr || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 p-4 lg:p-8 lg:mr-64">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 arabic-text">إدارة الفئات</h1>
              <p className="text-gray-600 arabic-text">إضافة وإدارة فئات المنتجات</p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 arabic-text" data-testid="button-add-category">
                  <Plus className="w-4 h-4" />
                  إضافة فئة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="arabic-text">إضافة فئة جديدة</DialogTitle>
                  <DialogDescription className="arabic-text">
                    أدخل تفاصيل الفئة الجديدة
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="arabic-text">الاسم (English)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Category Name"
                      data-testid="input-category-name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="nameAr" className="arabic-text">الاسم (العربية)</Label>
                    <Input
                      id="nameAr"
                      value={formData.nameAr}
                      onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                      placeholder="اسم الفئة بالعربية"
                      className="text-right"
                      data-testid="input-category-name-ar"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug" className="arabic-text">الرمز (Slug)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="category-slug"
                      data-testid="input-category-slug"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="arabic-text">الوصف (English)</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Category description"
                      data-testid="input-category-description"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="descriptionAr" className="arabic-text">الوصف (العربية)</Label>
                    <Input
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                      placeholder="وصف الفئة بالعربية"
                      className="text-right"
                      data-testid="input-category-description-ar"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                      className="arabic-text"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="arabic-text"
                      data-testid="button-submit-category"
                    >
                      {createMutation.isPending ? "جاري الإضافة..." : "إضافة الفئة"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories List */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">الفئات الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600 arabic-text">جاري تحميل الفئات...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 arabic-text">لا توجد فئات مُضافة بعد</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 arabic-text" data-testid={`text-category-name-ar-${category.id}`}>
                              {category.nameAr}
                            </h3>
                            <p className="text-sm text-gray-600">{category.name}</p>
                            <p className="text-xs text-gray-400 mt-1">/{category.slug}</p>
                          </div>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                        
                        {(category.descriptionAr || category.description) && (
                          <p className="text-sm text-gray-600 arabic-text mb-3 line-clamp-2">
                            {category.descriptionAr || category.description}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="flex-1 gap-1 arabic-text"
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Edit className="w-3 h-3" />
                            تعديل
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1 arabic-text text-destructive hover:text-destructive"
                                data-testid={`button-delete-category-${category.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                                حذف
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="arabic-text">
                                  تأكيد حذف الفئة
                                </AlertDialogTitle>
                                <AlertDialogDescription className="arabic-text">
                                  هل أنت متأكد من حذف فئة "{category.nameAr}"؟ 
                                  هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="arabic-text">إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(category.id)}
                                  className="bg-destructive hover:bg-destructive/90 arabic-text"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="arabic-text">تعديل الفئة</DialogTitle>
            <DialogDescription className="arabic-text">
              تعديل تفاصيل الفئة
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="arabic-text">الاسم (English)</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category Name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-nameAr" className="arabic-text">الاسم (العربية)</Label>
              <Input
                id="edit-nameAr"
                value={formData.nameAr}
                onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                placeholder="اسم الفئة بالعربية"
                className="text-right"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-slug" className="arabic-text">الرمز (Slug)</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description" className="arabic-text">الوصف (English)</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Category description"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-descriptionAr" className="arabic-text">الوصف (العربية)</Label>
              <Input
                id="edit-descriptionAr"
                value={formData.descriptionAr}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionAr: e.target.value }))}
                placeholder="وصف الفئة بالعربية"
                className="text-right"
              />
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingCategory(null);
                  resetForm();
                }}
                className="arabic-text"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="arabic-text"
              >
                {updateMutation.isPending ? "جاري التحديث..." : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}