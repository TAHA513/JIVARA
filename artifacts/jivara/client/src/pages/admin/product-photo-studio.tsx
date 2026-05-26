import { useState, useMemo, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Camera, Upload, Link2, Trash2, Search, Package, Check,
  RefreshCw, Image as ImageIcon, X, Scissors, Stamp, Settings, Store as StoreIcon, Plus, Wand2, Layers
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
  processing?: "bg" | "watermark" | null;
  history?: string[]; // dataUrls سابقة للتراجع
}

interface StoreLogo {
  id: string;
  name: string;
  dataUrl: string;
}

type WatermarkPos = "br" | "bl" | "tr" | "tl" | "center";

const MAX_BYTES = 8 * 1024 * 1024;
const LS_LOGOS_KEY = "jivara_studio_store_logos_v1";

function dataUrlBytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  if (i < 0) return 0;
  const b64 = dataUrl.slice(i + 1);
  return Math.floor((b64.length * 3) / 4);
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function applyWatermark(
  imageDataUrl: string,
  logoDataUrl: string,
  opts: { position: WatermarkPos; opacity: number; scale: number }
): Promise<string> {
  const [base, logo] = await Promise.all([
    loadImageFromUrl(imageDataUrl),
    loadImageFromUrl(logoDataUrl),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = base.naturalWidth;
  canvas.height = base.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas غير متاح");
  ctx.drawImage(base, 0, 0);

  const targetW = Math.max(40, Math.round(canvas.width * opts.scale));
  const ratio = logo.naturalWidth ? targetW / logo.naturalWidth : 1;
  const targetH = Math.round(logo.naturalHeight * ratio);
  const pad = Math.round(Math.min(canvas.width, canvas.height) * 0.02);

  let x = pad, y = pad;
  switch (opts.position) {
    case "br": x = canvas.width - targetW - pad; y = canvas.height - targetH - pad; break;
    case "bl": x = pad; y = canvas.height - targetH - pad; break;
    case "tr": x = canvas.width - targetW - pad; y = pad; break;
    case "tl": x = pad; y = pad; break;
    case "center":
      x = Math.round((canvas.width - targetW) / 2);
      y = Math.round((canvas.height - targetH) / 2);
      break;
  }

  ctx.globalAlpha = opts.opacity;
  ctx.drawImage(logo, x, y, targetW, targetH);
  ctx.globalAlpha = 1;

  // PNG للحفاظ على شفافية الخلفية إذا كانت موجودة
  return canvas.toDataURL("image/png");
}

export default function ProductPhotoStudio() {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<StudioImage[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // إعدادات شعارات المتاجر
  const [logos, setLogos] = useState<StoreLogo[]>(() => {
    try {
      const raw = localStorage.getItem(LS_LOGOS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  useEffect(() => {
    try { localStorage.setItem(LS_LOGOS_KEY, JSON.stringify(logos)); } catch {}
  }, [logos]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newLogoName, setNewLogoName] = useState("");

  // نافذة العلامة المائية
  const [wmOpen, setWmOpen] = useState(false);
  const [wmImage, setWmImage] = useState<StudioImage | null>(null);
  const [wmLogoId, setWmLogoId] = useState<string>("");
  const [wmPos, setWmPos] = useState<WatermarkPos>("br");
  const [wmOpacity, setWmOpacity] = useState(0.85);
  const [wmScale, setWmScale] = useState(0.22);
  const [wmPreview, setWmPreview] = useState<string>("");
  const [wmBusy, setWmBusy] = useState(false);

  // نافذة الربط
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

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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
          dataUrl, name: f.name, size: f.size, history: [],
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
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const updateImage = (id: string, patch: Partial<StudioImage> | ((s: StudioImage) => StudioImage)) => {
    setImages(prev => prev.map(i => {
      if (i.id !== id) return i;
      return typeof patch === "function" ? patch(i) : { ...i, ...patch };
    }));
  };

  const removeImage = (id: string) => setImages(prev => prev.filter(i => i.id !== id));

  const undoLast = (id: string) => {
    setImages(prev => prev.map(i => {
      if (i.id !== id) return i;
      const hist = i.history || [];
      if (!hist.length) return i;
      const prevUrl = hist[hist.length - 1];
      return {
        ...i,
        dataUrl: prevUrl,
        size: dataUrlBytes(prevUrl),
        history: hist.slice(0, -1),
      };
    }));
  };

  // إزالة الخلفية في المتصفح
  const removeBackground = async (img: StudioImage) => {
    updateImage(img.id, { processing: "bg" });
    toast({ title: "جاري إزالة الخلفية...", description: "قد يستغرق التحميل أول مرة دقيقة" });
    try {
      const mod = await import("@imgly/background-removal");
      const blob = await mod.removeBackground(img.dataUrl);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      updateImage(img.id, prev => ({
        ...prev,
        dataUrl,
        size: dataUrlBytes(dataUrl),
        processing: null,
        history: [...(prev.history || []), prev.dataUrl],
        name: prev.name.replace(/\.(jpg|jpeg|webp)$/i, ".png"),
      }));
      toast({ title: "✅ تمت إزالة الخلفية" });
    } catch (e: any) {
      updateImage(img.id, { processing: null });
      toast({ title: "فشلت إزالة الخلفية", description: e.message || "خطأ غير معروف", variant: "destructive" });
    }
  };

  // تبييض الخلفية: إزالة الخلفية ثم تعبئتها بالأبيض
  const makeWhiteBackground = async (img: StudioImage) => {
    updateImage(img.id, { processing: "bg" });
    toast({ title: "جاري تبييض الخلفية...", description: "قد يستغرق التحميل أول مرة دقيقة" });
    try {
      // الخطوة 1: إزالة الخلفية
      const mod = await import("@imgly/background-removal");
      const blob = await mod.removeBackground(img.dataUrl);
      const transparentUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      // الخطوة 2: تعبئة خلفية بيضاء بـ canvas
      const whiteUrl = await new Promise<string>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.93));
        };
        image.onerror = reject;
        image.src = transparentUrl;
      });
      updateImage(img.id, prev => ({
        ...prev,
        dataUrl: whiteUrl,
        size: dataUrlBytes(whiteUrl),
        processing: null,
        history: [...(prev.history || []), prev.dataUrl],
        name: prev.name.replace(/\.(jpg|jpeg|webp|png)$/i, "_white.jpg"),
      }));
      toast({ title: "✅ تمت معالجة الصورة بخلفية بيضاء" });
    } catch (e: any) {
      updateImage(img.id, { processing: null });
      toast({ title: "فشل التبييض", description: e.message || "خطأ غير معروف", variant: "destructive" });
    }
  };

  // معالجة كل الصور دفعة واحدة — بدون AI (browser)
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  const processAllWhiteBg = async () => {
    const toProcess = images.filter(img => !img.processing);
    if (!toProcess.length) return;
    setBatchProcessing(true);
    setBatchProgress({ done: 0, total: toProcess.length });
    toast({ title: `جاري معالجة ${toProcess.length} صورة...`, description: "سيتم تبييض الخلفية لكل الصور تلقائياً" });
    let done = 0;
    for (const img of toProcess) {
      await makeWhiteBackground(img);
      done++;
      setBatchProgress({ done, total: toProcess.length });
    }
    setBatchProcessing(false);
    setBatchProgress({ done: 0, total: 0 });
    toast({ title: `✅ تمت معالجة ${toProcess.length} صورة بنجاح` });
  };

  // معالجة بـ AI (gpt-image-1) — دفعة واحدة مرسلة للسيرفر
  const [aiProcessing, setAiProcessing] = useState(false);

  const processAllWithAI = async () => {
    const toProcess = images.filter(img => !img.processing);
    if (!toProcess.length) return;
    if (toProcess.length > 20) {
      toast({ title: "الحد الأقصى 20 صورة في الدفعة", variant: "destructive" });
      return;
    }
    setAiProcessing(true);
    toast({
      title: `🤖 جاري الإرسال لـ AI...`,
      description: `${toProcess.length} صورة — قد يستغرق 1-3 دقائق`,
    });

    // ضع كل الصور في حالة "معالجة"
    toProcess.forEach(img => updateImage(img.id, { processing: "bg" }));

    try {
      const res = await fetch("/api/ai/white-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: toProcess.map(img => ({ id: img.id, dataUrl: img.dataUrl })),
        }),
      });
      const data = await res.json() as { results: Array<{ id: string; dataUrl?: string; success: boolean; error?: string }> };

      if (!res.ok) {
        throw new Error((data as any).error || "خطأ في الإرسال");
      }

      let success = 0, failed = 0;
      for (const result of data.results) {
        if (result.success && result.dataUrl) {
          updateImage(result.id, prev => ({
            ...prev,
            dataUrl: result.dataUrl!,
            size: dataUrlBytes(result.dataUrl!),
            processing: null,
            history: [...(prev.history || []), prev.dataUrl],
            name: prev.name.replace(/\.(jpg|jpeg|webp|png)$/i, "_ai_white.png"),
          }));
          success++;
        } else {
          updateImage(result.id, { processing: null });
          failed++;
        }
      }

      toast({
        title: `✅ AI انتهى: ${success} نجحت${failed ? `، ${failed} فشلت` : ""}`,
        description: "الصور جاهزة — اربطها بالمنتجات",
      });
    } catch (e: any) {
      toProcess.forEach(img => updateImage(img.id, { processing: null }));
      toast({ title: "فشل AI", description: e.message, variant: "destructive" });
    } finally {
      setAiProcessing(false);
    }
  };

  // فتح نافذة العلامة المائية
  const openWatermark = (img: StudioImage) => {
    if (!logos.length) {
      toast({
        title: "لا توجد شعارات",
        description: "أضف شعار متجر من الإعدادات أولاً",
        variant: "destructive",
      });
      setSettingsOpen(true);
      return;
    }
    setWmImage(img);
    setWmLogoId(logos[0].id);
    setWmPos("br");
    setWmOpacity(0.85);
    setWmScale(0.22);
    setWmPreview("");
    setWmOpen(true);
  };

  // معاينة مباشرة في النافذة
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!wmOpen || !wmImage || !wmLogoId) return;
      const logo = logos.find(l => l.id === wmLogoId);
      if (!logo) return;
      try {
        const out = await applyWatermark(wmImage.dataUrl, logo.dataUrl, {
          position: wmPos, opacity: wmOpacity, scale: wmScale,
        });
        if (!cancelled) setWmPreview(out);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [wmOpen, wmImage, wmLogoId, wmPos, wmOpacity, wmScale, logos]);

  const confirmWatermark = async () => {
    if (!wmImage || !wmPreview) return;
    setWmBusy(true);
    try {
      updateImage(wmImage.id, prev => ({
        ...prev,
        dataUrl: wmPreview,
        size: dataUrlBytes(wmPreview),
        history: [...(prev.history || []), prev.dataUrl],
      }));
      toast({ title: "✅ تمت إضافة العلامة المائية" });
      setWmOpen(false);
      setWmImage(null);
      setWmPreview("");
    } finally {
      setWmBusy(false);
    }
  };

  // إضافة شعار متجر
  const onAddLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (logoFileRef.current) logoFileRef.current.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "يجب أن يكون صورة", variant: "destructive" });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      toast({ title: "الشعار كبير", description: "حتى 2MB فقط", variant: "destructive" });
      return;
    }
    const name = newLogoName.trim() || `متجر ${logos.length + 1}`;
    const dataUrl = await fileToDataUrl(f);
    setLogos(prev => [...prev, { id: Math.random().toString(36).slice(2), name, dataUrl }]);
    setNewLogoName("");
    toast({ title: `✅ تم حفظ شعار "${name}"` });
  };
  const removeLogo = (id: string) => setLogos(prev => prev.filter(l => l.id !== id));

  // الربط بمنتج
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
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
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
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#C9A14A] flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold arabic-text">استديو صور المنتجات</h1>
              </div>
              <p className="text-sm text-gray-500 arabic-text">
                ارفع الصور، عالجها (إزالة خلفية، علامة مائية)، ثم اربطها بالمنتج عندما تكون جاهزة.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="gap-2 arabic-text"
            >
              <Settings className="w-4 h-4" />
              شعارات المتاجر ({logos.length})
            </Button>
          </div>

          {/* Upload */}
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
                ref={fileInputRef} type="file" accept="image/*" multiple
                onChange={onFileInput} className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#C9A14A] hover:bg-[#b58d3a] gap-2 arabic-text"
              >
                <Upload className="w-4 h-4" /> اختيار صور
              </Button>
            </CardContent>
          </Card>

          {/* Grid */}
          {images.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="arabic-text">لم ترفع أي صور بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h2 className="font-semibold arabic-text">الصور المرفوعة ({images.length})</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    disabled={aiProcessing || batchProcessing}
                    onClick={processAllWithAI}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 arabic-text text-xs"
                  >
                    {aiProcessing ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> AI يعالج...</>
                    ) : (
                      <><Wand2 className="w-3.5 h-3.5" /> تبييض بـ AI ✨ (الكل)</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    disabled={batchProcessing || aiProcessing}
                    onClick={processAllWhiteBg}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 arabic-text text-xs"
                  >
                    {batchProcessing ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {batchProgress.done}/{batchProgress.total}</>
                    ) : (
                      <><Layers className="w-3.5 h-3.5" /> تبييض عادي (الكل)</>
                    )}
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setImages([])}
                    className="text-red-600 hover:bg-red-50 arabic-text gap-1.5"
                  >
                    <X className="w-4 h-4" /> مسح الكل
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map(img => (
                  <Card key={img.id} className="overflow-hidden">
                    <div className="aspect-square bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><rect width=%2210%22 height=%2210%22 fill=%22%23e5e7eb%22/><rect x=%2210%22 y=%2210%22 width=%2210%22 height=%2210%22 fill=%22%23e5e7eb%22/></svg>')] overflow-hidden relative">
                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-contain" />
                      {img.processing && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm arabic-text gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          {img.processing === "bg" ? "إزالة الخلفية..." : "جاري المعالجة..."}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs text-gray-500 truncate flex items-center justify-between gap-2" dir="ltr">
                        <span className="truncate">{img.name}</span>
                        <span className="flex-shrink-0">{(img.size / 1024).toFixed(0)}KB</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          disabled={!!img.processing}
                          onClick={() => makeWhiteBackground(img)}
                          className="gap-1.5 text-xs arabic-text bg-emerald-600 hover:bg-emerald-700 text-white col-span-2"
                        >
                          {img.processing === "bg" ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري التبييض...</>
                          ) : (
                            <><Wand2 className="w-3.5 h-3.5" /> خلفية بيضاء ✨</>
                          )}
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          disabled={!!img.processing}
                          onClick={() => removeBackground(img)}
                          className="gap-1.5 text-xs arabic-text border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <Scissors className="w-3.5 h-3.5" /> شفافة
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          disabled={!!img.processing}
                          onClick={() => openWatermark(img)}
                          className="gap-1.5 text-xs arabic-text border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Stamp className="w-3.5 h-3.5" /> علامة
                        </Button>
                      </div>

                      {(img.history && img.history.length > 0) && (
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => undoLast(img.id)}
                          className="w-full gap-1.5 text-xs arabic-text text-gray-600"
                        >
                          ↶ تراجع آخر تعديل ({img.history.length})
                        </Button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white arabic-text"
                          onClick={() => openLinkDialog(img)}
                          disabled={!!img.processing}
                        >
                          <Link2 className="w-3.5 h-3.5" /> ربط بمنتج
                        </Button>
                        <Button
                          size="sm" variant="outline"
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

      {/* إعدادات الشعارات */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text flex items-center gap-2">
              <StoreIcon className="w-5 h-5 text-[#C9A14A]" />
              شعارات المتاجر للعلامة المائية
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 arabic-text">
            أضف شعار كل متجر (يفضّل PNG شفاف). الشعارات محفوظة في متصفحك فقط.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logos.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4 arabic-text">لا توجد شعارات بعد</p>
            )}
            {logos.map(l => (
              <div key={l.id} className="flex items-center gap-3 border rounded-lg p-2">
                <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img src={l.dataUrl} alt={l.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 font-medium arabic-text text-sm">{l.name}</div>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => removeLogo(l.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-2">
            <Input
              placeholder="اسم المتجر (مثال: JIVARA)"
              value={newLogoName}
              onChange={e => setNewLogoName(e.target.value)}
              className="arabic-text"
            />
            <input
              ref={logoFileRef} type="file" accept="image/*"
              onChange={onAddLogo} className="hidden"
            />
            <Button
              onClick={() => logoFileRef.current?.click()}
              className="w-full bg-[#C9A14A] hover:bg-[#b58d3a] gap-2 arabic-text"
            >
              <Plus className="w-4 h-4" /> رفع شعار متجر
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة العلامة المائية */}
      <Dialog open={wmOpen} onOpenChange={setWmOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text flex items-center gap-2">
              <Stamp className="w-5 h-5 text-blue-600" /> إضافة علامة مائية
            </DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
              {wmPreview ? (
                <img src={wmPreview} alt="preview" className="max-w-full max-h-full object-contain" />
              ) : wmImage ? (
                <img src={wmImage.dataUrl} alt="" className="max-w-full max-h-full object-contain opacity-60" />
              ) : null}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium arabic-text block mb-2">المتجر / الشعار</label>
                <div className="grid grid-cols-2 gap-2">
                  {logos.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setWmLogoId(l.id)}
                      className={`flex items-center gap-2 border rounded-lg p-2 text-right ${
                        wmLogoId === l.id ? "border-[#C9A14A] bg-amber-50" : "border-gray-200"
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        <img src={l.dataUrl} alt="" className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-xs arabic-text truncate flex-1">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium arabic-text block mb-2">الموقع</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs arabic-text">
                  {([
                    ["tl", "↖ أعلى يسار"], ["tr", "↗ أعلى يمين"], ["center", "● وسط"],
                    ["bl", "↙ أسفل يسار"], ["br", "↘ أسفل يمين"],
                  ] as [WatermarkPos, string][]).map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setWmPos(k)}
                      className={`border rounded p-2 ${wmPos === k ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium arabic-text flex justify-between mb-2">
                  <span>الحجم</span>
                  <span className="text-gray-500">{Math.round(wmScale * 100)}%</span>
                </label>
                <Slider
                  value={[wmScale * 100]}
                  onValueChange={v => setWmScale(v[0] / 100)}
                  min={5} max={60} step={1}
                />
              </div>

              <div>
                <label className="text-sm font-medium arabic-text flex justify-between mb-2">
                  <span>الشفافية</span>
                  <span className="text-gray-500">{Math.round(wmOpacity * 100)}%</span>
                </label>
                <Slider
                  value={[wmOpacity * 100]}
                  onValueChange={v => setWmOpacity(v[0] / 100)}
                  min={10} max={100} step={1}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setWmOpen(false)} className="arabic-text">إلغاء</Button>
            <Button
              onClick={confirmWatermark}
              disabled={!wmPreview || wmBusy}
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 arabic-text"
            >
              <Check className="w-4 h-4" /> تطبيق العلامة على الصورة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* نافذة ربط الصورة بمنتج */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="arabic-text flex items-center gap-2">
              <Link2 className="w-5 h-5 text-emerald-600" /> ربط الصورة بمنتج
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
                  key={p.id} type="button"
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
              <Checkbox checked={makeMain} onCheckedChange={v => setMakeMain(!!v)} id="make-main-studio" />
              <span className="text-sm arabic-text">اجعلها الصورة الرئيسية للمنتج</span>
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)} className="arabic-text">إلغاء</Button>
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
