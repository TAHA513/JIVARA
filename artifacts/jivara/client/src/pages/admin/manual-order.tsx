import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus, Truck, ArrowRight, CheckCircle2, Search } from "lucide-react";

const CITIES: { name: string; id: number }[] = [
  { name: "بغداد", id: 1 },
  { name: "كربلاء", id: 2 },
  { name: "الأنبار", id: 3 },
  { name: "بابل", id: 4 },
  { name: "البصرة", id: 5 },
  { name: "دهوك", id: 6 },
  { name: "ديالى", id: 7 },
  { name: "اربيل", id: 8 },
  { name: "كركوك", id: 9 },
  { name: "ميسان", id: 10 },
  { name: "المثنى", id: 11 },
  { name: "النجف", id: 12 },
  { name: "نينوى", id: 13 },
  { name: "القادسية", id: 14 },
  { name: "صلاح الدين", id: 15 },
  { name: "السليمانية", id: 16 },
  { name: "ذي قار", id: 17 },
  { name: "واسط", id: 18 },
];

type CartItem = { id: number; name: string; price: number; quantity: number };
type Region = { id: number; region_name: string };

export default function ManualOrderPage() {
  const { isAuthenticated } = useAdminAuth();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCity, setSelectedCity] = useState<{ name: string; id: number } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regionSearch, setRegionSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const qc = useQueryClient();

  const { data: productsData } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const { data: regionsData, isFetching: regionsLoading } = useQuery<{ regions: Region[] }>({
    queryKey: ["/api/alwaseet/regions", selectedCity?.id],
    queryFn: () =>
      apiRequest("GET", `/api/alwaseet/regions/${selectedCity!.id}`).then((r) => r.json()),
    enabled: !!selectedCity,
    staleTime: 1000 * 60 * 60,
  });

  const regions: Region[] = regionsData?.regions || [];
  const filteredRegions = regions.filter((r) =>
    r.region_name.includes(regionSearch)
  );

  const products: any[] = productsData || [];
  const filteredProducts = products.filter((p) =>
    (p.nameAr || p.name || "").includes(productSearch)
  );

  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function addToCart(product: any) {
    const existing = cart.find((c) => c.id === product.id);
    if (existing) {
      setCart(cart.map((c) => (c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { id: product.id, name: product.nameAr || product.name, price: product.price || 0, quantity: 1 }]);
    }
  }

  function changeQty(id: number, delta: number) {
    setCart(
      cart
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/alwaseet/send-manual", {
        customerName,
        customerPhone,
        city: selectedCity!.name,
        regionId: selectedRegion!.id,
        items: cart.map((c) => ({ nameAr: c.name, quantity: c.quantity })),
        totalAmount,
        notes: notes || null,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.success) {
        qc.invalidateQueries({ queryKey: ["/api/orders"] });
        setCustomerName("");
        setCustomerPhone("");
        setSelectedCity(null);
        setSelectedRegion(null);
        setCart([]);
        setNotes("");
        setRegionSearch("");
        setProductSearch("");
      }
    },
  });

  const canSend =
    customerName.trim() &&
    customerPhone.trim() &&
    selectedCity &&
    selectedRegion &&
    cart.length > 0;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">إنشاء طلب يدوي</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "/admin/print-orders")}>
              <ArrowRight className="w-4 h-4 ml-1" />
              الطلبات
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = "/admin")}>
              لوحة التحكم
            </Button>
          </div>
        </div>

        {/* نتيجة الإرسال */}
        {result && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
              result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <span className="text-red-600 text-xl shrink-0">✗</span>
            )}
            <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
              {result.message}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto"
              onClick={() => setResult(null)}
            >
              ✕
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* القسم الأيمن: بيانات الزبون + المنطقة */}
          <div className="space-y-4">
            {/* بيانات الزبون */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">بيانات الزبون</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="mb-1 block">اسم الزبون *</Label>
                  <Input
                    placeholder="الاسم الكامل"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-1 block">رقم الهاتف *</Label>
                  <Input
                    placeholder="07xxxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="mb-1 block">ملاحظات</Label>
                  <Input
                    placeholder="أي ملاحظات إضافية"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* اختيار المحافظة */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">المحافظة *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {CITIES.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        setSelectedCity(city);
                        setSelectedRegion(null);
                        setRegionSearch("");
                      }}
                      className={`rounded-lg border py-2 px-1 text-sm font-medium transition-colors ${
                        selectedCity?.id === city.id
                          ? "bg-primary text-white border-primary"
                          : "bg-white hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* اختيار المنطقة */}
            {selectedCity && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    المنطقة *
                    {selectedCity && (
                      <span className="text-sm font-normal text-gray-500 mr-2">
                        — {selectedCity.name}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {regionsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="mr-2 text-sm text-gray-500">جاري تحميل المناطق...</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-2">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                        <Input
                          className="pr-9"
                          placeholder="ابحث عن منطقة..."
                          value={regionSearch}
                          onChange={(e) => setRegionSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded border divide-y">
                        {filteredRegions.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">لا توجد نتائج</p>
                        )}
                        {filteredRegions.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRegion(r)}
                            className={`w-full text-right px-3 py-2 text-sm transition-colors ${
                              selectedRegion?.id === r.id
                                ? "bg-yellow-100 font-bold text-yellow-900"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {r.region_name}
                          </button>
                        ))}
                      </div>
                      {selectedRegion && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                            ✓ {selectedRegion.region_name}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* القسم الأيسر: المنتجات + السلة */}
          <div className="space-y-4">
            {/* اختيار المنتجات */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">اختر المنتجات *</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-2">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    className="pr-9"
                    placeholder="ابحث عن منتج..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">لا توجد منتجات</p>
                  )}
                  {filteredProducts.map((p) => {
                    const inCart = cart.find((c) => c.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.nameAr || p.name}
                          </p>
                          <p className="text-xs text-gray-500">{p.price?.toLocaleString()} د.ع</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-2 mr-2">
                            <button
                              onClick={() => changeQty(p.id, -1)}
                              className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold">{inCart.quantity}</span>
                            <button
                              onClick={() => changeQty(p.id, 1)}
                              className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(p)}
                            className="mr-2 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ملخص الطلب */}
            {cart.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          {(item.price * item.quantity).toLocaleString()} د.ع
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>المجموع</span>
                    <span className="text-primary">{totalAmount.toLocaleString()} د.ع</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* زر الإرسال */}
            <Button
              className="w-full h-12 text-base"
              disabled={!canSend || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5 ml-2" />
                  إرسال للوسيط
                </>
              )}
            </Button>

            {!canSend && (
              <p className="text-xs text-gray-400 text-center">
                {!customerName && "• اسم الزبون "}
                {!customerPhone && "• رقم الهاتف "}
                {!selectedCity && "• المحافظة "}
                {!selectedRegion && "• المنطقة "}
                {!cart.length && "• منتج واحد على الأقل "}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
