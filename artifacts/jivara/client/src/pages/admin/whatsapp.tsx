import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Send, CheckCircle, Phone, Loader2, AlertCircle } from "lucide-react";

export default function WhatsAppSetup() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const [verifyCode, setVerifyCode] = useState("");
  const [testPhone, setTestPhone] = useState("07819966698");
  const [step, setStep] = useState<"idle" | "code_sent" | "verified">("idle");

  const requestCodeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/request-code", { method: "SMS" }),
    onSuccess: () => {
      setStep("code_sent");
      toast({ title: "✅ تم إرسال الكود", description: "راجع رسائل SMS على رقم 07819966698" });
    },
    onError: (e: any) => {
      const isRateLimit = e.message?.includes("Rate Limit") || e.message?.includes("too many times") || e.message?.includes("unavailable");
      toast({
        title: isRateLimit ? "⏳ انتظر قليلاً" : "❌ خطأ",
        description: isRateLimit
          ? "ميتا تطلب الانتظار بسبب طلبات متكررة — جرب بعد بضع ساعات"
          : e.message,
        variant: "destructive"
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/verify-code", { code: verifyCode }),
    onSuccess: () => {
      setStep("verified");
      toast({ title: "✅ تم التفعيل!", description: "واتساب جاهز للإرسال التلقائي" });
    },
    onError: (e: any) => {
      toast({ title: "❌ كود خاطئ", description: e.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/test-send", { phone: testPhone }),
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "✅ أُرسلت!", description: `راجع واتساب على ${testPhone}` });
      } else {
        toast({ title: "❌ فشل الإرسال", description: data.error, variant: "destructive" });
      }
    },
    onError: (e: any) => {
      toast({ title: "❌ خطأ", description: e.message, variant: "destructive" });
    },
  });

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 p-6 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-green-600" />
            إعداد واتساب
          </h1>
          <p className="text-gray-500 text-sm mt-1">تفعيل الإرسال التلقائي لتأكيدات الطلبات</p>
        </div>

        {/* الحالة */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">حالة الرقم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <div className="font-medium">07819966698</div>
                <div className="text-sm text-gray-500">Phone ID: 987971091075564</div>
              </div>
              {step === "verified" ? (
                <span className="mr-auto flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle size={16} /> مفعّل
                </span>
              ) : (
                <span className="mr-auto flex items-center gap-1 text-orange-500 text-sm">
                  <AlertCircle size={16} /> يحتاج تفعيل
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* خطوات التفعيل */}
        {step !== "verified" && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">تفعيل الرقم</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 rounded p-3 text-sm text-blue-700">
                سيصلك كود SMS على رقم 07819966698 — أدخله هنا لتفعيل الإرسال التلقائي
              </div>

              <Button
                onClick={() => requestCodeMutation.mutate()}
                disabled={requestCodeMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {requestCodeMutation.isPending ? (
                  <><Loader2 className="animate-spin ml-2" size={16} /> جاري الإرسال...</>
                ) : (
                  <><Phone className="ml-2" size={16} /> أرسل كود التحقق SMS</>
                )}
              </Button>

              {step === "code_sent" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">أدخل الكود الذي وصل على هاتفك:</label>
                  <div className="flex gap-2">
                    <Input
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                    <Button
                      onClick={() => verifyMutation.mutate()}
                      disabled={verifyMutation.isPending || verifyCode.length < 6}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {verifyMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "تحقق"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* اختبار الإرسال */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">اختبار الإرسال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">رقم الاختبار:</label>
              <Input
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="07819966698"
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              variant="outline"
              className="w-full"
            >
              {testMutation.isPending ? (
                <><Loader2 className="animate-spin ml-2" size={16} /> جاري الإرسال...</>
              ) : (
                <><Send className="ml-2" size={16} /> إرسال رسالة اختبار</>
              )}
            </Button>
            {step !== "verified" && (
              <p className="text-xs text-gray-400 text-center">يجب تفعيل الرقم أولاً للإرسال</p>
            )}
          </CardContent>
        </Card>

        {step === "verified" && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
            <div className="font-bold text-green-800">واتساب مفعّل بنجاح!</div>
            <div className="text-sm text-green-700 mt-1">
              كل طلب جديد سيصل العميل رسالة تأكيد تلقائية على واتساب
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
