import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ORDER_STATUSES } from "@/lib/constants";
import { ShoppingBag, Eye, Calendar, MapPin, Phone, User, X, RefreshCw, Truck, MessageCircle } from "lucide-react";
import type { Order } from "@shared/schema";

export default function AdminOrders() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الطلب",
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/cancel`, {});
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "تم إلغاء الطلب بنجاح",
        description: `تم إلغاء الطلب وخصم ${data.refundAmount} د.ع من الإيرادات`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء الطلب",
        description: error.message || "حدث خطأ أثناء إلغاء الطلب",
        variant: "destructive",
      });
    },
  });

  // ── واتساب ──
  const formatWaPhone = (phone: string) => {
    const c = phone.replace(/[\s\-\+\(\)]/g, "");
    if (c.startsWith("00964")) return c.replace("00964", "964");
    if (c.startsWith("964")) return c;
    if (c.startsWith("0")) return "964" + c.slice(1);
    return "964" + c;
  };

  const sendWhatsApp = (order: Order, msgType: "shipped" | "delivered" = "shipped") => {
    if (!order.customerPhone) return;
    const waPhone = formatWaPhone(order.customerPhone);
    const name = order.customerName || "زبون";
    const address = order.customerAddress || "—";
    const total = parseFloat(order.totalAmount).toLocaleString();

    const productLines = order.items.map((item) => {
      const subtotal = (parseFloat(item.price) * item.quantity).toLocaleString();
      return `• ${item.nameAr} × ${item.quantity}  ➜  ${subtotal} د.ع`;
    }).join("\n");

    let msg = "";
    if (msgType === "shipped") {
      msg =
`السلام عليكم ${name} 👋

✅ *تم خروج طلبك من الأنبار وسيصل إليك غداً بإذن الله* 🚚

━━━━━━━━━━━━━━━━━━
📦 *تفاصيل طلبك رقم #${order.id}*
━━━━━━━━━━━━━━━━━━
${productLines}
━━━━━━━━━━━━━━━━━━
💰 *المبلغ الكلي: ${total} د.ع*
📍 *عنوان التوصيل:* ${address}
━━━━━━━━━━━━━━━━━━

يرجى التواجد في العنوان غداً لاستلام الطلب 🙏
شكراً لتسوقك معنا ❤️
*جيفارا للتسوق* 🛍️`;
    } else if (msgType === "delivered") {
      msg =
`السلام عليكم ${name} 👋

✅ *تم توصيل طلبك رقم #${order.id} بنجاح*

━━━━━━━━━━━━━━━━━━
${productLines}
━━━━━━━━━━━━━━━━━━
💰 *المبلغ المدفوع: ${total} د.ع*
━━━━━━━━━━━━━━━━━━

نتمنى أن تكون راضياً عن منتجاتنا 😊
يسعدنا خدمتك دائماً ❤️
*جيفارا للتسوق* 🛍️`;
    }
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const syncAlwaseetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/alwaseet/sync", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "✅ تمت المزامنة", description: "تم تحديث حالات الطلبات من شركة الوسيط" });
    },
    onError: () => {
      toast({ title: "خطأ في المزامنة", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary", 
      shipped: "default",
      delivered: "secondary",
      cancelled: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === "all" || order.status === statusFilter
  );

  const getTotalAmount = (order: Order) => {
    return parseFloat(order.totalAmount).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold arabic-text">إدارة الطلبات</h1>
              <p className="text-muted-foreground arabic-text">
                عرض وإدارة جميع الطلبات
              </p>
            </div>
            <Button
              onClick={() => syncAlwaseetMutation.mutate()}
              disabled={syncAlwaseetMutation.isPending}
              variant="outline"
              className="arabic-text gap-2"
            >
              {syncAlwaseetMutation.isPending
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> جاري المزامنة...</>
                : <><Truck className="w-4 h-4" /> مزامنة الوسيط</>
              }
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">إجمالي الطلبات</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">قيد الانتظار</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {orders.filter(o => o.status === "pending").length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">مؤكدة</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {orders.filter(o => o.status === "confirmed").length}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground arabic-text">مكتملة</p>
                    <p className="text-2xl font-bold text-green-600">
                      {orders.filter(o => o.status === "delivered").length}
                    </p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4 items-center">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="تصفية حسب الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطلبات</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                    <SelectItem value="shipped">تم الشحن</SelectItem>
                    <SelectItem value="delivered">تم التوصيل</SelectItem>
                    <SelectItem value="cancelled">ملغية</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground arabic-text">
                  {filteredOrders.length} طلب
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">قائمة الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-muted-foreground arabic-text">جاري تحميل الطلبات...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2 arabic-text">لا توجد طلبات</h3>
                  <p className="text-muted-foreground arabic-text">
                    {statusFilter === "all" ? "لم يتم إنشاء أي طلبات بعد" : "لا توجد طلبات بهذه الحالة"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="arabic-text">رقم الطلب</TableHead>
                      <TableHead className="arabic-text">العميل</TableHead>
                      <TableHead className="arabic-text">المبلغ الكلي</TableHead>
                      <TableHead className="arabic-text">عدد المنتجات</TableHead>
                      <TableHead className="arabic-text">الحالة</TableHead>
                      <TableHead className="arabic-text">التاريخ</TableHead>
                      <TableHead className="arabic-text">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono">#{order.id}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium arabic-text">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">{getTotalAmount(order)} د.ع</span>
                        </TableCell>
                        <TableCell>
                          <span>{order.items.length} منتج</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(order.status)}
                            {(order as any).alwaseetQrId && (
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <Truck className="w-3 h-3" />{(order as any).alwaseetQrId}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : ''}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* زر واتساب — تم الشحن */}
                            <Button
                              size="sm"
                              className="h-8 bg-green-500 hover:bg-green-600 text-white px-2"
                              title="أرسل رسالة واتساب: تم الشحن"
                              onClick={() => sendWhatsApp(order, "shipped")}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="arabic-text">
                                    تفاصيل الطلب #{selectedOrder?.id}
                                  </DialogTitle>
                                </DialogHeader>
                                
                                {selectedOrder && (
                                  <div className="space-y-6">
                                    {/* Customer Info */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div className="space-y-3">
                                        <h4 className="font-semibold arabic-text">معلومات العميل</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <span className="arabic-text">{selectedOrder.customerName}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            <span>{selectedOrder.customerPhone}</span>
                                          </div>
                                          {selectedOrder.customerEmail && (
                                            <div className="flex items-center gap-2">
                                              <span>📧</span>
                                              <span>{selectedOrder.customerEmail}</span>
                                            </div>
                                          )}
                                          <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                            <div>
                                              <p className="arabic-text">{selectedOrder.city}</p>
                                              <p className="arabic-text">{selectedOrder.shippingAddress}</p>
                                            </div>
                                          </div>
                                          {selectedOrder.notes && (
                                            <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                              <span className="text-amber-600">📝</span>
                                              <div>
                                                <p className="text-xs font-semibold text-amber-700 arabic-text">ملاحظات الزبون:</p>
                                                <p className="arabic-text text-sm text-amber-800">{selectedOrder.notes}</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <h4 className="font-semibold arabic-text">معلومات الطلب</h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span className="arabic-text">رقم الطلب:</span>
                                            <span className="font-mono">#{selectedOrder.id}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="arabic-text">التاريخ:</span>
                                            <span>
                                              {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG') : ''}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="arabic-text">الحالة:</span>
                                            {getStatusBadge(selectedOrder.status)}
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="arabic-text">المبلغ الكلي:</span>
                                            <span className="font-semibold">{getTotalAmount(selectedOrder)} د.ع</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Al-Waseet Tracking */}
                                    {(selectedOrder as any).alwaseetQrId && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <h4 className="font-semibold mb-2 arabic-text text-blue-800 flex items-center gap-2">
                                          <Truck className="w-4 h-4" /> شركة الوسيط للتوصيل
                                        </h4>
                                        <div className="space-y-1 text-sm">
                                          <div className="flex justify-between">
                                            <span className="arabic-text text-blue-700">رقم الشحنة:</span>
                                            <span className="font-mono font-bold text-blue-900">{(selectedOrder as any).alwaseetQrId}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="arabic-text text-blue-700">حالة التوصيل:</span>
                                            <span className="arabic-text text-blue-900">{(selectedOrder as any).alwaseetStatus || '—'}</span>
                                          </div>
                                          {(selectedOrder as any).alwaseetSyncAt && (
                                            <div className="flex justify-between">
                                              <span className="arabic-text text-blue-700">آخر تحديث:</span>
                                              <span className="text-blue-800">{new Date((selectedOrder as any).alwaseetSyncAt).toLocaleString('ar-EG')}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Order Items */}
                                    <div>
                                      <h4 className="font-semibold mb-3 arabic-text">منتجات الطلب</h4>
                                      <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {selectedOrder.items.map((item, index) => (
                                          <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                            {item.image && (
                                              <img
                                                src={item.image}
                                                alt={item.nameAr}
                                                className="w-12 h-12 object-cover rounded-lg"
                                              />
                                            )}
                                            <div className="flex-1">
                                              <p className="font-medium arabic-text">{item.nameAr}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {parseFloat(item.price).toLocaleString()} د.ع × {item.quantity}
                                              </p>
                                            </div>
                                            <div className="text-left">
                                              <p className="font-semibold">
                                                {(parseFloat(item.price) * item.quantity).toLocaleString()} د.ع
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* إرسال واتساب */}
                                    {selectedOrder.customerPhone && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <h4 className="font-semibold mb-2 arabic-text text-green-800 flex items-center gap-2">
                                          <MessageCircle className="w-4 h-4" /> إرسال إشعار واتساب
                                        </h4>
                                        <p className="text-xs text-green-700 arabic-text mb-2">
                                          سترسل رسالة جاهزة للزبون على واتساب تلقائياً
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                          <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600 text-white arabic-text gap-1.5"
                                            onClick={() => sendWhatsApp(selectedOrder, "shipped")}
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            تم الشحن 🚚
                                          </Button>
                                          <Button
                                            size="sm"
                                            className="bg-green-700 hover:bg-green-800 text-white arabic-text gap-1.5"
                                            onClick={() => sendWhatsApp(selectedOrder, "delivered")}
                                          >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            تم التوصيل ✅
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Status Update and Cancel */}
                                    <div>
                                      <h4 className="font-semibold mb-3 arabic-text">تحديث حالة الطلب</h4>
                                      <div className="flex gap-2">
                                        <Select
                                          value={selectedOrder.status}
                                          onValueChange={(status) => {
                                            updateStatusMutation.mutate({
                                              orderId: selectedOrder.id,
                                              status
                                            });
                                            setSelectedOrder(prev => prev ? { ...prev, status } : null);
                                          }}
                                        >
                                          <SelectTrigger className="w-48">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">قيد الانتظار</SelectItem>
                                            <SelectItem value="confirmed">مؤكد</SelectItem>
                                            <SelectItem value="shipped">تم الشحن</SelectItem>
                                            <SelectItem value="delivered">تم التوصيل</SelectItem>
                                            <SelectItem value="cancelled">ملغي</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        
                                        {selectedOrder.status !== 'cancelled' && (
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                              if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم خصم المبلغ من الإيرادات.')) {
                                                cancelOrderMutation.mutate(selectedOrder.id);
                                              }
                                            }}
                                            disabled={cancelOrderMutation.isPending}
                                          >
                                            <X className="w-4 h-4 mr-1" />
                                            إلغاء الطلب
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <Select
                              value={order.status}
                              onValueChange={(status) => {
                                updateStatusMutation.mutate({
                                  orderId: order.id,
                                  status
                                });
                              }}
                            >
                              <SelectTrigger className="w-32 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">قيد الانتظار</SelectItem>
                                <SelectItem value="confirmed">مؤكد</SelectItem>
                                <SelectItem value="shipped">تم الشحن</SelectItem>
                                <SelectItem value="delivered">تم التوصيل</SelectItem>
                                <SelectItem value="cancelled">ملغي</SelectItem>
                              </SelectContent>
                            </Select>

                            {order.status !== 'cancelled' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟ سيتم خصم المبلغ من الإيرادات.')) {
                                    cancelOrderMutation.mutate(order.id);
                                  }
                                }}
                                disabled={cancelOrderMutation.isPending}
                                className="h-8"
                                title="إلغاء الطلب"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
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
