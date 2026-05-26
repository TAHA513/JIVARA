import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Image, Copy, Download, RefreshCw, Wand2, FileText, Upload, X, Link2, Trash2, Search, Package, Check } from "lucide-react";

interface ProductLite {
  id: number;
  name: string;
  nameAr: string;
  sku?: string | null;
  price?: string;
  images?: string[] | null;
  imagesData?: string[] | null;
}

const QUICK_PROMPTS = [
  { label: "جوارب بامبو", prompt: "Professional product advertisement photo for bamboo socks, dark elegant background, golden lighting, British premium style, sock box with 5 pairs displayed beautifully, text: 'Bamboo Socks' in gold, ultra realistic, 4K" },
  { label: "ساعة فاخرة", prompt: "Luxury watch advertisement photo, dark marble background, dramatic lighting, Iraqi market, premium watch close-up, bokeh effect, ultra realistic product photography" },
  { label: "عطر فاخر", prompt: "Luxury perfume bottle advertisement, dark royal background, golden particles, elegant Arabic style, premium fragrance photography, dramatic lighting, 4K ultra realistic" },
  { label: "منتج عام", prompt: "Premium e-commerce product advertisement, clean white background, professional studio lighting, Iraqi market, high quality product photography" },
];

export default function AiDesignerPage() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();

  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<{ url: string; revised_prompt: string }[]>([]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [variationImages, setVariationImages] = useState<{ url: string; prompt?: string }[]>([]);
  const [variationCount, setVariationCount] = useState(2);
  const [variationStyle, setVariationStyle] = useState("");
  const [analyzedPrompt, setAnalyzedPrompt] = useState("");

  // حالة نافذة ربط الصورة بمنتج
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkImageUrl, setLinkImageUrl] = useState<string | null>(null);
  const [linkImageSource, setLinkImageSource] = useState<"variation" | "generated" | null>(null);
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

  const attachMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId || !linkImageUrl) throw new Error("اختر منتجاً أولاً");
      const res = await apiRequest("POST", `/api/products/${selectedProductId}/attach-image`, {
        imageUrl: linkImageUrl,
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
      // إزالة الصورة من القائمة المصدر الصحيحة
      if (linkImageSource === "variation") {
        setVariationImages(prev => prev.filter(img => img.url !== linkImageUrl));
      } else if (linkImageSource === "generated") {
        setGeneratedImages(prev => prev.filter(img => img.url !== linkImageUrl));
      }
      setLinkDialogOpen(false);
      setSelectedProductId(null);
      setProductSearch("");
      setLinkImageUrl(null);
      setLinkImageSource(null);
      setMakeMain(false);
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  const openLinkDialog = (url: string, source: "variation" | "generated") => {
    setLinkImageUrl(url);
    setLinkImageSource(source);
    setSelectedProductId(null);
    setProductSearch("");
    setMakeMain(false);
    setLinkDialogOpen(true);
  };

  const removeVariation = (url: string) => {
    setVariationImages(prev => prev.filter(img => img.url !== url));
    toast({ title: "تم حذف الصورة من القائمة" });
  };

  const variationMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedFile) throw new Error("ارفع صورة أولاً");
      const form = new FormData();
      form.append("image", uploadedFile);
      form.append("n", String(variationCount));
      form.append("style", variationStyle);
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/ai/image-variations", {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data: any) => {
      setVariationImages(prev => [...data.images, ...prev]);
      if (data.analyzedPrompt) setAnalyzedPrompt(data.analyzedPrompt);
      toast({ title: `✅ تم توليد ${data.images.length} تصاميم!` });
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [features, setFeatures] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [copyType, setCopyType] = useState<"ad" | "description">("ad");

  const imageMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return apiRequest("POST", "/api/ai/generate-image", { prompt, size: "1024x1024" });
    },
    onSuccess: (data: any) => {
      setGeneratedImages(prev => [...data.images, ...prev]);
      toast({ title: "✅ تم توليد الصورة!" });
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  const copyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai/generate-copy", { productName, price, features, type: copyType });
    },
    onSuccess: (data: any) => {
      setGeneratedCopy(data.text);
      toast({ title: "✅ تم توليد النص!" });
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ!" });
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 overflow-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold arabic-text">المصمم بالذكاء الاصطناعي</h1>
            <p className="text-sm text-muted-foreground arabic-text">أنشئ صور ونصوص إعلانية احترافية بثوانٍ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* توليد الصور */}
          <div className="space-y-4">
            <Card className="border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Image className="w-5 h-5 text-purple-600" />
                  <h2 className="font-bold arabic-text">توليد صور إعلانية</h2>
                </div>

                {/* اختصارات سريعة */}
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2 arabic-text">اختر نوع المنتج بسرعة:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map(q => (
                      <button
                        key={q.label}
                        onClick={() => setImagePrompt(q.prompt)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors arabic-text"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="صف الصورة التي تريدها... (بالعربي أو الإنجليزي)"
                  rows={4}
                  className="mb-3 arabic-text"
                />

                <Button
                  onClick={() => imageMutation.mutate(imagePrompt)}
                  disabled={!imagePrompt.trim() || imageMutation.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  {imageMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> جاري التوليد (30-60 ثانية)...</>
                  ) : (
                    <><Wand2 className="w-4 h-4" /> ولّد الصورة</>
                  )}
                </Button>

                {imageMutation.isPending && (
                  <div className="mt-3 bg-purple-50 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-purple-700 arabic-text">الذكاء الاصطناعي يرسم الصورة...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الصور المولّدة */}
            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold arabic-text text-sm text-muted-foreground">الصور المولّدة ({generatedImages.length})</h3>
                {generatedImages.map((img, i) => (
                  <Card key={img.url} className="overflow-hidden">
                    <img src={img.url} alt={`صورة ${i+1}`} className="w-full object-cover" />
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">{img.revised_prompt}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={img.url}
                          download={`ai-design-${i+1}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md px-2 py-2 transition-colors arabic-text"
                        >
                          <Download className="w-3.5 h-3.5" /> حفظ
                        </a>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white arabic-text"
                          onClick={() => openLinkDialog(img.url, "generated")}
                        >
                          <Link2 className="w-3.5 h-3.5" /> ربط بمنتج
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs arabic-text text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setGeneratedImages(prev => prev.filter(g => g.url !== img.url))}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* رفع صورة وتوليد تنويعات */}
          <div className="space-y-4">
            <Card className="border-orange-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 arabic-text">رفع صورة وتوليد تصاميم مشابهة</h3>
                    <p className="text-xs text-gray-500 arabic-text">GPT-4 Vision يحلل صورتك ثم DALL-E 3 يولّد تصاميم احترافية مشابهة</p>
                  </div>
                </div>

                {/* منطقة الرفع */}
                <label
                  htmlFor="img-upload"
                  className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors mb-3 overflow-hidden"
                >
                  {uploadPreview ? (
                    <>
                      <img src={uploadPreview} alt="preview" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                      <div className="relative z-10 flex flex-col items-center">
                        <X className="w-5 h-5 text-orange-700 mb-1" />
                        <span className="text-xs text-orange-800 font-medium arabic-text">انقر لتغيير الصورة</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-orange-400 mb-1" />
                      <span className="text-sm text-orange-600 arabic-text">انقر لرفع صورة PNG/JPG</span>
                      <span className="text-xs text-orange-400 arabic-text">الحجم الأقصى 4MB</span>
                    </>
                  )}
                  <input id="img-upload" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
                </label>

                <Input
                  value={variationStyle}
                  onChange={e => setVariationStyle(e.target.value)}
                  placeholder="الأسلوب المطلوب (اختياري): مثلاً — خلفية بيضاء، إضاءة ذهبية، أسلوب فاخر..."
                  className="mb-3 arabic-text text-sm"
                />

                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-gray-600 arabic-text whitespace-nowrap">عدد التصاميم:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        onClick={() => setVariationCount(n)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold border transition-colors ${variationCount === n ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-700 border-gray-200 hover:border-orange-400"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 arabic-text">(كل تصميم ~30 ثانية)</span>
                </div>

                <Button
                  onClick={() => variationMutation.mutate()}
                  disabled={!uploadedFile || variationMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                >
                  {variationMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> جاري التوليد...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> ولّد التنويعات</>
                  )}
                </Button>

                {variationMutation.isPending && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-3 text-center">
                    <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-orange-700 arabic-text font-medium">جاري تحليل الصورة وتوليد التصاميم...</p>
                    <p className="text-xs text-orange-500 mt-1 arabic-text">الخطوة 1: GPT-4 Vision يحلل صورتك ← الخطوة 2: DALL-E 3 يولّد التصاميم</p>
                  </div>
                )}

                {analyzedPrompt && !variationMutation.isPending && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1 arabic-text font-medium">الوصف الذي حلّله الذكاء من صورتك:</p>
                    <p className="text-xs text-gray-600 leading-relaxed" dir="ltr">{analyzedPrompt.substring(0, 200)}...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* التنويعات المولّدة */}
            {variationImages.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 arabic-text text-sm">التنويعات المولّدة ({variationImages.length})</h4>
                {variationImages.map((img, i) => (
                  <Card key={img.url} className="border-orange-100 overflow-hidden">
                    <img src={img.url} alt={`variation-${i + 1}`} className="w-full" />
                    <CardContent className="p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <a
                          href={img.url}
                          download={`variation-${i + 1}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-md px-2 py-2 transition-colors arabic-text"
                        >
                          <Download className="w-3.5 h-3.5" /> حفظ
                        </a>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white arabic-text"
                          onClick={() => openLinkDialog(img.url, "variation")}
                        >
                          <Link2 className="w-3.5 h-3.5" /> ربط بمنتج
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs arabic-text text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => removeVariation(img.url)}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full gap-1.5 text-xs arabic-text text-gray-500 hover:text-gray-700"
                        onClick={() => copyToClipboard(img.url)}
                      >
                        <Copy className="w-3 h-3" /> نسخ الرابط
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* توليد النصوص */}
          <div className="space-y-4">
            <Card className="border-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="font-bold arabic-text">توليد نصوص إعلانية</h2>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setCopyType("ad")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors arabic-text ${copyType === "ad" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    نص إعلاني
                  </button>
                  <button
                    onClick={() => setCopyType("description")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors arabic-text ${copyType === "description" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    وصف منتج
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <Input
                    value={productName}
                    onChange={e => setProductName(e.target.value)}
                    placeholder="اسم المنتج (مثال: جوارب بامبو)"
                    className="arabic-text"
                  />
                  <Input
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="السعر (مثال: 45,000 دينار)"
                    className="arabic-text"
                  />
                  <Textarea
                    value={features}
                    onChange={e => setFeatures(e.target.value)}
                    placeholder="المميزات (مثال: ناعم، لا ينتج رائحة، بريطاني)"
                    rows={3}
                    className="arabic-text"
                  />
                </div>

                <Button
                  onClick={() => copyMutation.mutate()}
                  disabled={!productName.trim() || copyMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {copyMutation.isPending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> جاري الكتابة...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> ولّد النص</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* النص المولّد */}
            {generatedCopy && (
              <Card className="border-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold arabic-text">النص المولّد</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCopy)}
                      className="gap-1.5 text-xs arabic-text"
                    >
                      <Copy className="w-3.5 h-3.5" /> نسخ الكل
                    </Button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm arabic-text whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                    {generatedCopy}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* نصيحة */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <p className="text-xs text-amber-800 arabic-text font-semibold mb-1">💡 نصيحة الاستخدام</p>
                <p className="text-xs text-amber-700 arabic-text">
                  ولّد الصورة ← حمّلها ← أرفعها للحملة في فيسبوك. كل صورة فريدة ومصممة خصيصاً للإعلانات.
                </p>
              </CardContent>
            </Card>
          </div>
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
            {linkImageUrl && (
              <img src={linkImageUrl} alt="preview" className="w-24 h-24 object-cover rounded-lg border" />
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

          {/* قائمة المنتجات */}
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

          {/* خيار الصورة الرئيسية + زر التأكيد */}
          <div className="border-t pt-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={makeMain}
                onCheckedChange={v => setMakeMain(!!v)}
                id="make-main"
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
