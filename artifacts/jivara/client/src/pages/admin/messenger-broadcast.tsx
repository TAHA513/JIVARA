import { useState } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  MessageCircle, Send, Users, Clock, DollarSign, Zap,
  Settings, ArrowRight, CheckCircle, AlertTriangle, Info,
  ChevronLeft, RefreshCw, Eye, Star
} from "lucide-react";

const D_BG     = "#0B0F14";
const D_SEC    = "#121821";
const D_CARD   = "#161B22";
const D_BORDER = "#222B36";
const D_TEXT   = "#E8EAED";
const D_MUTED  = "#9EA3B0";
const FB_BLUE  = "#1877F2";
const MSG_PURPLE = "#8B5CF6";

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: D_CARD, border: `1px solid ${D_BORDER}`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export default function MessengerBroadcast() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();

  const [pageToken, setPageToken] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("تسوق الآن");
  const [buttonUrl, setButtonUrl] = useState("https://jivarashopping.com");
  const [includeButton, setIncludeButton] = useState(true);

  const [stats, setStats] = useState<{ total: number; recent24h: number; psids?: string[] } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [mode, setMode] = useState<"free" | "sponsored">("free");
  const [step, setStep] = useState<"compose" | "confirm" | "done">("compose");

  if (authLoading) return <div style={{ background: D_BG, minHeight: "100vh" }} />;
  if (!isAuthenticated) return null;

  async function saveToken() {
    if (!pageToken.trim()) return;
    setSavingToken(true);
    try {
      await apiRequest("POST", "/api/messenger/save-token", { token: pageToken });
      setSavedToken(pageToken);
      setTokenSaved(true);
      toast({ title: "✅ تم حفظ التوكن" });
    } catch {
      toast({ title: "❌ فشل حفظ التوكن", variant: "destructive" });
    } finally {
      setSavingToken(false);
    }
  }

  async function loadStats() {
    setLoadingStats(true);
    try {
      const data = await apiRequest("GET", "/api/messenger/conversations");
      setStats(data);
    } catch (e: any) {
      toast({ title: "❌ " + (e.message || "فشل تحميل البيانات"), variant: "destructive" });
    } finally {
      setLoadingStats(false);
    }
  }

  async function sendBroadcast() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const payload = {
        message: message.trim(),
        includeButton,
        buttonText: includeButton ? buttonText : undefined,
        buttonUrl: includeButton ? buttonUrl : undefined,
        mode,
      };
      const res = await apiRequest("POST", "/api/messenger/broadcast", payload);
      setSentCount(res.sent || 0);
      setStep("done");
      toast({ title: `✅ تم الإرسال لـ ${res.sent} شخص` });
    } catch (e: any) {
      toast({ title: "❌ " + (e.message || "فشل الإرسال"), variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const charCount = message.length;
  const estimatedCost = stats ? ((stats.total * 0.01)).toFixed(2) : "—";
  const reachFree = stats?.recent24h || 0;
  const reachAll = stats?.total || 0;

  return (
    <div style={{ background: D_BG, minHeight: "100vh", color: D_TEXT }} dir="rtl">

      {/* Header */}
      <div style={{ background: D_CARD, borderBottom: `1px solid ${D_BORDER}`, padding: "16px 24px" }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)", borderRadius: 12, padding: 10 }}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold arabic-text" style={{ color: D_TEXT }}>إرسال جماعي — ماسنجر</h1>
            <p className="text-xs arabic-text" style={{ color: D_MUTED }}>أرسل عرضك لكل من راسلك دفعة واحدة</p>
          </div>
        </div>
        <Link href="/admin">
          <button className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg" style={{ color: D_MUTED, background: D_SEC, border: `1px solid ${D_BORDER}` }}>
            <ChevronLeft className="w-4 h-4" /> لوحة التحكم
          </button>
        </Link>
      </div>

      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

        {/* إعداد التوكن */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4" style={{ color: MSG_PURPLE }} />
            <span className="font-bold text-sm arabic-text">إعداد Page Access Token</span>
            {tokenSaved && <span className="text-xs px-2 py-0.5 rounded-full arabic-text" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>✓ محفوظ</span>}
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={pageToken}
              onChange={e => setPageToken(e.target.value)}
              placeholder="EAABxx... توكن صفحة فيسبوك"
              className="flex-1 text-sm px-3 py-2.5 rounded-xl outline-none arabic-text"
              style={{ background: D_SEC, border: `1px solid ${D_BORDER}`, color: D_TEXT }}
            />
            <button onClick={saveToken} disabled={savingToken || !pageToken.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-bold arabic-text"
              style={{ background: FB_BLUE, color: "white", opacity: savingToken || !pageToken.trim() ? 0.5 : 1 }}>
              {savingToken ? "جاري..." : "حفظ"}
            </button>
          </div>
          <div className="mt-3 p-3 rounded-xl text-xs arabic-text" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#60A5FA" }} />
              <div style={{ color: D_MUTED }}>
                <p className="mb-1">للحصول على التوكن: <strong style={{ color: D_TEXT }}>Meta Business Suite ← الإعدادات ← التكاملات ← الوصول إلى واجهة API</strong></p>
                <p>الصلاحيات المطلوبة: <code style={{ color: "#A78BFA" }}>pages_messaging</code> + <code style={{ color: "#A78BFA" }}>pages_read_engagement</code></p>
              </div>
            </div>
          </div>
        </Card>

        {/* إحصائيات المحادثات */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#34D399" }} />
              <span className="font-bold text-sm arabic-text">إحصائيات المحادثات</span>
            </div>
            <button onClick={loadStats} disabled={loadingStats}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg arabic-text"
              style={{ background: D_SEC, color: D_MUTED, border: `1px solid ${D_BORDER}` }}>
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
              {loadingStats ? "جاري التحميل..." : "تحميل الإحصائيات"}
            </button>
          </div>

          {stats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-4 rounded-xl" style={{ background: D_SEC }}>
                <div className="text-2xl font-black mb-1" style={{ color: "#34D399" }}>{stats.total.toLocaleString()}</div>
                <div className="text-xs arabic-text" style={{ color: D_MUTED }}>إجمالي المحادثات</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: D_SEC }}>
                <div className="text-2xl font-black mb-1" style={{ color: "#60A5FA" }}>{stats.recent24h.toLocaleString()}</div>
                <div className="text-xs arabic-text" style={{ color: D_MUTED }}>نشطون (24 ساعة)</div>
                <div className="text-xs mt-1" style={{ color: "#34D399" }}>مجاناً ✓</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{ background: D_SEC }}>
                <div className="text-2xl font-black mb-1" style={{ color: "#FBBF24" }}>${estimatedCost}</div>
                <div className="text-xs arabic-text" style={{ color: D_MUTED }}>تكلفة إرسال الكل</div>
                <div className="text-xs mt-1" style={{ color: D_MUTED }}>≈ $0.01 / شخص</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: D_MUTED }}>
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm arabic-text">اضغط "تحميل الإحصائيات" لرؤية عدد المحادثات</p>
            </div>
          )}
        </Card>

        {/* اختيار النوع */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setMode("free")}
            className="p-4 rounded-xl text-right transition-all"
            style={{
              background: mode === "free" ? "rgba(52,211,153,0.1)" : D_CARD,
              border: `2px solid ${mode === "free" ? "#34D399" : D_BORDER}`
            }}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" style={{ color: "#34D399" }} />
              <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>إرسال مجاني</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.2)", color: "#34D399" }}>مجاناً</span>
            </div>
            <p className="text-xs arabic-text" style={{ color: D_MUTED }}>للأشخاص الذين راسلوك خلال آخر 24 ساعة فقط</p>
          </button>
          <button onClick={() => setMode("sponsored")}
            className="p-4 rounded-xl text-right transition-all"
            style={{
              background: mode === "sponsored" ? "rgba(251,191,36,0.1)" : D_CARD,
              border: `2px solid ${mode === "sponsored" ? "#FBBF24" : D_BORDER}`
            }}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4" style={{ color: "#FBBF24" }} />
              <span className="font-bold text-sm arabic-text" style={{ color: D_TEXT }}>إرسال ممول</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.2)", color: "#FBBF24" }}>مدفوع</span>
            </div>
            <p className="text-xs arabic-text" style={{ color: D_MUTED }}>لجميع من راسلك بأي وقت سابق — ≈ $0.01 لكل شخص</p>
          </button>
        </div>

        {/* كتابة الرسالة */}
        {step === "compose" && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-4 h-4" style={{ color: FB_BLUE }} />
              <span className="font-bold text-sm arabic-text">كتابة الرسالة</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs arabic-text mb-2 block" style={{ color: D_MUTED }}>نص الرسالة</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="مثال: 🎁 عرض خاص لك! خصم 20% على جميع الساعات اليوم فقط. لا تفوّت الفرصة..."
                  rows={4}
                  className="w-full text-sm px-3 py-3 rounded-xl outline-none arabic-text resize-none"
                  style={{ background: D_SEC, border: `1px solid ${D_BORDER}`, color: D_TEXT }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: charCount > 640 ? "#EF4444" : D_MUTED }}>{charCount}/640 حرف</span>
                </div>
              </div>

              {/* زر الرابط */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="includeBtn" checked={includeButton} onChange={e => setIncludeButton(e.target.checked)}
                    className="w-4 h-4 rounded" />
                  <label htmlFor="includeBtn" className="text-sm arabic-text cursor-pointer" style={{ color: D_TEXT }}>
                    إضافة زر رابط (اختياري)
                  </label>
                </div>
                {includeButton && (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={buttonText} onChange={e => setButtonText(e.target.value)}
                      placeholder="نص الزر"
                      className="text-sm px-3 py-2.5 rounded-xl outline-none arabic-text"
                      style={{ background: D_SEC, border: `1px solid ${D_BORDER}`, color: D_TEXT }} />
                    <input value={buttonUrl} onChange={e => setButtonUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-sm px-3 py-2.5 rounded-xl outline-none"
                      style={{ background: D_SEC, border: `1px solid ${D_BORDER}`, color: D_TEXT }} />
                  </div>
                )}
              </div>

              {/* معاينة */}
              {message && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye className="w-3.5 h-3.5" style={{ color: D_MUTED }} />
                    <span className="text-xs arabic-text" style={{ color: D_MUTED }}>معاينة الرسالة</span>
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: D_SEC }}>
                    <div className="inline-block max-w-xs p-3 rounded-2xl rounded-tl-sm text-sm arabic-text whitespace-pre-wrap"
                      style={{ background: FB_BLUE, color: "white" }}>
                      {message}
                    </div>
                    {includeButton && buttonText && (
                      <div className="mt-2">
                        <div className="inline-block px-4 py-2 rounded-xl text-xs font-bold arabic-text"
                          style={{ background: "rgba(24,119,242,0.15)", color: FB_BLUE, border: `1px solid rgba(24,119,242,0.3)` }}>
                          {buttonText} →
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ملخص */}
              <div className="p-4 rounded-xl" style={{ background: D_SEC }}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-bold" style={{ color: mode === "free" ? "#34D399" : "#FBBF24" }}>
                      {mode === "free" ? reachFree.toLocaleString() : reachAll.toLocaleString()}
                    </div>
                    <div className="text-xs arabic-text" style={{ color: D_MUTED }}>سيصلهم الرسالة</div>
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: D_TEXT }}>
                      {mode === "free" ? "مجاناً" : `$${estimatedCost}`}
                    </div>
                    <div className="text-xs arabic-text" style={{ color: D_MUTED }}>التكلفة</div>
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: "#60A5FA" }}>60-80%</div>
                    <div className="text-xs arabic-text" style={{ color: D_MUTED }}>معدل الفتح</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep("confirm")}
                disabled={!message.trim() || charCount > 640}
                className="w-full py-3 rounded-xl font-bold text-sm arabic-text transition-all"
                style={{
                  background: message.trim() && charCount <= 640
                    ? `linear-gradient(135deg, ${MSG_PURPLE}, #6D28D9)`
                    : D_BORDER,
                  color: message.trim() && charCount <= 640 ? "white" : D_MUTED
                }}>
                <div className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  المتابعة للإرسال
                </div>
              </button>
            </div>
          </Card>
        )}

        {/* تأكيد الإرسال */}
        {step === "confirm" && (
          <Card style={{ border: "1px solid rgba(251,191,36,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" style={{ color: "#FBBF24" }} />
              <span className="font-bold arabic-text">تأكيد الإرسال</span>
            </div>

            <div className="p-4 rounded-xl mb-4 arabic-text text-sm" style={{ background: D_SEC, color: D_TEXT, lineHeight: 2 }}>
              <strong>الرسالة:</strong><br />
              <span style={{ color: D_MUTED }}>{message}</span>
              {includeButton && buttonText && (
                <><br /><strong>الزر:</strong> <span style={{ color: "#60A5FA" }}>{buttonText}</span></>
              )}
            </div>

            <div className="p-3 rounded-xl mb-4 text-sm arabic-text" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#FCD34D" }}>
              ⚠️ ستُرسل هذه الرسالة لـ <strong>{mode === "free" ? reachFree : reachAll}</strong> شخص
              {mode === "sponsored" && ` بتكلفة تقريبية $${estimatedCost}`}
              . هذا الإجراء لا يمكن التراجع عنه.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setStep("compose")}
                className="py-3 rounded-xl text-sm font-bold arabic-text"
                style={{ background: D_SEC, color: D_MUTED, border: `1px solid ${D_BORDER}` }}>
                العودة للتعديل
              </button>
              <button onClick={sendBroadcast} disabled={sending}
                className="py-3 rounded-xl text-sm font-bold arabic-text"
                style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)", color: "white", opacity: sending ? 0.7 : 1 }}>
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> جاري الإرسال...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" /> إرسال الآن
                  </span>
                )}
              </button>
            </div>
          </Card>
        )}

        {/* اكتمل الإرسال */}
        {step === "done" && (
          <Card style={{ border: "1px solid rgba(52,211,153,0.3)" }}>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(52,211,153,0.15)" }}>
                <CheckCircle className="w-8 h-8" style={{ color: "#34D399" }} />
              </div>
              <h2 className="text-xl font-black mb-2 arabic-text" style={{ color: D_TEXT }}>تم الإرسال بنجاح! 🎉</h2>
              <p className="text-sm arabic-text mb-1" style={{ color: D_MUTED }}>
                تم إرسال رسالتك لـ <strong style={{ color: "#34D399" }}>{sentCount.toLocaleString()}</strong> شخص
              </p>
              <p className="text-xs arabic-text mb-6" style={{ color: D_MUTED }}>معدل الفتح المتوقع: 60-80% خلال أول ساعة</p>
              <button onClick={() => { setStep("compose"); setMessage(""); setSentCount(0); }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold arabic-text"
                style={{ background: FB_BLUE, color: "white" }}>
                إرسال رسالة جديدة
              </button>
            </div>
          </Card>
        )}

        {/* نصائح */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" style={{ color: "#FBBF24" }} />
            <span className="font-bold text-sm arabic-text">نصائح لزيادة التفاعل</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: "⏰", tip: "أفضل وقت للإرسال: 7-9 مساءً (ساعة ذروة نشاطك)" },
              { icon: "🎯", tip: "ابدأ برسالة قصيرة وواضحة مع عرض محدود الوقت" },
              { icon: "💬", tip: "أضف إيموجي في البداية لجذب الانتباه" },
              { icon: "🔗", tip: "أضف زر رابط مباشر لصفحة المنتج لا للرئيسية" },
              { icon: "📊", tip: "لا ترسل أكثر من مرة أسبوعياً لنفس الأشخاص" },
            ].map(({ icon, tip }) => (
              <div key={tip} className="flex items-start gap-2 text-xs arabic-text" style={{ color: D_MUTED }}>
                <span>{icon}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
