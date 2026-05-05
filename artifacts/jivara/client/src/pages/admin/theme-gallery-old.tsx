import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Palette, 
  Check, 
  Star, 
  Sparkles, 
  Crown, 
  Gem,
  Leaf,
  Sun,
  Moon,
  Heart
} from "lucide-react";

interface Theme {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  icon: React.ReactNode;
  preview: string;
  category: string;
}

const themes: Theme[] = [
  {
    id: "default-original",
    name: "Original Classic",
    nameAr: "الثيم الأساسي المحفوظ",
    description: "The saved current theme - Your customized colors",
    descriptionAr: "الثيم المحفوظ بألوانك المخصصة - يمكنك العودة إليه في أي وقت",
    colors: {
      primary: "#1B365D",
      secondary: "#F4A460",
      accent: "#FF6B35",
      background: "#F5F7FA",
      text: "#1B365D"
    },
    icon: <Star className="w-6 h-6" />,
    preview: "الثيم المحفوظ بألوانك - للعودة إليه لاحقاً",
    category: "محفوظ"
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    nameAr: "الأزرق الملكي",
    description: "Elegant and professional blue theme",
    descriptionAr: "ثيم أزرق أنيق ومهني",
    colors: {
      primary: "#1e40af",
      secondary: "#3b82f6", 
      accent: "#60a5fa",
      background: "#f8fafc",
      text: "#1e293b"
    },
    icon: <Crown className="w-6 h-6" />,
    preview: "من الأزرق الداكن إلى الفاتح - مظهر احترافي",
    category: "classic"
  },
  {
    id: "emerald-luxury",
    name: "Emerald Luxury",
    nameAr: "الزمرد الفاخر", 
    description: "Luxurious green theme for premium stores",
    descriptionAr: "ثيم أخضر فاخر للمتاجر المميزة",
    colors: {
      primary: "#059669",
      secondary: "#10b981",
      accent: "#34d399", 
      background: "#f0fdf4",
      text: "#064e3b"
    },
    icon: <Gem className="w-6 h-6" />,
    preview: "أخضر زمردي فاخر - للمتاجر الراقية",
    category: "luxury"
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    nameAr: "دفء الغروب",
    description: "Warm orange and red sunset colors",
    descriptionAr: "ألوان دافئة برتقالية وحمراء كالغروب",
    colors: {
      primary: "#dc2626",
      secondary: "#f97316",
      accent: "#fb923c",
      background: "#fef7f0", 
      text: "#7c2d12"
    },
    icon: <Sun className="w-6 h-6" />,
    preview: "ألوان الغروب الدافئة - جو حميمي",
    category: "warm"
  },
  {
    id: "midnight-elegance", 
    name: "Midnight Elegance",
    nameAr: "أناقة منتصف الليل",
    description: "Dark elegant theme with purple accents",
    descriptionAr: "ثيم داكن أنيق بلمسات بنفسجية",
    colors: {
      primary: "#4c1d95",
      secondary: "#6d28d9", 
      accent: "#8b5cf6",
      background: "#0f0f23",
      text: "#e2e8f0"
    },
    icon: <Moon className="w-6 h-6" />,
    preview: "ثيم داكن أنيق - للمتاجر العصرية",
    category: "dark"
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    nameAr: "الذهب الوردي",
    description: "Feminine rose gold theme",
    descriptionAr: "ثيم ذهبي وردي أنثوي",
    colors: {
      primary: "#be185d",
      secondary: "#ec4899",
      accent: "#f9a8d4",
      background: "#fdf2f8",
      text: "#831843"
    },
    icon: <Heart className="w-6 h-6" />,
    preview: "ذهبي وردي ناعم - للمتاجر النسائية", 
    category: "feminine"
  },
  {
    id: "forest-natural",
    name: "Forest Natural", 
    nameAr: "الطبيعة الخضراء",
    description: "Natural green forest theme",
    descriptionAr: "ثيم أخضر طبيعي كالغابات",
    colors: {
      primary: "#166534",
      secondary: "#16a34a",
      accent: "#4ade80", 
      background: "#f7fdf7",
      text: "#14532d"
    },
    icon: <Leaf className="w-6 h-6" />,
    preview: "أخضر طبيعي هادئ - للمنتجات الطبيعية",
    category: "natural"
  }
];

export default function ThemeGallery() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const { toast } = useToast();

  const applyThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const theme = themes.find(t => t.id === themeId);
      if (!theme) throw new Error("Theme not found");
      
      // Apply primary color
      await apiRequest("POST", "/api/admin/settings", {
        key: "primary_color",
        value: theme.colors.primary
      });
      
      return theme;
    },
    onSuccess: (theme) => {
      toast({
        title: "تم تطبيق الثيم بنجاح",
        description: `تم تطبيق ثيم "${theme.nameAr}" على المتجر`,
      });
      
      // Refresh page to show new theme
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "خطأ في تطبيق الثيم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApplyTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    applyThemeMutation.mutate(themeId);
  };

  const categories = [
    { id: "محفوظ", name: "محفوظ", nameEn: "Saved" },
    { id: "أساسي", name: "أساسي", nameEn: "Original" },
    { id: "classic", name: "كلاسيكي", nameEn: "Classic" },
    { id: "luxury", name: "فاخر", nameEn: "Luxury" }, 
    { id: "warm", name: "دافئ", nameEn: "Warm" },
    { id: "dark", name: "داكن", nameEn: "Dark" },
    { id: "feminine", name: "نسائي", nameEn: "Feminine" },
    { id: "natural", name: "طبيعي", nameEn: "Natural" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Palette className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold arabic-text">معرض الثيمات</h1>
          <p className="text-gray-600 arabic-text">اختر الثيم المفضل لمتجرك</p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category.id} variant="outline" className="arabic-text">
            {category.name}
          </Badge>
        ))}
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <Card key={theme.id} className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-gray-600">{theme.icon}</div>
                  <div>
                    <CardTitle className="text-lg arabic-text">{theme.nameAr}</CardTitle>
                    <p className="text-sm text-gray-600">{theme.name}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {categories.find(c => c.id === theme.category)?.name}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Color Preview */}
              <div className="grid grid-cols-5 gap-1 h-12 rounded-lg overflow-hidden">
                <div 
                  className="flex-1" 
                  style={{ backgroundColor: theme.colors.primary }}
                  title="اللون الأساسي"
                />
                <div 
                  className="flex-1" 
                  style={{ backgroundColor: theme.colors.secondary }}
                  title="اللون الثانوي"
                />
                <div 
                  className="flex-1" 
                  style={{ backgroundColor: theme.colors.accent }}
                  title="لون التمييز"
                />
                <div 
                  className="flex-1" 
                  style={{ backgroundColor: theme.colors.background }}
                  title="لون الخلفية"
                />
                <div 
                  className="flex-1 border" 
                  style={{ backgroundColor: theme.colors.text }}
                  title="لون النص"
                />
              </div>

              {/* Preview Text */}
              <div 
                className="p-3 rounded-lg text-center"
                style={{ 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.primary}20`
                }}
              >
                <p className="text-sm arabic-text font-medium">{theme.preview}</p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 arabic-text">
                {theme.descriptionAr}
              </p>

              {/* Apply Button */}
              <Button
                onClick={() => handleApplyTheme(theme.id)}
                disabled={applyThemeMutation.isPending && selectedTheme === theme.id}
                className="w-full"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.background
                }}
              >
                {applyThemeMutation.isPending && selectedTheme === theme.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    جاري التطبيق...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 arabic-text">
                    <Check className="w-4 h-4" />
                    تطبيق هذا الثيم
                  </div>
                )}
              </Button>
            </CardContent>

            {/* Selected indicator */}
            {selectedTheme === theme.id && applyThemeMutation.isPending && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <div className="bg-white rounded-full p-3 shadow-lg">
                  <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Custom Theme Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-900 arabic-text">ثيم مخصص</h3>
              <p className="text-sm text-blue-700 arabic-text mt-1">
                هل تريد ثيم مخصص بألوان معينة؟ أخبرني بالألوان التي تفضلها وسأنشئ لك ثيم خاص!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}