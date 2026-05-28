import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { pixelViewContent, pixelAddToCart, tiktokViewContent } from "@/lib/pixel";
import {
  Heart,
  Star,
  Truck,
  Shield,
  RotateCcw,
  Plus,
  Minus,
  ArrowRight,
  ShoppingCart,
  ChevronRight,
  X,
} from "lucide-react";
import { safeStorage } from "@/lib/safe-storage";
import type { Product } from "@shared/schema";
import ImagePreview from "@/components/ImagePreview";

const COLORS = {
  bg: "#050607",
  bg2: "#0B0D10",
  card: "#111318",
  cardLight: "#171A20",
  goldBorder: "rgba(212, 175, 55, 0.22)",
  gold: "#D4AF37",
  goldLight: "#F2C76E",
  goldDark: "#9C7428",
  textMain: "#F5F5F5",
  textSec: "#B8B8B8",
  textDim: "#7A7A7A",
};

const formatPrice = (v: string | number) =>
  parseFloat(String(v)).toLocaleString();

export default function JadafProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const { addToCart, totalItems } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: [`/api/products?categoryId=${product?.categoryId}&showOnJadaf=true`],
    enabled: !!product?.categoryId,
  });

  const lastAddRef = useRef<number>(0);
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product selected");
      await addToCart(product, quantity);
      const sessionId =
        safeStorage.getItem("sessionId") ||
        (() => {
          const newId = Math.random().toString(36).substring(7);
          safeStorage.setItem("sessionId", newId);
          return newId;
        })();
      await apiRequest("POST", "/api/activity", {
        sessionId,
        action: "add_to_cart",
        productId: product.id,
        metadata: { quantity },
      });
    },
    onSuccess: () => {
      if (product) {
        pixelAddToCart({
          contentIds: [String(product.id)],
          value: (parseFloat(product.price) * quantity) / 1500,
          numItems: quantity,
        });
      }
      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج إلى السلة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الإضافة",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    const now = Date.now();
    if (now - lastAddRef.current < 1500) return;
    if (addToCartMutation.isPending) return;
    lastAddRef.current = now;
    addToCartMutation.mutate();
  };

  const logViewMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      const sessionId =
        safeStorage.getItem("sessionId") ||
        (() => {
          const newId = Math.random().toString(36).substring(7);
          safeStorage.setItem("sessionId", newId);
          return newId;
        })();
      await apiRequest("POST", "/api/activity", {
        sessionId,
        action: "view_product",
        productId: product.id,
        metadata: {},
      });
    },
  });

  const hasLoggedRef = useRef(false);
  useEffect(() => {
    if (product?.id && !hasLoggedRef.current) {
      logViewMutation.mutate();
      pixelViewContent({
        contentName: product.name,
        contentIds: [String(product.id)],
        value: parseFloat(product.price) / 1500,
      });
      tiktokViewContent({
        contentName: product.name,
        contentIds: [String(product.id)],
        value: parseFloat(product.price) / 1500,
      });
      hasLoggedRef.current = true;
    }
  }, [product?.id, logViewMutation]);

  useEffect(() => {
    setImageError(false);
  }, [selectedImage]);

  useEffect(() => {
    document.title = product
      ? `${product.nameAr} | جداف`
      : "جداف — تجربة فاخرة";
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: COLORS.bg, color: COLORS.textMain }}>
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl h-[420px]" style={{ background: COLORS.card }} />
            <div className="space-y-4">
              <div className="h-8 rounded w-3/4" style={{ background: COLORS.card }} />
              <div className="h-6 rounded w-1/2" style={{ background: COLORS.card }} />
              <div className="h-32 rounded" style={{ background: COLORS.card }} />
              <div className="h-12 rounded w-1/3" style={{ background: COLORS.card }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: COLORS.bg, color: COLORS.textMain }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
          <Link href="/jadaf">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                color: "#0a0a0a",
              }}
            >
              العودة إلى جداف
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredRelatedProducts = relatedProducts
    .filter((p) => p.id !== product.id && p.isActive)
    .slice(0, 4);

  const hasDiscount =
    product.originalPrice &&
    parseFloat(product.originalPrice) > parseFloat(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(
        ((parseFloat(product.originalPrice!) - parseFloat(product.price)) /
          parseFloat(product.originalPrice!)) *
          100,
      )
    : 0;

  const defaultImage = "/uploads/da4e1b6084648e728d6e6039cb75445b.jpg";
  const productImages =
    product.images && product.images.length > 0 ? product.images : [defaultImage];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: COLORS.bg, color: COLORS.textMain }}
      dir="rtl"
    >
      {/* Jadaf top bar */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          background: "rgba(5,6,7,0.85)",
          borderBottom: `1px solid ${COLORS.goldBorder}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/jadaf">
            <button
              className="inline-flex items-center gap-2 text-sm font-bold"
              style={{ color: COLORS.goldLight }}
              data-testid="link-back-jadaf"
            >
              <ChevronRight className="w-4 h-4" />
              عودة إلى جداف
            </button>
          </Link>
          <Link href="/jadaf">
            <span
              className="text-lg font-extrabold tracking-[0.25em]"
              style={{
                background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold}, ${COLORS.goldDark})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              JADAF
            </span>
          </Link>
          {/* Cart icon */}
          <Link href="/jadaf/cart">
            <button
              className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.goldLight,
              }}
              aria-label="السلة"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -left-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.goldDark})`,
                    color: "#111",
                    minWidth: 18,
                    height: 18,
                  }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-28 md:pb-10">
        {/* Breadcrumb */}
        <nav className="mb-5 text-xs sm:text-sm" style={{ color: COLORS.textSec }}>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/jadaf" className="hover:underline" style={{ color: COLORS.goldLight }}>
              جداف
            </Link>
            <ArrowRight className="w-3.5 h-3.5" />
            <span className="line-clamp-1" style={{ color: COLORS.textMain }}>
              {product.nameAr}
            </span>
          </div>
        </nav>

        {/* Product */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10">
          {/* Images */}
          <div>
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.goldBorder}`,
              }}
            >
              <div className="w-full aspect-square flex items-center justify-center">
                <img
                  src={imageError ? defaultImage : productImages[selectedImage]}
                  alt={product.nameAr}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => {
                    setCurrentImageIndex(selectedImage);
                    setShowImagePreview(true);
                  }}
                  onError={() => setImageError(true)}
                />
              </div>
              {productImages.length > 1 && (
                <div
                  className="absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded-full font-bold"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    color: COLORS.goldLight,
                    border: `1px solid ${COLORS.goldBorder}`,
                  }}
                >
                  {selectedImage + 1} / {productImages.length}
                </div>
              )}
              {hasDiscount && (
                <div
                  className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                    color: "#0a0a0a",
                  }}
                >
                  خصم {discountPercentage}%
                </div>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden transition-all"
                    style={{
                      border:
                        selectedImage === index
                          ? `2px solid ${COLORS.gold}`
                          : `1px solid ${COLORS.goldBorder}`,
                      background: COLORS.card,
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.nameAr} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultImage;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold leading-tight mb-3">
              {product.nameAr}
            </h1>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center" style={{ color: COLORS.gold }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs" style={{ color: COLORS.textSec }}>
                (127 تقييم)
              </span>
            </div>

            {product.descriptionAr && (
              <p
                className="text-sm sm:text-base leading-relaxed mb-5"
                style={{ color: COLORS.textSec }}
              >
                {product.descriptionAr}
              </p>
            )}

            <div
              className="rounded-2xl p-4 mb-5 flex items-center justify-between gap-3"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.goldBorder}`,
              }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-2xl sm:text-3xl font-extrabold"
                  style={{ color: COLORS.goldLight }}
                >
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm" style={{ color: COLORS.textSec }}>
                  د.ع
                </span>
                {hasDiscount && (
                  <span
                    className="text-sm line-through"
                    style={{ color: COLORS.textDim }}
                  >
                    {formatPrice(product.originalPrice!)}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background:
                    product.stock && product.stock > 0
                      ? "rgba(212,175,55,0.15)"
                      : "rgba(255,80,80,0.15)",
                  color:
                    product.stock && product.stock > 0
                      ? COLORS.goldLight
                      : "#ff7676",
                  border: `1px solid ${
                    product.stock && product.stock > 0
                      ? COLORS.goldBorder
                      : "rgba(255,80,80,0.3)"
                  }`,
                }}
              >
                {product.stock && product.stock > 0 ? "متوفر" : "نفدت الكمية"}
              </span>
            </div>

            {/* Quantity + Add — desktop */}
            <div className="hidden md:flex items-stretch gap-3 mb-5">
              <div
                className="flex items-center rounded-xl overflow-hidden"
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.goldBorder}`,
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-11 h-12 flex items-center justify-center disabled:opacity-40"
                  style={{ color: COLORS.goldLight }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.stock || quantity >= product.stock}
                  className="w-11 h-12 flex items-center justify-center disabled:opacity-40"
                  style={{ color: COLORS.goldLight }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={
                  !product.stock ||
                  product.stock === 0 ||
                  addToCartMutation.isPending
                }
                className="flex-1 h-12 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: "#0a0a0a",
                  boxShadow: "0 8px 24px rgba(212,175,55,0.25)",
                }}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {addToCartMutation.isPending
                  ? "جاري الإضافة..."
                  : "أضف إلى السلة"}
              </button>
            </div>

            {/* Quantity — mobile */}
            <div
              className="flex md:hidden items-center justify-between gap-3 mb-4 rounded-xl px-3 py-2"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.goldBorder}`,
              }}
            >
              <span className="text-sm font-bold" style={{ color: COLORS.textSec }}>
                الكمية:
              </span>
              <div
                className="flex items-center rounded-lg overflow-hidden"
                style={{ background: COLORS.cardLight }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
                  style={{ color: COLORS.goldLight }}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!product.stock || quantity >= product.stock}
                  className="w-10 h-10 flex items-center justify-center disabled:opacity-40"
                  style={{ color: COLORS.goldLight }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              className="w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 mb-5"
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.goldBorder}`,
                color: COLORS.goldLight,
              }}
            >
              <Heart className="w-4 h-4" /> أضف للمفضلة
            </button>

            {/* Features */}
            <div
              className="grid grid-cols-3 gap-2 rounded-xl p-3"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.goldBorder}`,
              }}
            >
              {[
                { Icon: Truck, label: "شحن مجاني" },
                { Icon: Shield, label: "ضمان الأصالة" },
                { Icon: RotateCcw, label: "إرجاع 30 يوم" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <Icon className="w-5 h-5" style={{ color: COLORS.goldLight }} />
                  <span className="text-[11px] font-bold" style={{ color: COLORS.textSec }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {filteredRelatedProducts.length > 0 && (
          <section className="mt-10">
            <h2
              className="text-lg sm:text-2xl font-extrabold mb-4"
              style={{ color: COLORS.goldLight }}
            >
              منتجات قد تعجبك
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {filteredRelatedProducts.map((rp) => (
                <Link key={rp.id} href={`/jadaf/product/${rp.id}`}>
                  <div
                    className="rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                    style={{
                      background: COLORS.card,
                      border: `1px solid ${COLORS.goldBorder}`,
                    }}
                  >
                    <div
                      className="w-full aspect-square overflow-hidden"
                      style={{ background: COLORS.cardLight }}
                    >
                      <img
                        src={rp.images?.[0] || defaultImage}
                        alt={rp.nameAr}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultImage;
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs sm:text-sm font-bold line-clamp-2 mb-1.5">
                        {rp.nameAr}
                      </h3>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className="text-sm sm:text-base font-extrabold"
                          style={{ color: COLORS.goldLight }}
                        >
                          {formatPrice(rp.price)}
                        </span>
                        <span className="text-[10px]" style={{ color: COLORS.textSec }}>
                          د.ع
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky bottom bar — mobile & desktop */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-3 py-2.5"
        style={{
          background: "rgba(5,6,7,0.95)",
          borderTop: `1px solid ${COLORS.goldBorder}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-stretch gap-2 max-w-screen-md mx-auto">
          <div className="flex flex-col justify-center px-2 shrink-0">
            <span className="text-base font-extrabold leading-tight" style={{ color: COLORS.goldLight }}>
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px]" style={{ color: COLORS.textSec }}>د.ع</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!product.stock || product.stock === 0 || addToCartMutation.isPending}
            className="flex-1 h-11 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldDark})`,
              color: "#0a0a0a",
            }}
            data-testid="button-add-to-cart-mobile"
          >
            <ShoppingCart className="w-4 h-4" />
            {addToCartMutation.isPending ? "جاري الإضافة..." : "أضف إلى السلة"}
          </button>
          {totalItems > 0 && (
            <Link href="/jadaf/cart">
              <button
                className="relative h-11 px-3 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shrink-0"
                style={{
                  background: "rgba(212,175,55,0.15)",
                  border: `1px solid rgba(212,175,55,0.45)`,
                  color: COLORS.goldLight,
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span
                  className="absolute -top-1.5 -right-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.goldDark})`,
                    color: "#111",
                    minWidth: 18,
                    height: 18,
                  }}
                >
                  {totalItems}
                </span>
              </button>
            </Link>
          )}
        </div>
      </div>

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
