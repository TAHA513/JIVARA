import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/product-card";
import { Tag, Percent, Clock, Star } from "lucide-react";
import type { Product } from "@shared/schema";

export default function Offers() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: settings = [] } = useQuery<Array<{key: string, value: string}>>({
    queryKey: ["/api/settings"],
  });

  const getSetting = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value;
  };

  // Filter products that have discounts (originalPrice > price)
  const discountedProducts = products.filter(product => 
    product.originalPrice && 
    parseFloat(product.originalPrice) > parseFloat(product.price)
  );

  // Featured products as fallback offers
  const featuredProducts = products.filter(product => product.isFeatured);
  
  const offersToShow = discountedProducts.length > 0 ? discountedProducts : featuredProducts;

  const calculateDiscount = (originalPrice: string, currentPrice: string) => {
    const original = parseFloat(originalPrice);
    const current = parseFloat(currentPrice);
    return Math.round(((original - current) / original) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded-lg w-1/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4">
                  <div className="h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <Tag className="w-5 h-5 sm:w-8 sm:h-8" />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold arabic-text">العروض الخاصة</h1>
          </div>
          <p className="text-sm sm:text-xl opacity-90 mb-4 sm:mb-8 arabic-text">
            اكتشف أفضل العروض والخصومات على منتجاتنا المميزة
          </p>
          
          {/* Offer Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-2.5 sm:p-4">
              <Percent className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <h3 className="text-lg sm:text-2xl font-bold">
                {discountedProducts.length > 0 
                  ? Math.max(...discountedProducts.map(p => 
                      calculateDiscount(p.originalPrice!, p.price)
                    )) 
                  : 25}%
              </h3>
              <p className="text-[10px] sm:text-sm opacity-90 arabic-text">أقصى خصم</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-2.5 sm:p-4">
              <Star className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <h3 className="text-lg sm:text-2xl font-bold">{offersToShow.length}</h3>
              <p className="text-[10px] sm:text-sm opacity-90 arabic-text">منتج مخفض</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-2.5 sm:p-4">
              <Clock className="w-5 h-5 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" />
              <h3 className="text-lg sm:text-2xl font-bold arabic-text">محدود</h3>
              <p className="text-[10px] sm:text-sm opacity-90 arabic-text">لفترة محدودة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offers Section */}
      <section className="py-6 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          {offersToShow.length === 0 ? (
            <div className="text-center py-8 sm:py-16">
              <Tag className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 arabic-text">لا توجد عروض حالياً</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-8 arabic-text">
                نعمل على إضافة عروض جديدة قريباً. تابعونا للحصول على أحدث العروض
              </p>
              <Link href="/products">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-sm sm:text-base">
                  تصفح جميع المنتجات
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 sm:mb-12">
                <h2 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-4 arabic-text">العروض المتاحة الآن</h2>
                <p className="text-sm sm:text-lg text-muted-foreground arabic-text">
                  اغتنم الفرصة واستفد من هذه الخصومات الرائعة
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
                {offersToShow.map((product) => (
                  <div key={product.id} className="relative">
                    {product.originalPrice && (
                      <Badge 
                        className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white font-bold text-xs"
                      >
                        -{calculateDiscount(product.originalPrice, product.price)}%
                      </Badge>
                    )}
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Call to Action */}
              <div className="text-center mt-6 sm:mt-12 p-4 sm:p-8 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg">
                <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4 arabic-text">لم تجد ما تبحث عنه؟</h3>
                <p className="text-xs sm:text-base text-muted-foreground mb-3 sm:mb-6 arabic-text">
                  تصفح مجموعتنا الكاملة من المنتجات المميزة
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                  <Link href="/products">
                    <Button variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                      عرض جميع المنتجات
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-sm sm:text-base">
                      العودة للرئيسية
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}