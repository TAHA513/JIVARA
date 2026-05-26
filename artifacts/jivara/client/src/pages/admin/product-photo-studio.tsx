import { useState, useMemo, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Camera, Upload, Link2, Trash2, Search, Package, Check,
  RefreshCw, Image as ImageIcon, X
} from "lucide-react";

interface ProductLite {
  id: number;
  name: string;
  nameAr: string;
  sku?: string | null;
  price?: string;
  images?: string[] | null;
  imagesData?: string[] | null;
}

interface StudioImage {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export default function ProductPhotoStudio() {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<StudioImage[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // حالة نافذة الربط
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkImage, setLinkImage] = useState<StudioImage | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [makeMain, setMakeMain] = useState(false);

  const productsQuery = useQuery<ProductLite[]>({
    queryKey: ["/api/products"],
    enabled: linkDialogOpen,
  });

  const filteredProducts = useMemo(() => {
    const list = productsQuery.data || [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return list.slice(0, 50);
    return list.filter(p =>
      p.nameAr?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      String(p.id).includes(q)
    ).slice(0, 50);
  }, [productsQuery.data, productSearch]);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const accepted: StudioImage[] = [];
    for (const f of arr) {
      if (!f.type.startsWith("image/")) {
        toast({ title: "ملف غير مدعوم", description: `${f.name} ليس صورة`, variant: "destructive" });
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast({ title: "حجم كبير", description: `${f.name} يتجاوز 8MB`, variant: "destructive" });
        continue;
      }
      try {
        const dataUrl = await fileToDataUrl(f);
        accepted.push({
          id: Math.random().toString(36).slice(2),
          dataUrl,
          name: f.name,
          size: f.size,
        });
      } catch {
        toast({ title: "خطأ", description: `تعذر قراءة ${f.name}`, variant: "destructive" });
      }
    }
    if (accepted.length) {
      setImages(prev => [...accepted, ...prev]);
      toast({ title: `✅ تم رفع ${accepted.length} صورة` });
    }
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(i => i.id !== id));
  };

  const openLinkDialog = (img: StudioImage) => {
    setLinkImage(img);
    setSelectedProductId(null);
    setProductSearch("");
    setMakeMain(false);
    setLinkDialogOpen(true);
  };

  const attachMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId || !linkImage) throw new Error("اختر منتجاً أولاً");
      const res = await apiRequest("POST", `/api/products/${selectedProductId}/attach-image`, {
        imageUrl: linkImage.dataUrl,
        makeMain,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const p = data?.product;
      toast({
        title: "✅ تم ربط الصورة",
        description: `أُضيفت إلى منتج: ${p?.nameAr || p?.name || "—"} (إجمالي ${data?.totalImages ?? "?"} صورة${data?.isMain ? " — رئيسية" : ""})`,
      });
      if (linkImage) removeImage(linkImage.id);
      setLinkDialogOpen(false);
      setLinkImage(null);
      setSelectedProductId(null);
      setProductSearch("");
      setMakeMain(false);
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="arabic-text">يجب تسجيل الدخول للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />

      <div className="flex-1 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#C9A14A] flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold arabic-text">استديو صور المنتجات</h1>
            </div>
            <p className="text-sm text-gray-500 arabic-text">
              ارفع صور المنتجات من جهازك واربطها مباشرة بأي منتج موجود في المتجر.
            </p>
          </div>

          {/* Upload Zone */}
          <Card
            className={`border-2 border-dashed transition-colors mb-6 ${
              dragOver ? "border-[#C9A14A] bg-amber-50" : "border-gray-300 bg-white"
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <CardContent className="p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="arabic-text font-medium mb-1">اسحب الصور هنا أو اضغط للاختيار</p>
              <p className="text-xs text-gray-500 arabic-text mb-4">
                JPG / PNG / WebP — حتى 8MB لكل صورة — يمكن اختيار عدة صور
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFileInput}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#C9A14A] hover:bg-[#b58d3a] gap-2 arabic-text"
              >
                <Upload className="w-4 h-4" /> اختيار صور
              </Button>
            </CardContent>
          </Card>

          {/* Images Grid */}
          {images.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="arabic-text">لم ترفع أي صور بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold arabic-text">
                  الصور المرفوعة ({images.length})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImages([])}
                  className="text-red-600 hover:bg-red-50 arabic-text gap-1.5"
                >
                  <X className="w-4 h-4" /> مسح الكل
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map(img => (
                  <Card key={img.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs text-gray-500 truncate" dir="ltr">
                        {img.name} · {(img.size / 1024).toFixed(0)}KB
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white arabic-text"
                          onClick={() => openLinkDialog(img)}
                        >
                          <Link2 className="w-3.5 h-3.5" /> ربط بمنتج
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs arabic-text text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => removeImage(img.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة ربط الصورة بمنتج */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-600" />
              ربط الصورة بمنتج
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 items-start">
            {linkImage && (
              <img src={linkImage.dataUrl} alt="preview" className="w-24 h-24 object-cover rounded-lg border" />
            )}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الكود (SKU) أو الرقم..."
                  className="pr-10 arabic-text"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 arabic-text">
                {productsQuery.isLoading
                  ? "جاري تحميل المنتجات..."
                  : `${filteredProducts.length} منتج${filteredProducts.length === 50 ? " (أول 50 فقط — ابحث لتصفية أكثر)" : ""}`}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg divide-y">
            {filteredProducts.length === 0 && !productsQuery.isLoading && (
              <div className="text-center py-8 text-gray-400 arabic-text text-sm">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                لا توجد منتجات مطابقة
              </div>
            )}
            {filteredProducts.map(p => {
              const isSelected = selectedProductId === p.id;
              const thumb = p.imagesData?.[0] || p.images?.[0];
              const hasImages = (p.images?.length || 0) > 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full flex items-center gap-3 p-3 text-right hover:bg-gray-50 transition-colors ${isSelected ? "bg-emerald-50" : ""}`}
                >
                  <div className="w-12 h-12 rounded-md bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm arabic-text truncate">{p.nameAr || p.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      {p.sku && <span className="font-mono">{p.sku}</span>}
                      <span>#{p.id}</span>
                      <span>•</span>
                      <span className={hasImages ? "text-gray-500" : "text-orange-600 font-medium"}>
                        {hasImages ? `${p.images!.length} صورة` : "بدون صور"}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t pt-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={makeMain}
                onCheckedChange={v => setMakeMain(!!v)}
                id="make-main-studio"
              />
              <span className="text-sm arabic-text">اجعلها الصورة الرئيسية للمنتج</span>
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLinkDialogOpen(false)}
                className="arabic-text"
              >
                إلغاء
              </Button>
              <Button
                onClick={() => attachMutation.mutate()}
                disabled={!selectedProductId || attachMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2 arabic-text"
              >
                {attachMutation.isPending ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الإضافة...</>
                ) : (
                  <><Check className="w-4 h-4" /> إضافة الصورة للمنتج</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
