import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Camera, X, CheckCircle2, Package, Loader2, Plus, Image as ImageIcon } from "lucide-react";

interface Category { id: number; nameAr: string; name: string; }

export default function SupplierPage() {
  const { toast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/supplier/categories"],
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("nameAr", nameAr);
      fd.append("price", price);
      if (costPrice) fd.append("costPrice", costPrice);
      fd.append("stock", stock);
      if (categoryId && !showNewCategory) fd.append("categoryId", categoryId);
      if (showNewCategory && newCategoryName.trim()) fd.append("newCategoryName", newCategoryName.trim());
      if (supplierName) fd.append("supplierName", supplierName);
      if (supplierPhone) fd.append("supplierPhone", supplierPhone);
      images.forEach(img => fd.append("images", img));

      const res = await fetch("/api/supplier/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطأ");
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      toast({ title: "✓ تم إضافة المنتج بنجاح", description: "ظهر في المتجر مباشرة" });
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - images.length);
    const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < newFiles.length) {
      toast({ title: "تنبيه", description: "بعض الصور أكبر من 5MB وتم تجاهلها", variant: "destructive" });
    }
    setImages(prev => [...prev, ...validFiles].slice(0, 5));
    validFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(p => [...p, e.target?.result as string].slice(0, 5));
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setImages([]); setPreviews([]); setNameAr(""); setPrice(""); setCostPrice("");
    setStock(""); setCategoryId(""); setNewCategoryName(""); setShowNewCategory(false); setSuccess(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">تم بنجاح!</h2>
          <p className="text-gray-600">منتجك ظهر بالمتجر مباشرة</p>
          <Button onClick={reset} className="w-full bg-[#1B2D5E] hover:bg-[#142348] text-white h-12">
            <Plus className="w-5 h-5 ml-2" /> أضف منتج آخر
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Header */}
      <div className="bg-[#1B2D5E] text-white p-5 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Package className="w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold">إضافة منتج</h1>
            <p className="text-xs opacity-80">سيظهر في المتجر مباشرة</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Images */}
        <Card className="p-4">
          <Label className="text-base font-bold mb-3 block">صور المنتج <span className="text-red-500">*</span></Label>
          <p className="text-xs text-gray-500 mb-3">من 1 إلى 5 صور (أقصى 5MB لكل صورة)</p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#1B2D5E]">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 left-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"
                  type="button"
                  data-testid={`button-remove-image-${i}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {images.length < 5 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => galleryRef.current?.click()}
                type="button"
                className="h-12 border-2 border-[#1B2D5E] text-[#1B2D5E] rounded-lg flex items-center justify-center gap-2 font-bold text-sm hover:bg-[#1B2D5E] hover:text-white transition-colors"
                data-testid="button-gallery"
              >
                <ImageIcon className="w-5 h-5" />
                من الألبوم
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                type="button"
                className="h-12 border-2 border-[#1B2D5E] text-[#1B2D5E] rounded-lg flex items-center justify-center gap-2 font-bold text-sm hover:bg-[#1B2D5E] hover:text-white transition-colors"
                data-testid="button-camera"
              >
                <Camera className="w-5 h-5" />
                التقاط صورة
              </button>
            </div>
          )}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            data-testid="input-gallery"
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
            data-testid="input-camera"
          />
        </Card>

        {/* Product Info */}
        <Card className="p-4 space-y-4">
          <div>
            <Label htmlFor="name" className="text-base font-bold">اسم المنتج <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={nameAr}
              onChange={e => setNameAr(e.target.value)}
              placeholder="مثال: سماعة بلوتوث ألوان"
              className="h-12 text-base mt-2"
              data-testid="input-name"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="cat" className="text-base font-bold">الفئة</Label>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(!showNewCategory);
                  setCategoryId("");
                  setNewCategoryName("");
                }}
                className="text-xs bg-[#1B2D5E] text-white px-3 py-1.5 rounded-full font-bold"
                data-testid="button-toggle-category"
              >
                {showNewCategory ? "← اختر من الموجود" : "+ فئة جديدة"}
              </button>
            </div>
            {!showNewCategory ? (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12 text-base" data-testid="select-category">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nameAr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="اكتب اسم الفئة الجديدة (مثال: قبعات)"
                className="h-12 text-base"
                data-testid="input-new-category"
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price" className="text-base font-bold">سعر البيع <span className="text-red-500">*</span></Label>
              <div className="relative mt-2">
                <Input
                  id="price"
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="25000"
                  className="h-12 text-base pe-12"
                  data-testid="input-price"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">د.ع</span>
              </div>
            </div>
            <div>
              <Label htmlFor="cost" className="text-base font-bold">سعر الشراء</Label>
              <div className="relative mt-2">
                <Input
                  id="cost"
                  type="number"
                  inputMode="numeric"
                  value={costPrice}
                  onChange={e => setCostPrice(e.target.value)}
                  placeholder="15000"
                  className="h-12 text-base pe-12"
                  data-testid="input-cost"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">د.ع</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="stock" className="text-base font-bold">العدد المتوفر <span className="text-red-500">*</span></Label>
            <Input
              id="stock"
              type="number"
              inputMode="numeric"
              value={stock}
              onChange={e => setStock(e.target.value)}
              placeholder="10"
              className="h-12 text-base mt-2"
              data-testid="input-stock"
            />
          </div>
        </Card>

        {/* Supplier info (optional) */}
        <Card className="p-4 space-y-4">
          <p className="text-sm text-gray-500 font-bold">معلوماتك (اختياري):</p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              placeholder="اسمك"
              className="h-11"
              data-testid="input-supplier-name"
            />
            <Input
              value={supplierPhone}
              onChange={e => setSupplierPhone(e.target.value)}
              placeholder="رقمك"
              className="h-11"
              type="tel"
              data-testid="input-supplier-phone"
            />
          </div>
        </Card>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !nameAr || !price || !stock || images.length === 0}
          className="w-full h-14 text-lg font-bold bg-[#1B2D5E] hover:bg-[#142348] text-white"
          data-testid="button-submit"
        >
          {submitMutation.isPending ? (
            <><Loader2 className="w-5 h-5 ml-2 animate-spin" /> جاري الإضافة...</>
          ) : (
            <><CheckCircle2 className="w-5 h-5 ml-2" /> إضافة المنتج</>
          )}
        </Button>
      </div>
    </div>
  );
}
