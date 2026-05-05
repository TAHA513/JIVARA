import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/admin/sidebar";
import StatsCard from "@/components/admin/stats-card";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package,
  TrendingUp,
  Activity,
  Eye,
  Heart,
  Plus,
  Palette,
  PieChart,
  ClipboardList,
  Calendar,
  Globe,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import type { CustomerActivity, Order } from "@shared/schema";

interface Stats {
  totalSales: string;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function AdminDashboard() {
  const { admin, isLoading: authLoading, isAuthenticated } = useAdminAuth();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
  });

  const { data: recentActivity = [] } = useQuery<CustomerActivity[]>({
    queryKey: ["/api/analytics/activity"],
    enabled: isAuthenticated,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 arabic-text">جاري التحقق من الصلاحية...</p>
        </div>
      </div>
    );
  }

  // Redirect handled by useAdminAuth hook
  if (!isAuthenticated) {
    return null;
  }

  // حساب الطلبات الجديدة (آخر 24 ساعة)
  const newOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    const orderDate = new Date(order.createdAt);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return orderDate >= yesterday;
  });

  // الطلبات قيد الانتظار
  const pendingOrders = orders.filter(order => order.status === 'pending');

  const { data: visitorStats } = useQuery<{
    totalVisitors: number;
    todayVisitors: number;
    countryCounts: Array<{ country: string; count: number }>;
  }>({
    queryKey: ["/api/analytics/visitors"],
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "add_to_cart":
        return <ShoppingBag className="w-4 h-4 text-white" />;
      case "view_product":
        return <Eye className="w-4 h-4 text-white" />;
      case "place_order":
        return <Package className="w-4 h-4 text-white" />;
      default:
        return <Activity className="w-4 h-4 text-white" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "add_to_cart":
        return "bg-green-500";
      case "view_product":
        return "bg-blue-500";
      case "place_order":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getActivityText = (action: string) => {
    switch (action) {
      case "add_to_cart":
        return "أضاف منتج للسلة";
      case "view_product":
        return "شاهد منتج";
      case "place_order":
        return "أنشأ طلب جديد";
      default:
        return action;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex flex-col lg:flex-row">
        <AdminSidebar />
        
        <div className="flex-1 p-3 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold arabic-text">لوحة التحكم</h1>
                <p className="text-sm sm:text-base text-muted-foreground arabic-text">جيفارا للتسوق</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  size="sm"
                  className="text-xs sm:text-sm arabic-text"
                >
                  تسجيل الخروج
                </Button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-muted-foreground">مرحباً,</p>
                    <p className="text-sm sm:text-base font-semibold arabic-text">المدير العام</p>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100" 
                    alt="صورة المدير" 
                    className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatsCard
              title="إجمالي المبيعات"
              value={stats?.totalSales ? `${stats.totalSales} د.ع` : "0 د.ع"}
              change="+12%"
              changeType="positive"
              icon={<DollarSign className="w-6 h-6" />}
              gradient="from-blue-500 to-blue-600"
            />
            
            <StatsCard
              title="الطلبات الجديدة"
              value={stats?.totalOrders.toString() || "0"}
              change="+8%"
              changeType="positive"
              icon={<ShoppingBag className="w-6 h-6" />}
              gradient="from-green-500 to-green-600"
            />
            
            <StatsCard
              title="العملاء النشطين"
              value={stats?.totalCustomers.toString() || "0"}
              change="+23%"
              changeType="positive"
              icon={<Users className="w-6 h-6" />}
              gradient="from-purple-500 to-purple-600"
            />
            
            <StatsCard
              title="المنتجات"
              value={stats?.totalProducts.toString() || "0"}
              change="+15"
              changeType="positive"
              icon={<Package className="w-6 h-6" />}
              gradient="from-orange-500 to-orange-600"
            />
          </div>

          {/* Visitor Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-cyan-700 arabic-text">إجمالي الزوار</CardTitle>
                <Eye className="w-4 h-4 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-900">{visitorStats?.totalVisitors || 0}</div>
                <p className="text-xs text-cyan-600 arabic-text">منذ بداية التشغيل</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700 arabic-text">زوار اليوم</CardTitle>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">{visitorStats?.todayVisitors || 0}</div>
                <p className="text-xs text-indigo-600 arabic-text">زائر جديد اليوم</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-teal-700 arabic-text">الدول</CardTitle>
                <Globe className="w-4 h-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-900">{visitorStats?.countryCounts?.length || 0}</div>
                <p className="text-xs text-teal-600 arabic-text">دولة مختلفة</p>
              </CardContent>
            </Card>
          </div>

          {/* Country Breakdown */}
          {visitorStats?.countryCounts && visitorStats.countryCounts.length > 0 && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg arabic-text flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  توزيع الزوار حسب البلدان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visitorStats.countryCounts.map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-medium arabic-text">{country.country}</span>
                      </div>
                      <Badge variant="secondary" className="arabic-text">
                        {country.count} زائر
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg arabic-text">تحليل المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-56 lg:h-64 bg-muted/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base arabic-text">رسم بياني للمبيعات الشهرية</p>
                    <p className="text-xs sm:text-sm arabic-text">سيتم تطوير الرسوم البيانية قريباً</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg arabic-text">نشاط العملاء المباشر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 text-muted-foreground">
                      <Activity className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                      <p className="text-sm sm:text-base arabic-text">لا توجد أنشطة حديثة</p>
                    </div>
                  ) : (
                    recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-2 sm:gap-3 lg:gap-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${getActivityColor(activity.action)} rounded-full flex items-center justify-center`}>
                          {getActivityIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium arabic-text truncate">جلسة: {activity.sessionId.slice(0, 8)}...</p>
                          <p className="text-xs sm:text-sm text-muted-foreground arabic-text">{getActivityText(activity.action)}</p>
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString('ar-EG') : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg arabic-text">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Link href="/admin/products">
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col gap-2 sm:gap-3 w-full hover:bg-primary/5 hover:border-primary"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span className="text-xs sm:text-sm font-medium arabic-text">إضافة منتج</span>
                  </Button>
                </Link>
                
                <Link href="/admin/settings">
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col gap-2 sm:gap-3 w-full hover:bg-primary/5 hover:border-primary"
                  >
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span className="text-xs sm:text-sm font-medium arabic-text">تخصيص المتجر</span>
                  </Button>
                </Link>
                
                <Link href="/admin/reports">
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col gap-2 sm:gap-3 w-full hover:bg-primary/5 hover:border-primary"
                  >
                    <PieChart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    <span className="text-xs sm:text-sm font-medium arabic-text">التقارير</span>
                  </Button>
                </Link>
                
                <Link href="/admin/orders">
                  <Button 
                    variant="outline" 
                    className="h-20 sm:h-24 flex-col gap-2 sm:gap-3 w-full hover:bg-primary/5 hover:border-primary relative"
                  >
                    <div className="relative">
                      <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      {(newOrders.length > 0 || pendingOrders.length > 0) && (
                        <Badge 
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center p-0 animate-pulse"
                        >
                          {newOrders.length + pendingOrders.length}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium arabic-text">إدارة الطلبات</span>
                    {newOrders.length > 0 && (
                      <span className="text-xs text-red-500 font-bold arabic-text">
                        {newOrders.length} طلب جديد
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
