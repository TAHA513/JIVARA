import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/product-card";
import { Search, Filter } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Get category from URL params - recalculate on every location change
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");
  const searchFromUrl = urlParams.get("search");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", {
      categoryId: selectedCategory === "all" ? undefined : parseInt(selectedCategory),
      search: searchQuery || undefined,
      showOnJivara: true,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("showOnJivara", "true");
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    }
  });

  // Set initial category and search from URL - update when location changes
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    } else if (!categoryFromUrl && selectedCategory !== "all") {
      setSelectedCategory("all");
    }
    
    if (searchFromUrl && searchFromUrl !== searchQuery) {
      setSearchQuery(searchFromUrl);
    }
  }, [location]); // Depend on location to trigger on route changes

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "name":
        return a.nameAr.localeCompare(b.nameAr, "ar");
      default:
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 arabic-text">المنتجات</h1>
          <p className="text-sm sm:text-base text-muted-foreground arabic-text">اكتشف مجموعتنا الكاملة من الساعات والعطور الفاخرة</p>
        </div>

        {/* Filters */}
        <div className="mb-4 sm:mb-8 space-y-2 sm:space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-sm sm:text-base h-9 sm:h-10"
            />
          </div>

          {/* Category + Sort in one row on mobile */}
          <div className="flex gap-2 sm:gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1 sm:w-48 h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.nameAr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 sm:w-48 h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price-low">السعر: الأقل</SelectItem>
                <SelectItem value="price-high">السعر: الأعلى</SelectItem>
                <SelectItem value="name">الاسم أ-ي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-3 sm:mb-6">
          <p className="text-xs sm:text-sm text-muted-foreground arabic-text">
            {isLoading ? "جاري التحميل..." : `عُثر على ${sortedProducts.length} منتج`}
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-[4/3] rounded-lg mb-2 sm:mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-muted h-3 sm:h-4 rounded w-3/4"></div>
                  <div className="bg-muted h-3 sm:h-4 rounded w-1/2"></div>
                  <div className="bg-muted h-6 sm:h-8 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Filter className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2 arabic-text">لا توجد منتجات</h3>
            <p className="text-sm sm:text-base text-muted-foreground arabic-text">جرب تغيير معايير البحث أو الفلترة</p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-4 text-sm sm:text-base"
            >
              مسح الفلاتر
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Load More (if needed) */}
        {sortedProducts.length > 0 && sortedProducts.length % 12 === 0 && (
          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              تحميل المزيد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
