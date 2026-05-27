import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/product-card";
import { Gem, Clock, Truck, Shield, Headphones, RotateCcw, Star, ChevronLeft, ChevronRight, Watch, Sparkles, Glasses, Footprints, Shirt, Home as HomeIcon, Package } from "lucide-react";
import { Link } from "wouter";
import { useRef } from "react";
import type { Product, Category, StoreSetting } from "@shared/schema";
const heroImagePath = "/jivara-hero.png";
import watchImagePath from "@assets/rolex-watch.png";
import perfumeImagePath from "@assets/hqdefault_1755548467976.jpg";
import womenWatchImagePath from "@assets/luxury-watch-collection.png";

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const scrollMobileNext = () => {
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollBy({ left: -180, behavior: 'smooth' });
    }
  };
  const { data: allProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products?showOnJivara=true"],
  });

  // Products with images first, then without
  const featuredProducts = [...allProducts].sort((a, b) => {
    const aHas = (a.images?.length ?? 0) > 0 ? 0 : 1;
    const bHas = (b.images?.length ?? 0) > 0 ? 0 : 1;
    return aHas - bHas;
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 0, // إجبار إعادة التحميل
    gcTime: 0, // عدم حفظ في ذاكرة التخزين المؤقت
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery<StoreSetting[]>({
    queryKey: ["/api/settings"],
    staleTime: 0,
    refetchOnMount: true,
  });

  const getSetting = (key: string) => 
    settings.find(s => s.key === key)?.value || "";

  const activeCategories = categories.filter(cat => cat.isActive);
  
  const heroTitle = getSetting("homepage_hero_title");
  const heroSubtitle = getSetting("homepage_hero_subtitle");
  const heroImage = getSetting("hero_image") || heroImagePath;
  const freeShippingThreshold = getSetting("free_shipping_threshold");
  const deliveryTime = getSetting("delivery_time");
  const warrantyPeriod = getSetting("warranty_period");

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[#0a0a0a] overflow-hidden">
        {/* Image fills width with natural aspect, no black gaps on mobile */}
        <img 
          src={heroImagePath} 
          alt="JIVARA" 
          loading="eager"
          className="block w-full h-auto"
        />
        {/* CTA buttons below image on mobile, overlaid bottom on desktop */}
        <div className="bg-white py-4 md:bg-transparent md:py-0 md:absolute md:bottom-6 md:right-0 md:left-0 md:pointer-events-none">
          <div className="container mx-auto px-4">
            <div className="flex gap-3 sm:gap-4 justify-center md:justify-start md:pointer-events-auto">
              <Link href="/products">
                <Button size="default" className="bg-primary hover:bg-primary/90 text-black font-bold text-sm sm:text-base shadow-xl border-2 border-primary transition-all duration-300 hover:scale-105">
                  تسوق الآن
                </Button>
              </Link>
              <Link href="/offers">
                <Button size="default" variant="outline" className="border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-black text-sm sm:text-base transition-all duration-300 hover:scale-105">
                  العروض الخاصة
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-10 sm:py-16 bg-[#F8F8F8]">
        <div className="container mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { Icon: Truck, title: 'شحن سريع', desc: `${deliveryTime}${freeShippingThreshold ? ` - شحن مجاني فوق ${parseInt(freeShippingThreshold).toLocaleString()} د.ع` : ''}` },
              { Icon: Shield, title: 'ضمان الجودة', desc: `منتجات أصلية مع ضمان ${warrantyPeriod} أشهر` },
              { Icon: Headphones, title: 'دعم العملاء', desc: getSetting("working_hours") || "خدمة عملاء متاحة على مدار الساعة" },
              { Icon: RotateCcw, title: 'إرجاع مجاني', desc: `إمكانية الإرجاع خلال ${getSetting("return_period") || "7"} أيام` },
            ].map(({ Icon, title, desc }, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(201,161,74,0.15)] transition-all duration-300 border border-black/5"
              >
                <div className="bg-[#FAF3E0] w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[#C9A14A] transition-colors duration-300">
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#C9A14A] group-hover:text-white transition-colors" strokeWidth={2} />
                </div>
                <h3 className="text-sm sm:text-base font-bold mb-1.5 arabic-text text-black leading-tight">{title}</h3>
                <p className="text-[11px] sm:text-sm text-gray-500 arabic-text leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-7 sm:py-14 bg-white">
        <div className="container mx-auto px-0 sm:px-6">
          <div className="text-center mb-5 sm:mb-9 px-3">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 arabic-text text-black">تسوق حسب الأقسام</h2>
            <div className="w-10 h-0.5 bg-[#C9A14A] mx-auto mb-1.5"></div>
            <p className="text-xs sm:text-base text-gray-500 arabic-text">اختر قسمك المفضل</p>
          </div>

          {/* Mobile slider with peek + arrow hint */}
          <div className="sm:hidden relative">
            <div
              ref={mobileScrollRef}
              className="overflow-x-auto hide-scrollbar overscroll-x-contain scroll-smooth snap-x snap-mandatory"
            >
              <div className="flex gap-2 pr-3 pl-10 pb-1 w-max" dir="rtl">
                {activeCategories.map((category) => (
                  <div key={category.id} className="snap-start shrink-0 w-[20%] min-w-[78px]">
                    <CategoryCircle category={category} />
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient fade + arrow hint on the left edge (RTL = "more" direction) */}
            <div className="absolute top-0 bottom-0 left-0 w-14 pointer-events-none bg-gradient-to-l from-transparent to-white" />
            <button
              type="button"
              onClick={scrollMobileNext}
              aria-label="عرض المزيد"
              className="absolute left-2 top-[36px] -translate-y-1/2 w-9 h-9 rounded-full bg-[#C9A14A] text-white shadow-[0_4px_14px_rgba(201,161,74,0.45)] flex items-center justify-center animate-bounce-x active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Desktop slider with arrows */}
          <div className="relative hidden sm:block">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-[#C9A14A] hover:text-white border-black/10 rounded-full w-9 h-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div ref={scrollContainerRef} className="overflow-x-auto pb-3 hide-scrollbar px-12 scroll-smooth">
              <div className="flex gap-5 min-w-min">
                {activeCategories.map((category) => (
                  <CategoryCircle key={category.id} category={category} />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md hover:bg-[#C9A14A] hover:text-white border-black/10 rounded-full w-9 h-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="py-8 sm:py-16 bg-[#F8F8F8]">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 arabic-text">جميع المنتجات</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground arabic-text">تشكيلة كاملة من أفضل المنتجات</p>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-[4/3] rounded-lg mb-2 sm:mb-4"></div>
                  <div className="space-y-2">
                    <div className="bg-muted h-3 sm:h-4 rounded w-3/4"></div>
                    <div className="bg-muted h-3 sm:h-4 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          <div className="text-center mt-8 sm:mt-12">
            <Link href="/products">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary font-medium text-sm sm:text-base">
                عرض جميع المنتجات
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="py-8 sm:py-16 text-white bg-[#070708]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="font-bold arabic-text text-xl sm:text-2xl md:text-3xl mb-2">آراء عملائنا</h2>
            <p className="text-sm sm:text-lg md:text-xl opacity-90 arabic-text">تجارب حقيقية من عملائنا الكرام</p>
          </div>
          
          {/* Hero Testimonial */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-12">
            <Card className="bg-white/15 backdrop-blur-lg border-white/30 transform hover:scale-105 transition-all duration-300">
              <CardContent className="p-4 sm:p-8 text-center">
                <div className="flex justify-center text-yellow-400 text-xl sm:text-2xl mb-3 sm:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-6 sm:h-6 fill-current" />
                  ))}
                </div>
                <p className="text-base sm:text-xl md:text-2xl mb-4 sm:mb-8 opacity-95 arabic-text font-medium leading-relaxed text-[#dfe4ed]">
                  "منتجات عالية الجودة وخدمة عملاء ممتازة. أنصح بشدة بالتسوق من هنا"
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 text-[#dfe5f0]">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base sm:text-xl">
                    <span>أ</span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-lg font-bold arabic-text">أحمد محمد</h4>
                    <p className="text-xs sm:text-base opacity-75 arabic-text">بغداد</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Testimonials */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "فاطمة علي",
                location: "البصرة",
                content: "تجربة تسوق رائعة، المنتجات أصلية والتوصيل سريع جداً"
              },
              {
                name: "خالد حسن",
                location: "أربيل", 
                content: "أسعار منافسة وجودة ممتازة، سأكون عميل دائم بإذن الله"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="rounded-lg border shadow-sm bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 text-[#f0f1f2]">
                <CardContent className="p-6 text-[#dfe3eb]">
                  <div className="flex justify-start text-yellow-400 text-lg mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-base mb-6 opacity-90 arabic-text leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      <span>{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold arabic-text">{testimonial.name}</h4>
                      <p className="text-sm opacity-75 arabic-text">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Newsletter */}
      <section className="py-6 sm:py-12 bg-gradient-to-r from-secondary to-accent text-white">
        <div className="container mx-auto px-4 text-center text-[#171616]">
          <h2 className="font-bold arabic-text text-xl sm:text-2xl md:text-3xl mb-2 sm:mb-3">اشترك معنا الان</h2>
          <p className="text-sm sm:text-lg md:text-xl mb-3 sm:mb-5 opacity-90 arabic-text">كن أول من يعلم بالمنتجات الجديدة والعروض الخاصة</p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-2 items-stretch">
              <input 
                type="email" 
                placeholder="أدخل بريدك الإلكتروني" 
                className="flex-1 px-3 sm:px-4 h-11 rounded-lg text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white arabic-text"
              />
              <Button className="bg-[#070708] hover:bg-[#070708]/90 px-5 sm:px-6 h-11 text-sm sm:text-base text-white font-bold flex-shrink-0">
                اشتراك
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const CATEGORY_ICONS: Record<string, typeof Watch> = {
  ساعات: Watch,
  العطور: Sparkles,
  نظارات: Glasses,
  إكسسوارات: Gem,
  جوارب: Shirt,
  جواريب: Shirt,
  أحذية: Footprints,
  ملابس: Shirt,
  المنزل: HomeIcon,
  المواد: HomeIcon,
};

function pickCategoryIcon(name: string) {
  const key = Object.keys(CATEGORY_ICONS).find((k) => name.includes(k));
  return key ? CATEGORY_ICONS[key] : Package;
}

function CategoryCircle({ category }: { category: Category }) {
  const Icon = pickCategoryIcon(category.nameAr);
  return (
    <Link href={`/products?category=${category.id}`}>
      <div className="group flex flex-col items-center gap-2 cursor-pointer w-full">
        <div className="w-[72px] h-[72px] sm:w-24 sm:h-24 rounded-full bg-[#FAF3E0] border border-[#C9A14A]/25 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:shadow-[0_6px_20px_rgba(201,161,74,0.25)] group-hover:bg-[#C9A14A] transition-all duration-300 flex items-center justify-center">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#C9A14A] group-hover:text-white transition-colors" strokeWidth={1.8} />
        </div>
        <span className="text-[12px] sm:text-sm font-semibold arabic-text text-black text-center leading-tight line-clamp-2 w-[72px] sm:w-24">
          {category.nameAr}
        </span>
      </div>
    </Link>
  );
}
