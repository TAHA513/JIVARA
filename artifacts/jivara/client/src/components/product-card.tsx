import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Star, Eye, Camera } from "lucide-react";
import { safeStorage } from "@/lib/safe-storage";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import ImagePreview from "./ImagePreview";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await addToCart(product, 1);

      // Log activity (best-effort, must not fail the cart op)
      try {
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
          metadata: { quantity: 1 }
        });
      } catch {}
    },
    onSuccess: () => {
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

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;
  
  // قائمة الصور مع نظام احتياطي محلي
  const defaultImage = "/uploads/da4e1b6084648e728d6e6039cb75445b.jpg";
  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : [defaultImage];

  const handleImagePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(0);
    setShowImagePreview(true);
  };

  return (
    <div 
      className="mobile-card group cursor-pointer w-full overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <img
          src={imageError ? defaultImage : productImages[0]}
          alt={product.nameAr}
          className="w-full aspect-[4/3] sm:h-52 md:h-60 object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl cursor-pointer"
          onClick={handleImagePreview}
          onError={() => setImageError(true)}
        />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 space-y-2">
          {hasDiscount && (
            <Badge className="bg-red-500 text-white rounded-lg text-xs">
              خصم {discountPercentage}%
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-blue-500 text-white rounded-lg text-xs">
              مميز
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" className="rounded-lg text-xs">
              نفدت الكمية
            </Badge>
          )}
        </div>

        {/* Image Preview and Wishlist Buttons */}
        <div className={`absolute top-3 left-3 flex flex-col gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button 
            size="sm" 
            variant="secondary" 
            className="rounded-xl p-2 bg-white/90 hover:bg-white backdrop-blur-sm"
            onClick={handleImagePreview}
            title="معاينة الصور"
          >
            <Camera className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="secondary" className="rounded-xl p-2 bg-white/90 hover:bg-white backdrop-blur-sm">
            <Heart className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick View Overlay */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity rounded-xl ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Link href={`/product/${product.id}`}>
            <Button 
              size="sm" 
              className="mobile-button bg-white text-primary hover:bg-gray-100 transform transition-all backdrop-blur-sm"
            >
              <Eye className="w-4 h-4 ml-2" />
              عرض سريع
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 arabic-text hover:text-primary transition-colors line-clamp-2 leading-snug">
            {product.nameAr}
          </h3>
        </Link>
        
        <p className="text-muted-foreground text-xs sm:text-sm mb-2 sm:mb-3 arabic-text line-clamp-1 sm:line-clamp-2 hidden sm:block">
          {product.descriptionAr}
        </p>

        <div className="mobile-friendly-divider my-2 sm:my-3"></div>

        {/* Rating - Hidden on mobile to save space */}
        <div className="hidden sm:flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-muted-foreground text-sm">(127 تقييم)</span>
        </div>

        {/* Price */}
        <div className="flex items-center flex-wrap gap-1 mb-2 sm:mb-4">
          <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">
            {parseFloat(product.price).toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">د.ع</span>
          {hasDiscount && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through mr-1">
              {parseFloat(product.originalPrice!).toLocaleString()}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mb-2 sm:mb-4">
          {product.stock && product.stock > 0 ? (
            <span className="text-green-600 text-xs sm:text-sm arabic-text bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">
              متوفر ({product.stock})
            </span>
          ) : (
            <span className="text-red-600 text-xs sm:text-sm arabic-text bg-red-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg">نفدت الكمية</span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button 
          className="w-full mobile-button bg-primary hover:bg-primary/90 text-black font-semibold text-xs sm:text-sm py-2 sm:py-3 h-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCartMutation.mutate();
          }}
          disabled={!product.stock || product.stock === 0 || addToCartMutation.isPending}
        >
          {addToCartMutation.isPending ? "جاري الإضافة..." : "أضف إلى السلة"}
        </Button>
      </div>

      {/* Image Preview Modal */}
      <ImagePreview
        images={productImages}
        currentIndex={currentImageIndex}
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </div>
  );
}
