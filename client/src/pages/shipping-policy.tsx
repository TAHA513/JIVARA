import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck } from "lucide-react";
import { Link } from "wouter";
import type { StoreSetting } from "@shared/schema";

export default function ShippingPolicy() {
  const { data: settings = [] } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
  });

  const getSetting = (key: string) => 
    settings.find(s => s.key === key)?.value || "";

  const storeName = getSetting("store_name") || "جيفارا للتسوق";
  const shippingPolicy = getSetting("shipping_policy");
  const deliveryTime = getSetting("delivery_time");
  const freeShippingThreshold = getSetting("free_shipping_threshold");
  const minOrderAmount = getSetting("min_order_amount");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            الرئيسية
          </Link>
          <ArrowRight className="w-4 h-4" />
          <span className="text-foreground">سياسة الشحن</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4 arabic-text">سياسة الشحن والتوصيل</h1>
          <p className="text-muted-foreground text-lg arabic-text">
            تعرف على خدمات الشحن والتوصيل في {storeName}
          </p>
        </div>

        {/* Quick Info */}
        {(deliveryTime || freeShippingThreshold || minOrderAmount) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              {deliveryTime && (
                <div className="bg-primary/10 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2 arabic-text">مدة التوصيل</h3>
                  <p className="text-xl font-bold text-primary">{deliveryTime}</p>
                </div>
              )}
              {freeShippingThreshold && (
                <div className="bg-secondary/10 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2 arabic-text">الشحن المجاني</h3>
                  <p className="text-xl font-bold text-secondary">{parseInt(freeShippingThreshold).toLocaleString()} د.ع</p>
                </div>
              )}
              {minOrderAmount && (
                <div className="bg-accent/10 rounded-lg p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2 arabic-text">أقل مبلغ للطلب</h3>
                  <p className="text-xl font-bold text-accent">{parseInt(minOrderAmount).toLocaleString()} د.ع</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm border p-8">
            {shippingPolicy ? (
              <div className="prose prose-slate max-w-none dark:prose-invert">
                <div className="whitespace-pre-line text-base leading-relaxed arabic-text">
                  {shippingPolicy}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 arabic-text">
                  لم يتم تحديد سياسة الشحن بعد
                </h3>
                <p className="text-muted-foreground arabic-text">
                  يمكن للمدير إضافة سياسة الشحن من لوحة التحكم
                </p>
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-8 bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 arabic-text">للاستفسارات حول الشحن والتوصيل</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              {getSetting("store_phone1") && (
                <div>
                  <span className="font-medium">الهاتف: </span>
                  <span className="text-primary">{getSetting("store_phone1")}</span>
                </div>
              )}
              {getSetting("store_email") && (
                <div>
                  <span className="font-medium">البريد الإلكتروني: </span>
                  <span className="text-primary">{getSetting("store_email")}</span>
                </div>
              )}
              {getSetting("store_address") && (
                <div className="md:col-span-2">
                  <span className="font-medium">العنوان: </span>
                  <span>{getSetting("store_address")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}