import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelAddToCart, tiktokViewContent } from "@/lib/pixel";
import { Heart, Star, Truck, Shield, RotateCcw, Plus, Minus, ArrowRight, Camera, ShoppingCart } from "lucide-react";
import { safeStorage } from "@/lib/safe-storage";
import type { Product } from "@shared/schema";
import ImagePreview from "@/components/ImagePreview";

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: [`/api/products?categoryId=${product?.categoryId}`],
    enabled: !!product?.categoryId,
  });

  const lastAddRef = useRef<number>(0);
  const handleAddToCart = () => {
    const now = Date.now();
    if (now - lastAddRef.current < 1500) return;
    if (addToCartMutation.isPending) return;
    lastAddRef.current = now;
    addToCartMutation.mutate();
  };
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product selected");

      await addToCart(product, quantity);

      // Log activity
      const sessionId = safeStorage.getItem("sessionId") ||
        (() => {
          const newId = Math.random().toString(36).substring(7);
          safeStorage.setItem("sessionId", newId);
          return newId;
        })();
      await apiRequest("POST", "/api/activity", {
        sessionId,
        action: "add_to_cart",
        productId: product.id,
        metadata: { quantity }
      });
    },
    onSuccess: () => {
      if (product) {
        pixelAddToCart({ contentIds: [String(product.id)], value: (parseFloat(product.price) * quantity) / 1500, numItems: quantity });
      }
      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج إلى سلة التسوق بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive",
      });
    },
  });

  const logViewMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      
      const sessionId = safeStorage.getItem("sessionId") || 
        (() => {
          const newId = Math.random().toString(36).substring(7);
          safeStorage.setItem("sessionId", newId);
          return newId;
        })();

      await apiRequest("POST", "/api/activity", {
        sessionId,
        action: "view_product",
        productId: product.id,
        metadata: {}
      });
    },
  });

  // Log product view when product loads (corrected: use useEffect instead of useState for side effects)
  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (product?.id && !hasLoggedRef.current) {
      logViewMutation.mutate();
      pixelViewContent({ contentName: product.name, contentIds: [String(product.id)], value: parseFloat(product.price) / 1500 });
      tiktokViewContent({ contentName: product.name, contentIds: [String(product.id)], value: parseFloat(product.price) / 1500 });
      hasLoggedRef.current = true;
    }
  }, [product?.id, logViewMutation]);

  // Reset image error when changing selected image
  useEffect(() => {
    setImageError(false);
  }, [selectedImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-muted h-96 rounded-lg"></div>
              <div className="space-y-4">
                <div className="bg-muted h-8 rounded w-3/4"></div>
                <div className="bg-muted h-6 rounded w-1/2"></div>
                <div className="bg-muted h-4 rounded"></div>
                <div className="bg-muted h-10 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 arabic-text">المنتج غير موجود</h1>
          <Link href="/products">
            <Button>العودة للمنتجات</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredRelatedProducts = relatedProducts
    .filter(p => p.id !== product.id && p.isActive)
    .slice(0, 4);

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;

  // قائمة الصور مع نظام احتياطي محلي
  const defaultImage = "/uploads/da4e1b6084648e728d6e6039cb75445b.jpg";
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [defaultImage];

  const handleImagePreview = () => {
    setCurrentImageIndex(selectedImage);
    setShowImagePreview(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-8 max-w-full pb-24 md:pb-8">
        {/* Breadcrumb */}
        <nav className="mb-3 sm:mb-6 max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">الرئيسية</Link>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            <Link href="/products" className="hover:text-primary">المنتجات</Link>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-foreground arabic-text line-clamp-1 min-w-0">{product.nameAr}</span>
          </div>
        </nav>

        {/* Product Details */}
        <div className="grid md:grid-cols-2 gap-3 sm:gap-8 mb-4 sm:mb-10 max-w-full">
          {/* Images */}
          <div className="min-w-0">
            <div className="mb-3 sm:mb-4 relative group">
              <div className="w-full aspect-square sm:aspect-auto sm:h-[45vh] md:h-96 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md overflow-hidden flex items-center justify-center">
                <img
                  src={imageError ? defaultImage : productImages[selectedImage]}
                  alt={product.nameAr}
                  className="w-full h-full object-contain cursor-pointer transition-transform hover:scale-105"
                  onClick={handleImagePreview}
                  onError={() => setImageError(true)}
                />
              </div>

              {/* Image counter indicator */}
              {productImages.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full">
                  {selectedImage + 1} / {productImages.length}
                </div>
              )}
              
              {/* Camera Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none md:pointer-events-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white backdrop-blur-sm"
                  onClick={handleImagePreview}
                >
                  <Camera className="w-4 h-4 ml-2" />
                  معاينة الصور
                </Button>
              </div>
            </div>
            
            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2 sm:gap-2.5 overflow-x-auto scroll-smooth snap-x pb-2 -mx-1 px-1 no-scrollbar">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-12 h-12 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all snap-center ${
                      selectedImage === index ? "border-primary shadow-md" : "border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.nameAr} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = defaultImage;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="min-w-0">
            {/* Title block with badge aligned */}
            <div className="mb-3 sm:mb-4">
              <div className="flex items-start gap-2 mb-2">
                {hasDiscount && (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white text-[10px] sm:text-xs flex-shrink-0 mt-0.5">
                    -{discountPercentage}%
                  </Badge>
                )}
                <h1 className="text-sm sm:text-2xl md:text-3xl font-bold arabic-text leading-tight break-words flex-1 min-w-0">
                  {product.nameAr}
                </h1>
              </div>

              {/* Rating - compact aligned */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex text-yellow-400 items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  ))}
                </div>
                <span className="text-[11px] sm:text-sm text-muted-foreground leading-none">(127 تقييم)</span>
              </div>

              <p className="text-xs sm:text-base text-muted-foreground arabic-text line-clamp-3 sm:line-clamp-none leading-relaxed break-words">
                {product.descriptionAr}
              </p>
            </div>

            {/* Price + Stock - tighter spacing */}
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6 bg-gray-50 rounded-lg px-3 py-2 sm:p-4">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-lg sm:text-3xl font-bold text-primary leading-none">
                    {parseFloat(product.price).toLocaleString()}
                  </span>
                  <span className="text-xs sm:text-base text-muted-foreground">د.ع</span>
                  {hasDiscount && (
                    <span className="text-[11px] sm:text-lg text-muted-foreground line-through">
                      {parseFloat(product.originalPrice!).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {product.stock && product.stock > 0 ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px] sm:text-xs">
                    متوفر
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] sm:text-xs">نفدت الكمية</Badge>
                )}
              </div>
            </div>

            {/* Quantity + Add to Cart - same height, balanced (hide Add-to-Cart on mobile, sticky bar replaces it) */}
            <div className="hidden md:flex items-stretch gap-2 sm:gap-3 mb-3 sm:mb-6">
              <div className="flex items-center border rounded-md overflow-hidden flex-shrink-0 h-11 sm:h-12">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-full w-9 sm:w-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="تقليل الكمية"
                >
                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <span className="w-8 sm:w-10 text-center font-semibold text-sm sm:text-base select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.stock || quantity >= product.stock}
                  className="h-full w-9 sm:w-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold text-xs sm:text-base h-11 sm:h-12 min-w-0"
                onClick={handleAddToCart}
                disabled={!product.stock || product.stock === 0 || addToCartMutation.isPending}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 flex-shrink-0" />
                <span className="truncate">{addToCartMutation.isPending ? "جاري الإضافة..." : "أضف إلى السلة"}</span>
              </Button>
            </div>

            {/* Mobile-only quantity selector (Add-to-Cart is in sticky bar) */}
            <div className="flex md:hidden items-center justify-between gap-3 mb-3 bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-sm font-medium arabic-text">الكمية:</span>
              <div className="flex items-center border bg-white rounded-md overflow-hidden h-10">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-full w-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                  aria-label="تقليل الكمية"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-semibold text-sm select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.stock || quantity >= product.stock}
                  className="h-full w-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                  aria-label="زيادة الكمية"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button variant="outline" className="w-full mb-3 sm:mb-6 h-10 sm:h-11 text-xs sm:text-base">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
              أضف للمفضلة
            </Button>

            {/* Features - compact grid on mobile */}
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 sm:gap-3 bg-gray-50 sm:bg-transparent rounded-lg p-2.5 sm:p-0">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-right">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="arabic-text text-[10px] sm:text-sm leading-tight">شحن مجاني</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-right">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="arabic-text text-[10px] sm:text-sm leading-tight">ضمان الأصالة</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 text-center sm:text-right">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="arabic-text text-[10px] sm:text-sm leading-tight">إرجاع 30 يوم</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {filteredRelatedProducts.length > 0 && (
          <section className="mt-4 sm:mt-6">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-5 arabic-text">منتجات ذات صلة</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
              {filteredRelatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="product-card overflow-hidden">
                  <div className="relative group">
                    <img
                      src={relatedProduct.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
                      alt={relatedProduct.nameAr}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Link href={`/product/${relatedProduct.id}`}>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                        <Button 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all text-xs sm:text-sm"
                        >
                          عرض التفاصيل
                        </Button>
                      </div>
                    </Link>
                  </div>
                  <CardContent className="p-2 sm:p-4">
                    <h3 className="text-xs sm:text-base font-semibold mb-1 sm:mb-2 arabic-text line-clamp-2 leading-snug">{relatedProduct.nameAr}</h3>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm sm:text-lg font-bold text-primary">
                        {parseFloat(relatedProduct.price).toLocaleString()}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">د.ع</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky bottom Add-to-Cart bar (mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 px-3 py-2.5 safe-area-inset">
        <div className="flex items-stretch gap-2 max-w-screen-md mx-auto">
          <div className="flex flex-col justify-center flex-shrink-0 px-2">
            <span className="text-base font-bold text-primary leading-tight">
              {parseFloat(product.price).toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">د.ع</span>
          </div>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold text-sm h-11"
            onClick={handleAddToCart}
            disabled={!product.stock || product.stock === 0 || addToCartMutation.isPending}
          >
            <ShoppingCart className="w-4 h-4 ml-1.5 flex-shrink-0" />
            <span className="truncate">{addToCartMutation.isPending ? "جاري الإضافة..." : "أضف إلى السلة"}</span>
          </Button>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreview
        images={productImages}
        currentIndex={currentImageIndex}
        isOpen={showImagePreview}
        onClose={() => {
          setSelectedImage(currentImageIndex);
          setShowImagePreview(false);
        }}
        onIndexChange={setCurrentImageIndex}
      />
    </div>
  );
}
