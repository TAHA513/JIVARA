import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Search, Link2, ExternalLink, TrendingUp, Package, Footprints, Store, Leaf, Watch, Baby, Crown } from "lucide-react";
import type { Product } from "@shared/schema";

export default function CampaignLinks() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [bundleCopied, setBundleCopied] = useState(false);
  const [shoesCopied, setShoesCopied] = useState(false);
  const [shoesBCopied, setShoesBCopied] = useState(false);
  const [shopCopied, setShopCopied] = useState(false);
  const [bambooCopied, setBambooCopied] = useState(false);
  const [shoesEasyCopied, setShoesEasyCopied] = useState(false);
  const [watchesCopied, setWatchesCopied] = useState(false);
  const [watchesBCopied, setWatchesBCopied] = useState(false);
  const [nwCopied, setNwCopied] = useState(false);
  const [nw2Copied, setNw2Copied] = useState(false);
  const [kneePadCopied, setKneePadCopied] = useState(false);
  const [beltCopied, setBeltCopied] = useState(false);
  const [boxerMenCopied, setBoxerMenCopied] = useState(false);
  const [packCopied, setPackCopied] = useState(false);
  const [socksPackCopied, setSocksPackCopied] = useState(false);
  const [bambooSocksCopied, setBambooSocksCopied] = useState(false);
  const [mamameCopied, setMamameCopied] = useState(false);
  const [socksUaeCopied, setSocksUaeCopied] = useState(false);
  const [socksIqCopied, setSocksIqCopied] = useState(false);
  const [zt2Copied, setZt2Copied] = useState(false);
  const [kneePadQCopied, setKneePadQCopied] = useState(false);
  const [poedagarCopied, setPoedagarCopied] = useState(false);
  const [jadafCopied, setJadafCopied] = useState(false);
  const [sunglassesCopied, setSunglassesCopied] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }
  if (!isAuthenticated) return null;

  const baseUrl = window.location.origin;

  const filteredProducts = products.filter(p =>
    p.nameAr?.includes(search) ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.includes(search)
  );

  const copyLink = (productId: number) => {
    const link = `${baseUrl}/buy/${productId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(productId);
      toast({ title: "تم النسخ!", description: "الرابط جاهز للصق في حملتك" });
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const copyBundleLink = () => {
    const link = `${baseUrl}/bundle`;
    navigator.clipboard.writeText(link).then(() => {
      setBundleCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة المجموعة جاهز" });
      setTimeout(() => setBundleCopied(false), 2000);
    });
  };

  const copyShoesLink = () => {
    const link = `${baseUrl}/bundle-shoes`;
    navigator.clipboard.writeText(link).then(() => {
      setShoesCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة الأحذية جاهز" });
      setTimeout(() => setShoesCopied(false), 2000);
    });
  };

  const copyShoesBLink = () => {
    const link = `${baseUrl}/shoes-b`;
    navigator.clipboard.writeText(link).then(() => {
      setShoesBCopied(true);
      toast({ title: "تم النسخ!", description: "رابط الأحذية (نسخة ب) جاهز" });
      setTimeout(() => setShoesBCopied(false), 2000);
    });
  };

  const copyShopLink = () => {
    const link = `${baseUrl}/shop`;
    navigator.clipboard.writeText(link).then(() => {
      setShopCopied(true);
      toast({ title: "تم النسخ!", description: "رابط المتجر الكامل جاهز" });
      setTimeout(() => setShopCopied(false), 2000);
    });
  };

  const copyShoesEasyLink = () => {
    const link = `${baseUrl}/shoes-easy`;
    navigator.clipboard.writeText(link).then(() => {
      setShoesEasyCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة الحذاء المبسطة جاهز" });
      setTimeout(() => setShoesEasyCopied(false), 2000);
    });
  };

  const copyBambooLink = () => {
    const link = `${baseUrl}/bamboo`;
    navigator.clipboard.writeText(link).then(() => {
      setBambooCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة جواريب Bamboo جاهز" });
      setTimeout(() => setBambooCopied(false), 2000);
    });
  };

  const copyMamameLink = () => {
    const link = `${baseUrl}/mamame`;
    navigator.clipboard.writeText(link).then(() => {
      setMamameCopied(true);
      toast({ title: "تم النسخ!", description: "رابط متجر الأطفال جاهز" });
      setTimeout(() => setMamameCopied(false), 2000);
    });
  };

  const copyJadafLink = () => {
    const link = `${baseUrl}/jadaf`;
    navigator.clipboard.writeText(link).then(() => {
      setJadafCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة JADAF الفاخرة جاهز" });
      setTimeout(() => setJadafCopied(false), 2000);
    });
  };

  const copySunglassesLink = () => {
    const link = `${baseUrl}/sunglasses`;
    navigator.clipboard.writeText(link).then(() => {
      setSunglassesCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة النظارات الفاخرة جاهز" });
      setTimeout(() => setSunglassesCopied(false), 2000);
    });
  };

  const copyWatchesLink = () => {
    const link = `${baseUrl}/watches-easy`;
    navigator.clipboard.writeText(link).then(() => {
      setWatchesCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة الساعات الفاخرة جاهز" });
      setTimeout(() => setWatchesCopied(false), 2000);
    });
  };

  const copyWatchesBLink = () => {
    const link = `${baseUrl}/watches-b`;
    navigator.clipboard.writeText(link).then(() => {
      setWatchesBCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة الساعات (نسخة ب) جاهز" });
      setTimeout(() => setWatchesBCopied(false), 2000);
    });
  };

  const copyNaturalWalkerLink = () => {
    const link = `${baseUrl}/naturalwalker`;
    navigator.clipboard.writeText(link).then(() => {
      setNwCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة NATURALWALKER جاهز" });
      setTimeout(() => setNwCopied(false), 2000);
    });
  };

  const copyNaturalWalker2Link = () => {
    const link = `${baseUrl}/naturalwalker2`;
    navigator.clipboard.writeText(link).then(() => {
      setNw2Copied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة NATURALWALKER (نسخة ٢) جاهز" });
      setTimeout(() => setNw2Copied(false), 2000);
    });
  };

  const copyKneePadLink = () => {
    const link = `${baseUrl}/knee-pad`;
    navigator.clipboard.writeText(link).then(() => {
      setKneePadCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة واقي الركبة جاهز" });
      setTimeout(() => setKneePadCopied(false), 2000);
    });
  };

  const copyBeltLink = () => {
    const link = `${baseUrl}/bullcaptain-belt`;
    navigator.clipboard.writeText(link).then(() => {
      setBeltCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة حزام BULLCAPTAIN جاهز" });
      setTimeout(() => setBeltCopied(false), 2000);
    });
  };

  const copyBoxerMenLink = () => {
    const link = `${baseUrl}/boxer-men`;
    navigator.clipboard.writeText(link).then(() => {
      setBoxerMenCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة بوكسر رجالي جاهز" });
      setTimeout(() => setBoxerMenCopied(false), 2000);
    });
  };

  const copyPackLink = () => {
    const link = `${baseUrl}/pack`;
    navigator.clipboard.writeText(link).then(() => {
      setPackCopied(true);
      toast({ title: "تم النسخ!", description: "رابط بكج الجواريب + البوكسر جاهز" });
      setTimeout(() => setPackCopied(false), 2000);
    });
  };

  const copyBambooSocksLink = () => {
    const link = `${baseUrl}/bamboo-socks`;
    navigator.clipboard.writeText(link).then(() => {
      setBambooSocksCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة جواريب بامبو البوكس جاهز" });
      setTimeout(() => setBambooSocksCopied(false), 2000);
    });
  };

  const copySocksPackLink = () => {
    const link = `${baseUrl}/socks-pack`;
    navigator.clipboard.writeText(link).then(() => {
      setSocksPackCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة الجواريب الـ 4 موديلات جاهز" });
      setTimeout(() => setSocksPackCopied(false), 2000);
    });
  };

  const copySocksUaeLink = () => {
    const link = `${baseUrl}/socks-uae`;
    navigator.clipboard.writeText(link).then(() => {
      setSocksUaeCopied(true);
      toast({ title: "Link copied!", description: "رابط صفحة الجواريب للإمارات جاهز" });
      setTimeout(() => setSocksUaeCopied(false), 2000);
    });
  };

  const copySocksIqLink = () => {
    const link = `${baseUrl}/socks-iq`;
    navigator.clipboard.writeText(link).then(() => {
      setSocksIqCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة جوارب بامبو العراق جاهز" });
      setTimeout(() => setSocksIqCopied(false), 2000);
    });
  };

  const copyZt2Link = () => {
    const link = `${baseUrl}/zt2`;
    navigator.clipboard.writeText(link).then(() => {
      setZt2Copied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة جوارب بامبو ZT (نسخة جديدة) جاهز" });
      setTimeout(() => setZt2Copied(false), 2000);
    });
  };

  const copyKneePadQLink = () => {
    const link = `${baseUrl}/knee-pad-q`;
    navigator.clipboard.writeText(link).then(() => {
      setKneePadQCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة واقي الركبة (TikTok) جاهز" });
      setTimeout(() => setKneePadQCopied(false), 2000);
    });
  };

  const copyPoedagarLink = () => {
    const link = `${baseUrl}/poedagar-watch`;
    navigator.clipboard.writeText(link).then(() => {
      setPoedagarCopied(true);
      toast({ title: "تم النسخ!", description: "رابط صفحة ساعة POEDAGAR جاهز" });
      setTimeout(() => setPoedagarCopied(false), 2000);
    });
  };

  const openLink = (productId: number) => {
    window.open(`${baseUrl}/buy/${productId}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      <AdminSidebar />

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold arabic-text">روابط الحملات</h1>
              <p className="text-sm text-muted-foreground arabic-text">انسخ رابط أي منتج مباشرةً لحملاتك الإعلانية</p>
            </div>
          </div>
        </div>

        {/* شرح الاستخدام */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-3">
          <Link2 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 arabic-text">كيف تستخدم الروابط؟</p>
            <p className="text-xs text-amber-700 arabic-text mt-0.5">
              كل رابط يفتح صفحة هبوط مخصصة للمنتج — الزبون يشوف المنتج ويكمل الطلب مباشرة بدون تصفح. مثالي لحملات تيك توك وانستقرام.
            </p>
          </div>
        </div>

        {/* رابط صفحة المجموعة */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-muted-foreground arabic-text mb-2 uppercase tracking-wide">صفحة المجموعة</p>
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-purple-900">صفحة المجموعة</p>
                  <p className="text-xs text-purple-600 arabic-text mt-0.5">تعرض مجموعة منتجات في صفحة هبوط واحدة</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/bundle
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyBundleLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${bundleCopied ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
                  >
                    {bundleCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/bundle`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-purple-300 text-purple-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط المتجر الكامل */}
        <div className="mb-5">
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Store className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-emerald-900">صفحة المتجر الكامل</p>
                  <p className="text-xs text-emerald-600 arabic-text mt-0.5">جميع المنتجات في صفحة واحدة + بانر كود الخصم</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/shop
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyShopLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${shopCopied ? "bg-green-600 hover:bg-green-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                  >
                    {shopCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/shop`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-emerald-300 text-emerald-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الأحذية — نسخة أ */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground arabic-text mb-2 uppercase tracking-wide">صفحة الأحذية الإيطالية</p>
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Footprints className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-amber-900">أحذية إيطالية — نسخة أ</p>
                  <p className="text-xs text-amber-600 arabic-text mt-0.5">للإعلانات المدفوعة | ٣٥,٠٠٠ د.ع</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/bundle-shoes
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyShoesLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${shoesCopied ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}
                  >
                    {shoesCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/bundle-shoes`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-amber-300 text-amber-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الأحذية — نسخة ب */}
        <div className="mb-5">
          <Card className="border-2 border-lime-300 bg-lime-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-lime-100 flex items-center justify-center shrink-0">
                  <Footprints className="w-6 h-6 text-lime-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-lime-900">أحذية إيطالية — نسخة ب</p>
                  <p className="text-xs text-lime-700 arabic-text mt-0.5">رابط بديل — واتساب، تيك توك، بايو</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/shoes-b
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyShoesBLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${shoesBCopied ? "bg-green-600 hover:bg-green-700" : "bg-lime-600 hover:bg-lime-700"}`}
                  >
                    {shoesBCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/shoes-b`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-lime-300 text-lime-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الأحذية المبسطة */}
        <div className="mb-5">
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <Footprints className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-orange-900">صفحة الحذاء المبسطة ✨</p>
                  <p className="text-xs text-orange-600 arabic-text mt-0.5">خط كبير واضح | بدون واتس | سهلة للجميع</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/shoes-easy
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyShoesEasyLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${shoesEasyCopied ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
                  >
                    {shoesEasyCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/shoes-easy`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-orange-300 text-orange-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط متجر الأطفال — Mamame */}
        <div className="mb-5">
          <Card className="border-2 border-pink-200 bg-pink-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                  <Baby className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-pink-900">متجر الأطفال 🍼</p>
                  <p className="text-xs text-pink-600 arabic-text mt-0.5">صفحة متجر للأطفال والرضع | رئيسية + أقسام + سلة</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/mamame
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyMamameLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${mamameCopied ? "bg-green-600 hover:bg-green-700" : "bg-pink-600 hover:bg-pink-700"} text-white`}
                  >
                    {mamameCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/mamame`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-pink-300 text-pink-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة JADAF — جداف الفاخرة */}
        <div className="mb-5">
          <Card className="border-2 bg-gradient-to-br from-zinc-900 to-black" style={{ borderColor: "rgba(212,175,55,0.45)" }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F2C76E, #D4AF37, #9C7428)" }}>
                  <Crown className="w-6 h-6 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text" style={{ color: "#F2C76E", letterSpacing: "1.5px" }}>JADAF • جداف 👑</p>
                  <p className="text-xs arabic-text mt-0.5" style={{ color: "#D4AF37" }}>صفحة فاخرة | ساعات • عطور • نظارات • خدمات</p>
                  <p className="text-xs mt-1 truncate font-mono" dir="ltr" style={{ color: "#B8B8B8" }}>
                    {baseUrl}/jadaf
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyJadafLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 text-black font-bold ${jadafCopied ? "opacity-90" : ""}`}
                    style={{ background: "linear-gradient(135deg, #F2C76E, #D4AF37, #9C7428)" }}
                  >
                    {jadafCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/jadaf`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5"
                    style={{ borderColor: "rgba(212,175,55,0.45)", color: "#F2C76E", background: "transparent" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة النظارات الفاخرة */}
        <div className="mb-5">
          <Card className="border-2 bg-gradient-to-br from-zinc-900 to-black" style={{ borderColor: "rgba(192,192,192,0.45)" }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 text-2xl" style={{ background: "linear-gradient(135deg,#555,#111)" }}>
                  🕶️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text" style={{ color: "#E0E0E0", letterSpacing: "1.5px" }}>SUNGLASSES · نظارات فاخرة 🕶️</p>
                  <p className="text-xs arabic-text mt-0.5" style={{ color: "#A0A0A0" }}>Police · Dior · Maybach · Ray-Ban | 45,000 د.ع</p>
                  <p className="text-xs mt-1 truncate font-mono" dir="ltr" style={{ color: "#B8B8B8" }}>
                    {baseUrl}/sunglasses
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copySunglassesLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 text-white font-bold ${sunglassesCopied ? "bg-green-600 hover:bg-green-700" : "bg-zinc-600 hover:bg-zinc-700"}`}
                  >
                    {sunglassesCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/sunglasses`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5"
                    style={{ borderColor: "rgba(192,192,192,0.45)", color: "#E0E0E0", background: "transparent" }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة جواريب Bamboo */}
        <div className="mb-5">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-green-900">جواريب Bamboo البريطانية 🌿</p>
                  <p className="text-xs text-green-600 arabic-text mt-0.5">صفحة هبوط مخصصة | ٥ أزواج بـ ٢٥,٠٠٠ د.ع</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/bamboo
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyBambooLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${bambooCopied ? "bg-green-600 hover:bg-green-700" : "bg-green-700 hover:bg-green-800"}`}
                  >
                    {bambooCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/bamboo`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-green-300 text-green-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الساعات الفاخرة — نسخة أ */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground arabic-text mb-2 uppercase tracking-wide">صفحة الساعات الفاخرة</p>
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Watch className="w-6 h-6 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-amber-900">ساعات فاخرة — نسخة أ ⌚</p>
                  <p className="text-xs text-amber-700 arabic-text mt-0.5">للإعلانات المدفوعة | ١٠٠,٠٠٠ د.ع</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/watches-easy
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyWatchesLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${watchesCopied ? "bg-amber-600 hover:bg-amber-700" : "bg-amber-700 hover:bg-amber-800"}`}
                  >
                    {watchesCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/watches-easy`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-amber-300 text-amber-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الساعات — نسخة ب */}
        <div className="mb-5">
          <Card className="border-2 border-yellow-300 bg-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-yellow-100 flex items-center justify-center shrink-0">
                  <Watch className="w-6 h-6 text-yellow-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-yellow-900">ساعات فاخرة — نسخة ب ⌚</p>
                  <p className="text-xs text-yellow-700 arabic-text mt-0.5">رابط بديل لمكان آخر | ١٠٠,٠٠٠ د.ع</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/watches-b
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyWatchesBLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${watchesBCopied ? "bg-yellow-600 hover:bg-yellow-700" : "bg-yellow-600 hover:bg-yellow-700"}`}
                  >
                    {watchesBCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/watches-b`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-yellow-300 text-yellow-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة NATURALWALKER */}
        <div className="mb-5">
          <Card className="border-2 border-slate-400 bg-slate-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-2xl">
                  🇬🇧
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-slate-900">NATURALWALKER — قبّعات بريطانية 🧢</p>
                  <p className="text-xs text-slate-600 arabic-text mt-0.5">٢٠ ألف — ٦٠ ألف د.ع | ٤ خيارات ألوان</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/naturalwalker
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyNaturalWalkerLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${nwCopied ? "bg-slate-700 hover:bg-slate-800" : "bg-slate-700 hover:bg-slate-800"}`}
                  >
                    {nwCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/naturalwalker`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-slate-300 text-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة NATURALWALKER نسخة 2 */}
        <div className="mb-5">
          <Card className="border-2 border-slate-400 bg-slate-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-2xl">
                  🧢
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-slate-900">NATURALWALKER — نسخة ٢ (صور جديدة)</p>
                  <p className="text-xs text-slate-600 arabic-text mt-0.5">٢٠ ألف — ٦٠ ألف د.ع | ٤ خيارات ألوان</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/naturalwalker2
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyNaturalWalker2Link}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${nw2Copied ? "bg-slate-700 hover:bg-slate-800" : "bg-slate-700 hover:bg-slate-800"}`}
                  >
                    {nw2Copied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/naturalwalker2`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-slate-300 text-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة واقي الركبة */}
        <div className="mb-5">
          <Card className="border-2 border-pink-400 bg-pink-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-pink-100 flex items-center justify-center shrink-0 text-2xl">
                  🛡️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-pink-900">واقي ركبة للأطفال — الأنبار 🎨</p>
                  <p className="text-xs text-pink-600 arabic-text mt-0.5">٢٥,٠٠٠ د.ع | ٥ أزواج ملونة | دفع عند الاستلام</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/knee-pad
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyKneePadLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${kneePadCopied ? "bg-pink-700 hover:bg-pink-800" : "bg-pink-600 hover:bg-pink-700"}`}
                  >
                    {kneePadCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/knee-pad`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-pink-300 text-pink-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة واقي الركبة — نسخة TikTok السريعة */}
        <div className="mb-5">
          <Card className="border-2 border-violet-500 bg-gradient-to-br from-violet-50 to-pink-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 text-2xl">
                  🛡️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm arabic-text text-violet-900">واقي ركبة للأطفال — نسخة TikTok ⚡</p>
                    <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded">TikTok</span>
                  </div>
                  <p className="text-xs text-violet-700 arabic-text mt-0.5">٢٥,٠٠٠ د.ع | ٥ أزواج | صفحة سريعة | بدون رأس أو ذيل</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/knee-pad-q
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyKneePadQLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${kneePadQCopied ? "bg-violet-700 hover:bg-violet-800" : "bg-violet-600 hover:bg-violet-700"}`}
                  >
                    {kneePadQCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/knee-pad-q`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-violet-300 text-violet-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة ساعة POEDAGAR — سنتر المستودع */}
        <div className="mb-5">
          <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-500 flex items-center justify-center shrink-0 text-2xl">
                  ⌚
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm arabic-text text-amber-900">ساعة POEDAGAR — سنتر المستودع</p>
                    <span className="bg-amber-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded">Facebook</span>
                  </div>
                  <p className="text-xs text-amber-700 arabic-text mt-0.5">٥٥ الف د.ع | ٥ ألوان | ضد الماء 30م | الرمادي</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/poedagar-watch
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyPoedagarLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${poedagarCopied ? "bg-amber-800 hover:bg-amber-900" : "bg-amber-600 hover:bg-amber-700"}`}
                  >
                    {poedagarCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/poedagar-watch`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-amber-300 text-amber-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط بكج الجواريب + البوكسر — العرض الجديد */}
        <div className="mb-5">
          <Card className="border-2 border-[#1B2D5E] bg-gradient-to-br from-blue-50 via-yellow-50 to-blue-50 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#1B2D5E] flex items-center justify-center shrink-0 text-2xl shadow">
                  🎁
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm arabic-text text-[#1B2D5E]">بكج جواريب بامبو + بوكسر إيطالي 🆕</p>
                    <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">-50%</span>
                  </div>
                  <p className="text-xs text-[#1B2D5E] arabic-text font-semibold mt-0.5">٥٠,٠٠٠ د.ع بدل ١٠٠,٠٠٠ | ٥ جواريب + ٤ بوكسر | فري سايز جواريب · ٤ قياسات بوكسر</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/pack
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyPackLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${packCopied ? "bg-green-600 hover:bg-green-700" : "bg-[#1B2D5E] hover:bg-[#152348]"} text-white`}
                  >
                    {packCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/pack`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-[#1B2D5E] text-[#1B2D5E]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الجواريب 4 موديلات */}
        <div className="mb-5">
          <Card className="border-2 border-[#1B2D5E] bg-gradient-to-r from-[#1B2D5E]/5 to-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-[#1B2D5E] flex items-center justify-center shrink-0 text-2xl shadow">
                  🧦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm arabic-text text-[#1B2D5E]">جواريب بامبو — ٤ موديلات 🇬🇧</p>
                    <span className="bg-green-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">وفّر ١٧K</span>
                  </div>
                  <p className="text-xs text-[#1B2D5E] arabic-text font-semibold mt-0.5">٢٥K بوكس واحد | ٤٧K بوكسين | ٦٧K ثلاثة | ٨٣K الأربعة كاملين</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/socks-pack
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copySocksPackLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${socksPackCopied ? "bg-green-600 hover:bg-green-700" : "bg-[#1B2D5E] hover:bg-[#152348]"} text-white`}
                  >
                    {socksPackCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/socks-pack`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-[#1B2D5E] text-[#1B2D5E]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة جواريب بامبو — بوكس واحد */}
        <div className="mb-5">
          <Card className="border-2 border-green-700 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-green-700 flex items-center justify-center shrink-0 text-2xl shadow">
                  🎁
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-sm arabic-text text-green-800">جواريب بامبو — بوكس ٥ أزواج 🇬🇧</p>
                    <span className="bg-green-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">جديد</span>
                  </div>
                  <p className="text-xs text-green-700 arabic-text font-semibold mt-0.5">٢٥ ألف شامل التوصيل | بوكس واحد = ٥ أزواج | فري سايز | الدفع عند الاستلام</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/bamboo-socks
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyBambooSocksLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${bambooSocksCopied ? "bg-green-600 hover:bg-green-700" : "bg-green-700 hover:bg-green-800"} text-white`}
                  >
                    {bambooSocksCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/bamboo-socks`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-green-700 text-green-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة حزام BULLCAPTAIN */}
        <div className="mb-5">
          <Card className="border-2 border-amber-700 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-2xl">
                  🐂
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-amber-900">حزام BULLCAPTAIN جلد طبيعي 🇬🇧</p>
                  <p className="text-xs text-amber-700 arabic-text mt-0.5">٢٥,٠٠٠ د.ع + ٥ آلاف توصيل لكل العراق | لونين: عسلي وأسود | هدية فاخرة</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/bullcaptain-belt
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyBeltLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${beltCopied ? "bg-amber-800 hover:bg-amber-900" : "bg-amber-700 hover:bg-amber-800"}`}
                  >
                    {beltCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/bullcaptain-belt`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-amber-400 text-amber-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة بوكسر رجالي */}
        <div className="mb-5">
          <Card className="border-2 border-blue-400 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-2xl">
                  🩲
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-blue-900">بوكسر رجالي إيطالي 🇮🇹</p>
                  <p className="text-xs text-blue-700 arabic-text mt-0.5">٤٥,٠٠٠ د.ع | GOODLUCK × MEN Premium | ٤ قطع</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/boxer-men
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyBoxerMenLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${boxerMenCopied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {boxerMenCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/boxer-men`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-blue-300 text-blue-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رابط صفحة الجواريب — للإمارات (إنكليزي) */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground arabic-text mb-2 uppercase tracking-wide">صفحات الإعلانات الدولية 🌍</p>
          <Card className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 text-2xl text-white font-black shadow">
                  🇦🇪
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-amber-900">Premium Socks — UAE 🇦🇪 (English)</p>
                  <p className="text-xs text-amber-700 arabic-text mt-0.5">٤ موديلات | 65 AED + 14 AED شحن | خلال 72 ساعة للإمارات</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/socks-uae
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copySocksUaeLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${socksUaeCopied ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}
                  >
                    {socksUaeCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/socks-uae`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-amber-300 text-amber-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* رابط صفحة جوارب بامبو العراق */}
          <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 text-2xl text-white font-black shadow">
                  🧦
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-blue-900">جوارب بامبو البريطانية 🇬🇧 — العراق</p>
                  <p className="text-xs text-blue-700 arabic-text mt-0.5">5 أزواج | 25,000 د.ع شامل التوصيل | دفع عند الاستلام | تأكيد واتساب</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/socks-iq
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copySocksIqLink}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${socksIqCopied ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {socksIqCopied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/socks-iq`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-blue-300 text-blue-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* رابط صفحة جوارب بامبو ZT2 */}
          <Card className="border-amber-200 bg-amber-50/60">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-700/20 flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm arabic-text text-amber-900">🧦 جوارب بامبو ZT — نسخة جديدة 🆕</p>
                  <p className="text-xs text-amber-700 arabic-text mt-0.5">5 ألوان | 25,000 دينار شامل التوصيل | صور احترافية | واتساب تأكيد</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                    {baseUrl}/zt2
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    onClick={copyZt2Link}
                    className={`h-8 px-3 text-xs arabic-text gap-1.5 ${zt2Copied ? "bg-green-600 hover:bg-green-700" : "bg-amber-700 hover:bg-amber-800"}`}
                  >
                    {zt2Copied ? (
                      <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`${baseUrl}/zt2`, "_blank")}
                    className="h-8 px-3 text-xs arabic-text gap-1.5 border-amber-300 text-amber-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> معاينة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* فاصل */}
        <p className="text-xs font-semibold text-muted-foreground arabic-text mb-2 mt-5 uppercase tracking-wide">روابط المنتجات الفردية</p>

        {/* بحث */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث باسم المنتج أو SKU..."
            className="pr-9 arabic-text"
          />
        </div>

        {/* قائمة المنتجات */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground arabic-text">
            لا توجد منتجات مطابقة
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredProducts.map(product => {
              const link = `${baseUrl}/buy/${product.id}`;
              const isCopied = copiedId === product.id;

              return (
                <Card key={product.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* صورة المنتج */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.nameAr}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">لا صورة</div>
                        )}
                      </div>

                      {/* معلومات المنتج */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm arabic-text line-clamp-1">{product.nameAr}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.sku && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">SKU: {product.sku}</Badge>
                          )}
                          <span className="text-xs text-primary font-bold arabic-text">
                            {parseFloat(product.price).toLocaleString("ar-IQ")} د.ع
                          </span>
                        </div>
                        {/* الرابط */}
                        <p className="text-xs text-muted-foreground mt-1 truncate font-mono" dir="ltr">
                          {link}
                        </p>
                      </div>

                      {/* أزرار */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => copyLink(product.id)}
                          className={`h-8 px-3 text-xs arabic-text gap-1.5 ${isCopied ? "bg-green-600 hover:bg-green-700" : ""}`}
                        >
                          {isCopied ? (
                            <><Check className="w-3.5 h-3.5" /> تم النسخ</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> نسخ الرابط</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openLink(product.id)}
                          className="h-8 px-3 text-xs arabic-text gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> معاينة
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
