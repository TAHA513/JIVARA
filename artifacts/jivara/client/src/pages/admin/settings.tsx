import { safeStorage } from '@/lib/safe-storage';
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Save, Store, Palette, Phone, MapPin, Mail, FileText, Shield, Truck, MessageSquare, Send, Loader2, Image, Users, Info } from "lucide-react";
import type { StoreSetting } from "@shared/schema";

export default function AdminSettings() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const [isDirty, setIsDirty] = useState(false);
  const [isTestingBot, setIsTestingBot] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
  });

  const [formData, setFormData] = useState<Record<string, string>>({});

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settings.length > 0) {
      const initialData: Record<string, string> = {};
      settings.forEach(setting => {
        initialData[setting.key] = setting.value || "";
      });
      setFormData(initialData);
    }
  }, [settings]);

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const saveAllSettings = async () => {
    try {
      const promises = Object.entries(formData).map(([key, value]) =>
        updateSettingMutation.mutateAsync({ key, value })
      );
      
      await Promise.all(promises);
      
      setIsDirty(false);
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ جميع الإعدادات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const getSetting = (key: string) => formData[key] || "";

  // Test Telegram Bot function
  const testTelegramBot = async () => {
    setIsTestingBot(true);
    try {
      // First save the current settings
      const promises = Object.entries(formData).map(([key, value]) =>
        updateSettingMutation.mutateAsync({ key, value })
      );
      await Promise.all(promises);
      
      // Then test the bot using fetch with proper auth
      const token = safeStorage.getItem('adminToken');
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      const testResult = await response.json();
      
      if (testResult.success) {
        toast({
          title: "نجح الاختبار",
          description: "تم إرسال رسالة اختبار بنجاح إلى Telegram",
        });
      } else {
        throw new Error(testResult.message || "فشل في إرسال الرسالة");
      }
    } catch (error: any) {
      let errorMessage = "تعذر إرسال رسالة اختبار. تحقق من الإعدادات.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "فشل الاختبار",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Telegram test error:", error);
    } finally {
      setIsTestingBot(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="flex">
          <AdminSidebar />
          <div className="flex-1 p-8">
            <div className="animate-pulse space-y-4">
              <div className="bg-muted h-8 rounded w-1/4"></div>
              <div className="bg-muted h-64 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold arabic-text">إعدادات المتجر</h1>
              <p className="text-muted-foreground arabic-text">
                تخصيص إعدادات ومظهر المتجر
              </p>
            </div>
            
            <Button 
              onClick={saveAllSettings}
              disabled={!isDirty || updateSettingMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateSettingMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>

          <Tabs defaultValue="store" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="store" className="arabic-text">معلومات المتجر</TabsTrigger>
              <TabsTrigger value="images" className="arabic-text">صور الموقع</TabsTrigger>
              <TabsTrigger value="appearance" className="arabic-text">المظهر والألوان</TabsTrigger>
              <TabsTrigger value="contact" className="arabic-text">معلومات التواصل</TabsTrigger>
              <TabsTrigger value="policies" className="arabic-text">السياسات والأحكام</TabsTrigger>
              <TabsTrigger value="content" className="arabic-text">محتوى الموقع</TabsTrigger>
            </TabsList>

            {/* Store Information */}
            <TabsContent value="store" className="space-y-6">
              {/* Telegram Bot Settings - First Priority */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-bold arabic-text flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    إعدادات بوت Telegram
                  </CardTitle>
                  <p className="text-sm text-muted-foreground arabic-text">
                    إعداد بوت Telegram لاستقبال إشعارات الطلبات الجديدة
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="telegram_bot_token" className="arabic-text">رمز بوت Telegram</Label>
                    <Input
                      id="telegram_bot_token"
                      type="password"
                      value={getSetting("telegram_bot_token")}
                      onChange={(e) => handleInputChange("telegram_bot_token", e.target.value)}
                      placeholder="Bot Token من BotFather"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1 arabic-text">
                      احصل على الرمز من @BotFather في Telegram
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="telegram_chat_id" className="arabic-text">معرف المحادثة</Label>
                    <Input
                      id="telegram_chat_id"
                      value={getSetting("telegram_chat_id")}
                      onChange={(e) => handleInputChange("telegram_chat_id", e.target.value)}
                      placeholder="Chat ID أو User ID"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1 arabic-text">
                      معرف المحادثة الذي سيتم إرسال الإشعارات إليه
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testTelegramBot}
                      disabled={!getSetting("telegram_bot_token") || !getSetting("telegram_chat_id") || isTestingBot}
                      className="arabic-text"
                    >
                      {isTestingBot ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري الاختبار...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          اختبار البوت
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Store className="w-5 h-5" />
                    معلومات المتجر الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="store_name" className="arabic-text">اسم المتجر بالعربية</Label>
                      <Input
                        id="store_name"
                        value={getSetting("store_name")}
                        onChange={(e) => handleInputChange("store_name", e.target.value)}
                        placeholder="جيفارا للتسوق"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="store_name_en">اسم المتجر بالإنجليزية</Label>
                      <Input
                        id="store_name_en"
                        value={getSetting("store_name_en")}
                        onChange={(e) => handleInputChange("store_name_en", e.target.value)}
                        placeholder="Center Warehouse for Watches and Perfumes"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="store_description" className="arabic-text">وصف المتجر</Label>
                    <Input
                      id="store_description"
                      value={getSetting("store_description")}
                      onChange={(e) => handleInputChange("store_description", e.target.value)}
                      placeholder="وجهتك الأولى للساعات والعطور الفاخرة في العراق"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="store_address" className="arabic-text">عنوان المتجر</Label>
                    <Input
                      id="store_address"
                      value={getSetting("store_address")}
                      onChange={(e) => handleInputChange("store_address", e.target.value)}
                      placeholder="الرمادي المستودع قرب مول الستي سنتر"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="store_city" className="arabic-text">المدينة</Label>
                      <Input
                        id="store_city"
                        value={getSetting("store_city")}
                        onChange={(e) => handleInputChange("store_city", e.target.value)}
                        placeholder="الرمادي"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="store_country" className="arabic-text">البلد</Label>
                      <Input
                        id="store_country"
                        value={getSetting("store_country")}
                        onChange={(e) => handleInputChange("store_country", e.target.value)}
                        placeholder="العراق"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Palette className="w-5 h-5" />
                    ألوان المتجر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="primary_color" className="arabic-text">اللون الأساسي</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={getSetting("primary_color") || "#1B365D"}
                          onChange={(e) => handleInputChange("primary_color", e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={getSetting("primary_color") || "#1B365D"}
                          onChange={(e) => handleInputChange("primary_color", e.target.value)}
                          placeholder="#1B365D"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="secondary_color" className="arabic-text">اللون الثانوي</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={getSetting("secondary_color") || "#F4A460"}
                          onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={getSetting("secondary_color") || "#F4A460"}
                          onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                          placeholder="#F4A460"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="accent_color" className="arabic-text">لون التمييز</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accent_color"
                          type="color"
                          value={getSetting("accent_color") || "#FF6B35"}
                          onChange={(e) => handleInputChange("accent_color", e.target.value)}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={getSetting("accent_color") || "#FF6B35"}
                          onChange={(e) => handleInputChange("accent_color", e.target.value)}
                          placeholder="#FF6B35"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="logo_url" className="arabic-text">رابط الشعار</Label>
                    <Input
                      id="logo_url"
                      value={getSetting("logo_url")}
                      onChange={(e) => handleInputChange("logo_url", e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hero_image" className="arabic-text">صورة الغلاف الرئيسية</Label>
                    <Input
                      id="hero_image"
                      value={getSetting("hero_image")}
                      onChange={(e) => handleInputChange("hero_image", e.target.value)}
                      placeholder="https://example.com/hero.jpg"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="usd_exchange_rate" className="arabic-text">سعر صرف الدولار الأمريكي</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="usd_exchange_rate"
                        type="number"
                        step="0.01"
                        value={getSetting("usd_exchange_rate") || "1500"}
                        onChange={(e) => handleInputChange("usd_exchange_rate", e.target.value)}
                        placeholder="1500"
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground arabic-text">دينار عراقي</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 arabic-text">
                      كم دينار عراقي يساوي دولار أمريكي واحد
                    </p>
                  </div>
                </CardContent>
              </Card>


            </TabsContent>

            {/* Images Settings */}
            <TabsContent value="images" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Image className="w-5 h-5" />
                    صور الصفحة الرئيسية
                  </CardTitle>
                  <p className="text-sm text-muted-foreground arabic-text">
                    صور الفئات والأقسام في الصفحة الرئيسية
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="watches_category_image" className="arabic-text">صورة فئة </Label>
                    <Input
                      id="watches_category_image"
                      value={getSetting("watches_category_image")}
                      onChange={(e) => handleInputChange("watches_category_image", e.target.value)}
                      placeholder="https://example.com/watches.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1 arabic-text">
                      الحجم المناسب: 800×600 بكسل
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="perfumes_category_image" className="arabic-text">صورة فئة </Label>
                    <Input
                      id="perfumes_category_image"
                      value={getSetting("perfumes_category_image")}
                      onChange={(e) => handleInputChange("perfumes_category_image", e.target.value)}
                      placeholder="https://example.com/perfumes.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1 arabic-text">
                      الحجم المناسب: 800×600 بكسل
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="default_product_image" className="arabic-text">الصورة الافتراضية للمنتجات</Label>
                    <Input
                      id="default_product_image"
                      value={getSetting("default_product_image")}
                      onChange={(e) => handleInputChange("default_product_image", e.target.value)}
                      placeholder="https://example.com/default-product.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1 arabic-text">
                      تظهر عندما لا تكون هناك صورة للمنتج - الحجم المناسب: 300×300 بكسل
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Users className="w-5 h-5" />
                    صور آراء العملاء
                  </CardTitle>
                  <p className="text-sm text-muted-foreground arabic-text">
                    صور العملاء في قسم التقييمات
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customer1_image" className="arabic-text">صورة العميل الأول</Label>
                      <Input
                        id="customer1_image"
                        value={getSetting("customer1_image")}
                        onChange={(e) => handleInputChange("customer1_image", e.target.value)}
                        placeholder="https://example.com/customer1.jpg"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customer2_image" className="arabic-text">صورة العميل الثاني</Label>
                      <Input
                        id="customer2_image"
                        value={getSetting("customer2_image")}
                        onChange={(e) => handleInputChange("customer2_image", e.target.value)}
                        placeholder="https://example.com/customer2.jpg"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customer3_image" className="arabic-text">صورة العميل الثالث</Label>
                      <Input
                        id="customer3_image"
                        value={getSetting("customer3_image")}
                        onChange={(e) => handleInputChange("customer3_image", e.target.value)}
                        placeholder="https://example.com/customer3.jpg"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground arabic-text">
                    الحجم المناسب: 100×100 بكسل (مربعة) - ستظهر دائرية في الموقع
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Info className="w-5 h-5" />
                    نصائح حول الصور
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground arabic-text">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p>استخدم صور عالية الجودة وواضحة</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p>تأكد من أن روابط الصور تعمل بشكل دائم</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p>يمكنك استخدام خدمات مثل Cloudinary أو ImageKit لاستضافة الصور</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <p>للصور المحلية: ضعها في مجلد public/images واستخدم /images/اسم_الصورة.jpg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Information */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Phone className="w-5 h-5" />
                    معلومات التواصل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="store_phone1" className="arabic-text">رقم الهاتف الأول</Label>
                      <Input
                        id="store_phone1"
                        value={getSetting("store_phone1")}
                        onChange={(e) => handleInputChange("store_phone1", e.target.value)}
                        placeholder="07813961800"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="store_phone2" className="arabic-text">رقم الهاتف الثاني</Label>
                      <Input
                        id="store_phone2"
                        value={getSetting("store_phone2")}
                        onChange={(e) => handleInputChange("store_phone2", e.target.value)}
                        placeholder="07810125388"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="store_email" className="arabic-text">البريد الإلكتروني</Label>
                    <Input
                      id="store_email"
                      type="email"
                      value={getSetting("store_email")}
                      onChange={(e) => handleInputChange("store_email", e.target.value)}
                      placeholder="info@centermustaudaa.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_number" className="arabic-text">رقم الواتساب</Label>
                    <Input
                      id="whatsapp_number"
                      value={getSetting("whatsapp_number")}
                      onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                      placeholder="9647813961800"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-semibold arabic-text">روابط وسائل التواصل الاجتماعي</Label>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="facebook_url" className="arabic-text">رابط الفيسبوك</Label>
                        <Input
                          id="facebook_url"
                          value={getSetting("facebook_url")}
                          onChange={(e) => handleInputChange("facebook_url", e.target.value)}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="instagram_url" className="arabic-text">رابط الإنستغرام</Label>
                        <Input
                          id="instagram_url"
                          value={getSetting("instagram_url")}
                          onChange={(e) => handleInputChange("instagram_url", e.target.value)}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telegram_url" className="arabic-text">رابط التيليغرام</Label>
                        <Input
                          id="telegram_url"
                          value={getSetting("telegram_url")}
                          onChange={(e) => handleInputChange("telegram_url", e.target.value)}
                          placeholder="https://t.me/yourchannel"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="youtube_url" className="arabic-text">رابط اليوتيوب</Label>
                        <Input
                          id="youtube_url"
                          value={getSetting("youtube_url")}
                          onChange={(e) => handleInputChange("youtube_url", e.target.value)}
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Policies and Terms */}
            <TabsContent value="policies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <Shield className="w-5 h-5" />
                    السياسات والأحكام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="return_policy" className="arabic-text">سياسة الاسترجاع والاستبدال</Label>
                    <Textarea
                      id="return_policy"
                      value={getSetting("return_policy")}
                      onChange={(e) => handleInputChange("return_policy", e.target.value)}
                      placeholder="اكتب سياسة الاسترجاع والاستبدال هنا..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping_policy" className="arabic-text">سياسة الشحن والتوصيل</Label>
                    <Textarea
                      id="shipping_policy"
                      value={getSetting("shipping_policy")}
                      onChange={(e) => handleInputChange("shipping_policy", e.target.value)}
                      placeholder="اكتب سياسة الشحن والتوصيل هنا..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="privacy_policy" className="arabic-text">سياسة الخصوصية</Label>
                    <Textarea
                      id="privacy_policy"
                      value={getSetting("privacy_policy")}
                      onChange={(e) => handleInputChange("privacy_policy", e.target.value)}
                      placeholder="اكتب سياسة الخصوصية هنا..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="terms_conditions" className="arabic-text">الشروط والأحكام</Label>
                    <Textarea
                      id="terms_conditions"
                      value={getSetting("terms_conditions")}
                      onChange={(e) => handleInputChange("terms_conditions", e.target.value)}
                      placeholder="اكتب الشروط والأحكام هنا..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warranty_period" className="arabic-text">فترة الضمان (بالأشهر)</Label>
                      <Input
                        id="warranty_period"
                        type="number"
                        value={getSetting("warranty_period")}
                        onChange={(e) => handleInputChange("warranty_period", e.target.value)}
                        placeholder="12"
                      />
                    </div>

                    <div>
                      <Label htmlFor="return_period" className="arabic-text">فترة الإرجاع (بالأيام)</Label>
                      <Input
                        id="return_period"
                        type="number"
                        value={getSetting("return_period")}
                        onChange={(e) => handleInputChange("return_period", e.target.value)}
                        placeholder="7"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Website Content */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 arabic-text">
                    <FileText className="w-5 h-5" />
                    محتوى الموقع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="homepage_hero_title" className="arabic-text">عنوان الصفحة الرئيسية</Label>
                    <Input
                      id="homepage_hero_title"
                      value={getSetting("homepage_hero_title")}
                      onChange={(e) => handleInputChange("homepage_hero_title", e.target.value)}
                      placeholder="اكتشف أفضل الساعات والعطور"
                    />
                  </div>

                  <div>
                    <Label htmlFor="homepage_hero_subtitle" className="arabic-text">الوصف التفصيلي للصفحة الرئيسية</Label>
                    <Textarea
                      id="homepage_hero_subtitle"
                      value={getSetting("homepage_hero_subtitle")}
                      onChange={(e) => handleInputChange("homepage_hero_subtitle", e.target.value)}
                      placeholder="مجموعة حصرية من أرقى الساعات والعطور العالمية..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="about_us" className="arabic-text">معلومات عن المتجر</Label>
                    <Textarea
                      id="about_us"
                      value={getSetting("about_us")}
                      onChange={(e) => handleInputChange("about_us", e.target.value)}
                      placeholder="اكتب معلومات مفصلة عن المتجر وتاريخه وخدماته..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="footer_text" className="arabic-text">نص التذييل</Label>
                    <Textarea
                      id="footer_text"
                      value={getSetting("footer_text")}
                      onChange={(e) => handleInputChange("footer_text", e.target.value)}
                      placeholder="وجهتك الأولى للساعات والعطور الفاخرة في العراق"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-semibold arabic-text">إعدادات التسوق</Label>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min_order_amount" className="arabic-text">أقل مبلغ للطلب (د.ع)</Label>
                        <Input
                          id="min_order_amount"
                          type="number"
                          value={getSetting("min_order_amount")}
                          onChange={(e) => handleInputChange("min_order_amount", e.target.value)}
                          placeholder="50000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="free_shipping_threshold" className="arabic-text">الشحن المجاني فوق (د.ع)</Label>
                        <Input
                          id="free_shipping_threshold"
                          type="number"
                          value={getSetting("free_shipping_threshold")}
                          onChange={(e) => handleInputChange("free_shipping_threshold", e.target.value)}
                          placeholder="100000"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery_time" className="arabic-text">مدة التوصيل</Label>
                        <Input
                          id="delivery_time"
                          value={getSetting("delivery_time")}
                          onChange={(e) => handleInputChange("delivery_time", e.target.value)}
                          placeholder="1-3 أيام عمل"
                        />
                      </div>

                      <div>
                        <Label htmlFor="working_hours" className="arabic-text">ساعات العمل</Label>
                        <Input
                          id="working_hours"
                          value={getSetting("working_hours")}
                          onChange={(e) => handleInputChange("working_hours", e.target.value)}
                          placeholder="9:00 ص - 10:00 م"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
