import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Search, Users, Eye, ShoppingBag, Activity } from "lucide-react";
import type { Order, CustomerActivity } from "@shared/schema";

interface CustomerData {
  sessionId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalOrders: number;
  totalSpent: number;
  lastActivity: Date;
  status: "active" | "inactive";
}

export default function AdminCustomers() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: activities = [] } = useQuery<CustomerActivity[]>({
    queryKey: ["/api/analytics/activity"],
  });

  // Process customer data from orders
  const customers: CustomerData[] = orders.reduce((acc, order) => {
    const existing = acc.find(c => c.sessionId === order.sessionId);
    const orderTotal = parseFloat(order.totalAmount);
    
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += orderTotal;
      if (order.createdAt && new Date(order.createdAt) > existing.lastActivity) {
        existing.lastActivity = new Date(order.createdAt);
        existing.customerName = order.customerName || undefined;
        existing.customerPhone = order.customerPhone || undefined;
        existing.customerEmail = order.customerEmail || undefined;
      }
    } else {
      acc.push({
        sessionId: order.sessionId,
        customerName: order.customerName || undefined,
        customerPhone: order.customerPhone || undefined,
        customerEmail: order.customerEmail || undefined,
        totalOrders: 1,
        totalSpent: orderTotal,
        lastActivity: new Date(order.createdAt!),
        status: "active"
      });
    }
    
    return acc;
  }, [] as CustomerData[]);

  // Add activity data for customers without orders
  activities.forEach(activity => {
    if (!customers.find(c => c.sessionId === activity.sessionId)) {
      customers.push({
        sessionId: activity.sessionId,
        totalOrders: 0,
        totalSpent: 0,
        lastActivity: new Date(activity.timestamp!),
        status: "inactive"
      });
    }
  });

  // Update customer status based on recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  customers.forEach(customer => {
    customer.status = customer.lastActivity > thirtyDaysAgo ? "active" : "inactive";
  });

  // Sort by last activity
  customers.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

  const filteredCustomers = customers.filter(customer => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      customer.customerName?.toLowerCase().includes(searchTerm) ||
      customer.customerPhone?.includes(searchTerm) ||
      customer.customerEmail?.toLowerCase().includes(searchTerm) ||
      customer.sessionId.toLowerCase().includes(searchTerm)
    );
  });

  const activeCustomers = customers.filter(c => c.status === "active").length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = customers.length > 0 
    ? totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) 
    : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold arabic-text">إدارة العملاء</h1>
            <p className="text-muted-foreground arabic-text">
              عرض وتحليل بيانات العملاء
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">إجمالي العملاء</p>
                    <p className="text-2xl font-bold">{customers.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">عملاء نشطين</p>
                    <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">إجمالي الإيرادات</p>
                    <p className="text-2xl font-bold">{totalRevenue.toLocaleString()} د.ع</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">متوسط قيمة الطلب</p>
                    <p className="text-2xl font-bold">{avgOrderValue.toLocaleString()} د.ع</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="البحث في العملاء..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="text-sm text-muted-foreground arabic-text">
                  {filteredCustomers.length} عميل
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">قائمة العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 arabic-text">لا توجد بيانات عملاء</h3>
                  <p className="text-muted-foreground arabic-text">
                    {searchQuery ? "لم يتم العثور على عملاء مطابقين لبحثك" : "لا توجد بيانات عملاء متاحة"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="arabic-text">معرف الجلسة</TableHead>
                      <TableHead className="arabic-text">اسم العميل</TableHead>
                      <TableHead className="arabic-text">رقم الهاتف</TableHead>
                      <TableHead className="arabic-text">البريد الإلكتروني</TableHead>
                      <TableHead className="arabic-text">عدد الطلبات</TableHead>
                      <TableHead className="arabic-text">إجمالي المبلغ</TableHead>
                      <TableHead className="arabic-text">آخر نشاط</TableHead>
                      <TableHead className="arabic-text">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.sessionId}>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {customer.sessionId.slice(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="arabic-text">
                            {customer.customerName || "غير محدد"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span>{customer.customerPhone || "غير محدد"}</span>
                        </TableCell>
                        <TableCell>
                          <span>{customer.customerEmail || "غير محدد"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{customer.totalOrders}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {customer.totalSpent.toLocaleString()} د.ع
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {customer.lastActivity.toLocaleDateString('ar-EG')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={customer.status === "active" ? "default" : "secondary"}
                          >
                            {customer.status === "active" ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
