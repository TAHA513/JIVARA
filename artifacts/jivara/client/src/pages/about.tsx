import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Store, Clock, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "wouter";
import type { StoreSetting } from "@shared/schema";

export default function About() {
  const { data: settings = [] } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
  });

  const getSetting = (key: string) => 
    settings.find(s => s.key === key)?.value || "";

  const storeName = getSetting("store_name") || "جيفارا للتسوق";
  const aboutUs = getSetting("about_us");
  const workingHours = getSetting("working_hours");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            الرئيسية
          </Link>
          <ArrowRight className="w-4 h-4" />
          <span className="text-foreground">من نحن</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Store className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 arabic-text">{storeName}</h1>
          <p className="text-muted-foreground text-lg arabic-text">
            {getSetting("store_description") || "وجهتك الأولى للساعات والعطور الفاخرة"}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border p-8 mb-8">
            {aboutUs ? (
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <div className="whitespace-pre-line text-base leading-relaxed arabic-text">
                  {aboutUs}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 arabic-text">
                  معلومات المتجر
                </h3>
                <p className="text-muted-foreground arabic-text">
                  نحن متخصصون في توفير أجود أنواع الساعات والعطور العالمية بأفضل الأسعار
                </p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Store Details */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4 arabic-text">معلومات التواصل</h3>
              <div className="space-y-4">
                {getSetting("store_address") && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">العنوان</p>
                      <p className="text-muted-foreground">{getSetting("store_address")}</p>
                      {getSetting("store_city") && (
                        <p className="text-muted-foreground">{getSetting("store_city")}, {getSetting("store_country")}</p>
                      )}
                    </div>
                  </div>
                )}

                {getSetting("store_phone1") && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">الهاتف الأول</p>
                      <p className="text-muted-foreground">{getSetting("store_phone1")}</p>
                    </div>
                  </div>
                )}

                {getSetting("store_phone2") && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">الهاتف الثاني</p>
                      <p className="text-muted-foreground">{getSetting("store_phone2")}</p>
                    </div>
                  </div>
                )}

                {getSetting("store_email") && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-medium">البريد الإلكتروني</p>
                      <p className="text-muted-foreground">{getSetting("store_email")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-semibold mb-4 arabic-text">ساعات العمل</h3>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">أوقات الدوام</p>
                  <p className="text-muted-foreground">
                    {workingHours || "9:00 ص - 10:00 م"}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t space-y-3">
                {getSetting("warranty_period") && (
                  <div className="bg-primary/5 rounded p-3">
                    <p className="font-medium text-primary">فترة الضمان</p>
                    <p className="text-sm text-muted-foreground">{getSetting("warranty_period")} أشهر</p>
                  </div>
                )}

                {getSetting("return_period") && (
                  <div className="bg-secondary/5 rounded p-3">
                    <p className="font-medium text-secondary">فترة الإرجاع</p>
                    <p className="text-sm text-muted-foreground">{getSetting("return_period")} أيام</p>
                  </div>
                )}

                {getSetting("delivery_time") && (
                  <div className="bg-accent/5 rounded p-3">
                    <p className="font-medium text-accent">مدة التوصيل</p>
                    <p className="text-sm text-muted-foreground">{getSetting("delivery_time")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}