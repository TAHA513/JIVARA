import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Globe, Plus, Trash2, BarChart3, FileText, Zap, Calendar,
  CheckCircle, AlertCircle, AlertTriangle, TrendingUp, MessageSquare,
  Users, Heart, Share2, Eye, Clock, Send, RefreshCw, Facebook,
  Instagram, Sparkles, Target, Lightbulb, ChevronRight, Upload,
  ExternalLink, Wifi, WifiOff, Download, PlayCircle, Activity,
} from "lucide-react";
import type { SocialPage, SocialPost, SocialReport, AiCommand } from "@shared/schema";

const D_BG     = "#0B0F14";
const D_SEC    = "#121821";
const D_CARD   = "#161B22";
const D_BORDER = "#222B36";
const D_TEXT   = "#E8EAED";
const D_MUTED  = "#9EA3B0";
const FB_BLUE  = "#1877F2";
const FB_DARK  = "#0B3D91";

interface MetaStatus {
  hasOAuthToken: boolean;
  hasSystemToken: boolean;
  isConnected: boolean;
  appId: string | null;
  connectionType: "oauth" | "token" | "none";
}

interface MetaPage {
  id: string;
  name: string;
  category: string;
  fan_count?: number;
  followers_count?: number;
  access_token?: string;
}

export default function SocialManager() {
  const { isLoading: authLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const [location] = useLocation();

  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState("sale");
  const [postStatus, setPostStatus] = useState("draft");
  const [postScheduledAt, setPostScheduledAt] = useState("");
  const [commandText, setCommandText] = useState("");
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPage, setNewPage] = useState({ pageName: "", platform: "facebook", pageUrl: "", pageId: "", category: "", followers: "", accessToken: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("meta_connected") === "1") {
      toast({ title: "✅ تم الربط بفيسبوك بنجاح!" });
      queryClient.invalidateQueries({ queryKey: ["/api/social/meta/status"] });
      window.history.replaceState({}, "", "/admin/social-manager");
    }
    if (params.get("meta_error")) {
      toast({ title: "خطأ في الربط", description: decodeURIComponent(params.get("meta_error")!), variant: "destructive" });
      window.history.replaceState({}, "", "/admin/social-manager");
    }
  }, []);

  const { data: metaStatus } = useQuery<MetaStatus>({ queryKey: ["/api/social/meta/status"], enabled: isAuthenticated });

  const { data: pages = [], isLoading: pagesLoading } = useQuery<SocialPage[]>({
    queryKey: ["/api/social/pages"],
    enabled: isAuthenticated,
  });

  const selectedPage = pages.find(p => p.id === selectedPageId) || null;

  const { data: reports = [] } = useQuery<SocialReport[]>({
    queryKey: ["/api/social/reports", selectedPageId],
    queryFn: async () => {
      if (!selectedPageId) return [];
      return (await apiRequest("GET", `/api/social/reports/${selectedPageId}`)).json();
    },
    enabled: !!selectedPageId,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social/posts", selectedPageId],
    queryFn: async () => {
      if (!selectedPageId) return [];
      return (await apiRequest("GET", `/api/social/posts/${selectedPageId}`)).json();
    },
    enabled: !!selectedPageId,
  });

  const { data: commands = [] } = useQuery<AiCommand[]>({
    queryKey: ["/api/social/commands", selectedPageId],
    queryFn: async () => {
      if (!selectedPageId) return [];
      return (await apiRequest("GET", `/api/social/commands/${selectedPageId}`)).json();
    },
    enabled: !!selectedPageId,
  });

  const { data: insights = [], refetch: refetchInsights } = useQuery<any[]>({
    queryKey: ["/api/social/meta/insights", selectedPageId],
    queryFn: async () => {
      if (!selectedPageId || !selectedPage?.pageId) return [];
      const res = await apiRequest("GET", `/api/social/meta/insights/${selectedPageId}`);
      return res.json();
    },
    enabled: !!selectedPageId && !!selectedPage?.pageId,
    staleTime: 10 * 60 * 1000,
  });

  const latestReport = reports[0] || null;

  const autoImportMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/social/meta/auto-import"),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/social/pages"] });
      toast({ title: `✅ تم تحديث ${data.total} صفحة من فيسبوك` });
    },
    onError: async (e: any) => {
      let msg = e.message;
      try { const r = JSON.parse(e.message.replace(/^\d+: /, "")); msg = r.error || msg; } catch {}
      toast({ title: "خطأ في الاستيراد", description: msg, variant: "destructive" });
    },
  });

  const addPageMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/social/pages", data),
    onSuccess: async (res) => {
      const page = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/social/pages"] });
      setShowAddPage(false);
      setNewPage({ pageName: "", platform: "facebook", pageUrl: "", pageId: "", category: "", followers: "", accessToken: "" });
      toast({ title: "✅ تم إضافة الصفحة" });
      setSelectedPageId(page.id);
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/social/pages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/pages"] });
      setSelectedPageId(null);
      toast({ title: "تم حذف الصفحة" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/social/analyze/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/reports", selectedPageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/pages"] });
      toast({ title: "✅ تم التحليل بالذكاء الاصطناعي — التقرير جاهز" });
    },
    onError: () => toast({ title: "خطأ في التحليل", variant: "destructive" }),
  });

  const syncMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/social/meta/sync/${id}`),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/pages"] });
      toast({ title: `✅ تمت المزامنة — ${data.savedPosts} منشور من فيسبوك` });
    },
    onError: async (e: any) => {
      let msg = e.message;
      try { const r = JSON.parse(e.message.replace(/^\d+: /, "")); msg = r.error || msg; } catch {}
      toast({ title: "خطأ في المزامنة", description: msg, variant: "destructive" });
    },
  });

  const addPostMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/social/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPageId] });
      setPostContent("");
      setPostStatus("draft");
      setPostScheduledAt("");
      toast({ title: "✅ تم حفظ المنشور" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (postId: number) => apiRequest("POST", `/api/social/meta/publish/${postId}`),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPageId] });
      toast({ title: "✅ تم النشر على فيسبوك!", description: `Post ID: ${data.facebookPostId}` });
    },
    onError: async (e: any) => {
      let msg = e.message;
      try { const r = JSON.parse(e.message.replace(/^\d+: /, "")); msg = r.error || msg; } catch {}
      toast({ title: "خطأ في النشر", description: msg, variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/social/posts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPageId] }),
  });

  const commandMutation = useMutation({
    mutationFn: (cmd: string) => apiRequest("POST", "/api/social/command", { pageId: selectedPageId, command: cmd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/commands", selectedPageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPageId] });
      setCommandText("");
      toast({ title: "✅ تم تنفيذ الأمر" });
    },
    onError: () => toast({ title: "خطأ في تنفيذ الأمر", variant: "destructive" }),
  });

  useEffect(() => {
    if (!pagesLoading && pages.length === 0 && isAuthenticated) {
      autoImportMutation.mutate();
    }
  }, [pagesLoading, isAuthenticated]);

  useEffect(() => {
    if (!selectedPageId && pages.length > 0) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages]);

  const handleAddPost = (publishNow = false) => {
    if (!postContent.trim()) return;
    addPostMutation.mutate({
      pageId: selectedPageId,
      content: postContent,
      category: postCategory,
      postType: "text",
      status: publishNow ? "draft" : postStatus,
      scheduledAt: postScheduledAt ? new Date(postScheduledAt).toISOString() : null,
    }, {
      onSuccess: async (res: any) => {
        if (publishNow) {
          const post = await res.json();
          if (post?.id) publishMutation.mutate(post.id);
        }
      }
    });
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: D_BG }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
  if (!isAuthenticated) return null;

  const publishedPosts = posts.filter(p => p.status === "published");
  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const draftPosts = posts.filter(p => p.status === "draft");

  const getInsightValue = (name: string) => {
    const item = insights.find((i: any) => i.name === name);
    if (!item?.values?.length) return null;
    const vals = item.values;
    return vals[vals.length - 1]?.value ?? null;
  };

  const impressions = getInsightValue("page_impressions_unique");
  const engagedUsers = getInsightValue("page_engaged_users");
  const pageViews = getInsightValue("page_views_total");

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: D_BG, color: D_TEXT }}>

      {/* هيدر علوي */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 gap-3"
        style={{ background: `linear-gradient(135deg, ${FB_DARK}, ${FB_BLUE})`, borderBottom: `1px solid rgba(255,255,255,0.1)` }}>
        <div className="flex items-center gap-2">
          <Link href="/admin">
            <button className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.15)" }}>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </Link>
          <span className="text-lg">📱</span>
          <span className="font-bold text-white text-sm arabic-text">مدير السوشيال ميديا</span>
          {metaStatus?.isConnected && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80" }}>
              ✓ مرتبط بفيسبوك
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs arabic-text"
            style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
            onClick={() => autoImportMutation.mutate()}
            disabled={autoImportMutation.isPending}>
            <RefreshCw className={`w-3.5 h-3.5 ${autoImportMutation.isPending ? "animate-spin" : ""}`} />
            {autoImportMutation.isPending ? "جارٍ..." : "تحديث من فيسبوك"}
          </button>
          <Dialog open={showAddPage} onOpenChange={setShowAddPage}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs arabic-text"
                style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                <Plus className="w-3.5 h-3.5" /> إضافة يدوية
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl" style={{ background: D_CARD, borderColor: D_BORDER, color: D_TEXT }}>
              <DialogHeader>
                <DialogTitle className="arabic-text" style={{ color: D_TEXT }}>إضافة صفحة يدوياً</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>اسم الصفحة *</Label>
                  <Input className="mt-1 text-sm" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                    placeholder="مثال: جيفارا للتسوق"
                    value={newPage.pageName} onChange={e => setNewPage(p => ({ ...p, pageName: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>Facebook Page ID</Label>
                    <Input className="mt-1 text-sm" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                      placeholder="مثال: 123456789"
                      value={newPage.pageId} onChange={e => setNewPage(p => ({ ...p, pageId: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>عدد المتابعين</Label>
                    <Input className="mt-1 text-sm" type="number" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                      placeholder="0"
                      value={newPage.followers} onChange={e => setNewPage(p => ({ ...p, followers: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>Page Access Token (للنشر)</Label>
                  <Input className="mt-1 text-sm" type="password" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                    placeholder="EAAxxxxxxx"
                    value={newPage.accessToken} onChange={e => setNewPage(p => ({ ...p, accessToken: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-2 rounded-lg text-sm arabic-text"
                    style={{ background: FB_BLUE, color: "white" }}
                    onClick={() => addPageMutation.mutate({ pageName: newPage.pageName, platform: "facebook", pageId: newPage.pageId || null, followers: newPage.followers ? parseInt(newPage.followers) : 0, accessToken: newPage.accessToken || null, isConnected: !!newPage.accessToken })}
                    disabled={!newPage.pageName || addPageMutation.isPending}>
                    {addPageMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin inline ml-2" /> : null}
                    إضافة
                  </button>
                  <button className="px-4 py-2 rounded-lg text-sm arabic-text border"
                    style={{ borderColor: D_BORDER, color: D_MUTED }}
                    onClick={() => setShowAddPage(false)}>إلغاء</button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* الجسم الرئيسي */}
      <div className="flex flex-1 overflow-hidden">

        {/* قائمة الصفحات - جانبية */}
        <div className="w-56 shrink-0 flex flex-col overflow-y-auto border-l" style={{ background: D_SEC, borderColor: D_BORDER }}>
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: D_MUTED }}>
            صفحاتك ({pages.length})
          </div>

          {pagesLoading || autoImportMutation.isPending ? (
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
              <span className="text-xs arabic-text" style={{ color: D_MUTED }}>جاري التحميل...</span>
            </div>
          ) : pages.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-xs arabic-text" style={{ color: D_MUTED }}>لا توجد صفحات</p>
              <button className="mt-2 text-xs px-3 py-1.5 rounded-lg arabic-text"
                style={{ background: FB_BLUE, color: "white" }}
                onClick={() => autoImportMutation.mutate()}>
                استيراد من فيسبوك
              </button>
            </div>
          ) : pages.map(page => (
            <button key={page.id}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right transition-all border-r-2"
              style={{
                background: selectedPageId === page.id ? "rgba(24,119,242,0.12)" : "transparent",
                borderRightColor: selectedPageId === page.id ? FB_BLUE : "transparent",
              }}
              onClick={() => setSelectedPageId(page.id)}>
              <div className="relative shrink-0">
                {page.pageId ? (
                  <img
                    src={`https://graph.facebook.com/${page.pageId}/picture?type=square`}
                    alt={page.pageName}
                    className="w-8 h-8 rounded-lg object-cover"
                    style={{ border: `1px solid ${D_BORDER}` }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("style"); }}
                  />
                ) : null}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 ${page.pageId ? "hidden" : ""}`}
                  style={page.pageId ? { display: "none" } : {}}>
                  <Facebook className="w-4 h-4 text-white" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${page.isConnected ? "bg-green-500" : "bg-gray-600"}`}
                  style={{ border: `1.5px solid ${D_SEC}` }} />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-xs font-medium arabic-text truncate" style={{ color: selectedPageId === page.id ? "white" : D_TEXT }}>{page.pageName}</p>
                <p className="text-xs arabic-text" style={{ color: D_MUTED }}>
                  {(page.followers || 0).toLocaleString()} متابع
                </p>
              </div>
            </button>
          ))}

          {/* رابط فيسبوك الرسمي */}
          {selectedPage?.pageId && (
            <div className="mt-auto px-3 py-3 border-t" style={{ borderColor: D_BORDER }}>
              <a
                href={`https://www.facebook.com/${selectedPage.pageId}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs arabic-text"
                style={{ color: FB_BLUE }}>
                <ExternalLink className="w-3 h-3" />
                فتح على فيسبوك
              </a>
            </div>
          )}
        </div>

        {/* المحتوى الرئيسي */}
        {!selectedPage ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Facebook className="w-12 h-12 mx-auto mb-3" style={{ color: D_BORDER }} />
              <p className="arabic-text" style={{ color: D_MUTED }}>اختر صفحة من القائمة لعرض بياناتها</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* هيدر الصفحة المحددة */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b" style={{ borderColor: D_BORDER }}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  {selectedPage.pageId ? (
                    <img
                      src={`https://graph.facebook.com/${selectedPage.pageId}/picture?type=large`}
                      alt={selectedPage.pageName}
                      className="w-14 h-14 rounded-xl object-cover"
                      style={{ border: `2px solid ${FB_BLUE}` }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
                      <Facebook className="w-7 h-7 text-white" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${selectedPage.isConnected ? "bg-green-500" : "bg-gray-600"}`}
                    style={{ border: `2px solid ${D_BG}` }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold arabic-text" style={{ color: D_TEXT }}>{selectedPage.pageName}</h2>
                  <p className="text-xs arabic-text" style={{ color: D_MUTED }}>
                    {selectedPage.category} • {selectedPage.isConnected ? "✅ مرتبطة بالتوكن" : "⚠️ غير مرتبطة"}
                    {selectedPage.pageId && <> • ID: {selectedPage.pageId}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedPage.pageId && (
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs arabic-text border"
                    style={{ color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.08)" }}
                    onClick={() => syncMutation.mutate(selectedPage.id)} disabled={syncMutation.isPending}>
                    {syncMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    مزامنة من فيسبوك
                  </button>
                )}
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs arabic-text"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #9333ea)", color: "white" }}
                  onClick={() => analyzeMutation.mutate(selectedPage.id)} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  تحليل AI
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs arabic-text border"
                  style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}
                  onClick={() => { if (confirm("حذف هذه الصفحة؟")) deletePageMutation.mutate(selectedPage.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>

            {/* صف الإحصائيات الأساسية */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "المتابعون", value: (selectedPage.followers || 0).toLocaleString(), icon: Users, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
                { label: "المنشورات المحلية", value: posts.length, icon: FileText, color: "#c084fc", bg: "rgba(192,132,252,0.1)" },
                { label: "معدل التفاعل", value: `${parseFloat(String(selectedPage.avgEngagement || 0)).toFixed(2)}%`, icon: Heart, color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
                { label: "المنشورة على FB", value: publishedPosts.length, icon: CheckCircle, color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 flex items-center gap-3 border" style={{ background: D_CARD, borderColor: D_BORDER }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-tight" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs arabic-text" style={{ color: D_MUTED }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* إحصائيات فيسبوك الحقيقية */}
            {selectedPage.pageId && (
              <div className="rounded-xl border p-3" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold arabic-text flex items-center gap-2" style={{ color: D_TEXT }}>
                    <Activity className="w-4 h-4" style={{ color: FB_BLUE }} />
                    إحصائيات فيسبوك الحقيقية (آخر 7 أيام)
                  </p>
                  <button className="text-xs flex items-center gap-1" style={{ color: D_MUTED }}
                    onClick={() => refetchInsights()}>
                    <RefreshCw className="w-3 h-3" /> تحديث
                  </button>
                </div>
                {insights.length === 0 ? (
                  <p className="text-xs arabic-text text-center py-2" style={{ color: D_MUTED }}>
                    لا توجد بيانات — تأكد من أن التوكن يملك صلاحية read_insights
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "الوصول الأسبوعي", value: impressions?.toLocaleString() ?? "—", icon: Eye, color: "#60a5fa" },
                      { label: "المستخدمون المتفاعلون", value: engagedUsers?.toLocaleString() ?? "—", icon: Users, color: "#4ade80" },
                      { label: "مشاهدات الصفحة", value: pageViews?.toLocaleString() ?? "—", icon: TrendingUp, color: "#c084fc" },
                    ].map((s, i) => (
                      <div key={i} className="rounded-lg p-3 text-center" style={{ background: D_SEC }}>
                        <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
                        <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-xs arabic-text" style={{ color: D_MUTED }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* قسمان جانبيان: إنشاء منشور + قائمة المنشورات */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* إنشاء منشور */}
              <div className="rounded-xl border p-4" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <p className="text-sm font-semibold arabic-text mb-3 flex items-center gap-2" style={{ color: D_TEXT }}>
                  <Plus className="w-4 h-4" style={{ color: FB_BLUE }} />
                  إنشاء منشور جديد
                </p>
                <Textarea
                  rows={4}
                  placeholder="اكتب محتوى المنشور هنا..."
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  className="w-full text-sm arabic-text resize-none rounded-lg mb-3"
                  style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>الفئة</Label>
                    <Select value={postCategory} onValueChange={setPostCategory}>
                      <SelectTrigger className="mt-1 text-xs" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">🛒 بيع / منتج</SelectItem>
                        <SelectItem value="entertainment">😄 ترفيه</SelectItem>
                        <SelectItem value="info">ℹ️ معلومات</SelectItem>
                        <SelectItem value="random">🎲 عشوائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>الحالة</Label>
                    <Select value={postStatus} onValueChange={setPostStatus}>
                      <SelectTrigger className="mt-1 text-xs" style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">📝 مسودة</SelectItem>
                        <SelectItem value="scheduled">🕐 مجدول</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {postStatus === "scheduled" && (
                  <div className="mb-3">
                    <Label className="text-xs arabic-text" style={{ color: D_MUTED }}>موعد النشر</Label>
                    <Input type="datetime-local" className="mt-1 text-xs"
                      style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                      value={postScheduledAt} onChange={e => setPostScheduledAt(e.target.value)} />
                  </div>
                )}
                <div className="flex gap-2">
                  {selectedPage.isConnected && selectedPage.pageId && (
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm arabic-text"
                      style={{ background: FB_BLUE, color: "white" }}
                      onClick={() => handleAddPost(true)}
                      disabled={!postContent.trim() || addPostMutation.isPending || publishMutation.isPending}>
                      {publishMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                      نشر الآن على فيسبوك
                    </button>
                  )}
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm arabic-text border"
                    style={{ borderColor: D_BORDER, color: D_TEXT, background: D_SEC }}
                    onClick={() => handleAddPost(false)}
                    disabled={!postContent.trim() || addPostMutation.isPending}>
                    {addPostMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    حفظ كمسودة
                  </button>
                </div>

                {/* أوامر AI السريعة */}
                <div className="mt-4 pt-3 border-t" style={{ borderColor: D_BORDER }}>
                  <p className="text-xs arabic-text mb-2 flex items-center gap-1.5" style={{ color: "#c084fc" }}>
                    <Brain className="w-3.5 h-3.5" /> أوامر الذكاء الاصطناعي
                  </p>
                  <div className="flex gap-1.5 mb-2 flex-wrap">
                    {["اكتب منشور بيع", "أنشئ محتوى أسبوع", "أفضل وقت للنشر", "تحسين الصفحة"].map(cmd => (
                      <button key={cmd}
                        className="text-xs px-2 py-1 rounded-full arabic-text border"
                        style={{ background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.25)", color: "#c084fc" }}
                        onClick={() => setCommandText(cmd)}>
                        {cmd}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="أمر للذكاء الاصطناعي..."
                      value={commandText}
                      onChange={e => setCommandText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && commandText.trim() && commandMutation.mutate(commandText)}
                      className="text-xs arabic-text flex-1"
                      style={{ background: D_SEC, borderColor: D_BORDER, color: D_TEXT }}
                    />
                    <button
                      className="px-3 py-2 rounded-lg"
                      style={{ background: "#9333ea", color: "white" }}
                      onClick={() => commandMutation.mutate(commandText)}
                      disabled={!commandText.trim() || commandMutation.isPending}>
                      {commandMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* قائمة المنشورات */}
              <div className="rounded-xl border flex flex-col" style={{ background: D_CARD, borderColor: D_BORDER, maxHeight: "520px" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: D_BORDER }}>
                  <p className="text-sm font-semibold arabic-text flex items-center gap-2" style={{ color: D_TEXT }}>
                    <Calendar className="w-4 h-4" style={{ color: "#c084fc" }} />
                    المنشورات ({posts.length})
                  </p>
                  <div className="flex gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                      {publishedPosts.length} منشور
                    </span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}>
                      {scheduledPosts.length} مجدول
                    </span>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(156,163,175,0.15)", color: D_MUTED }}>
                      {draftPosts.length} مسودة
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: D_BORDER }}>
                  {postsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="w-10 h-10 mx-auto mb-2" style={{ color: D_BORDER }} />
                      <p className="text-xs arabic-text" style={{ color: D_MUTED }}>لا توجد منشورات</p>
                      {selectedPage.pageId && (
                        <button className="mt-2 text-xs flex items-center gap-1 mx-auto"
                          style={{ color: FB_BLUE }}
                          onClick={() => syncMutation.mutate(selectedPage.id)}>
                          <Download className="w-3 h-3" /> مزامنة من فيسبوك
                        </button>
                      )}
                    </div>
                  ) : posts.map(post => (
                    <div key={post.id} className="px-3 py-2.5 flex items-start gap-2" style={{ borderColor: D_BORDER }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            post.status === "published" ? "bg-green-900/40 text-green-400" :
                            post.status === "scheduled" ? "bg-blue-900/40 text-blue-400" :
                            post.status === "failed" ? "bg-red-900/40 text-red-400" :
                            "bg-gray-800 text-gray-400"
                          }`}>
                            {post.status === "published" ? "✅ منشور" : post.status === "scheduled" ? "🕐 مجدول" : post.status === "failed" ? "❌ فشل" : "📝 مسودة"}
                          </span>
                          {post.externalPostId && (
                            <span className="text-xs" style={{ color: "#4ade80" }}>🔗 FB</span>
                          )}
                          {post.scheduledAt && (
                            <span className="text-xs flex items-center gap-0.5" style={{ color: D_MUTED }}>
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(post.scheduledAt).toLocaleDateString("ar-DZ")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs arabic-text line-clamp-2" style={{ color: D_TEXT }}>{post.content}</p>
                        {(post.likes || post.comments || post.shares) ? (
                          <div className="flex gap-3 mt-1 text-xs" style={{ color: D_MUTED }}>
                            {post.likes ? <span>❤️ {post.likes}</span> : null}
                            {post.comments ? <span>💬 {post.comments}</span> : null}
                            {post.shares ? <span>🔄 {post.shares}</span> : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {selectedPage.isConnected && selectedPage.pageId && post.status !== "published" && (
                          <button
                            className="p-1.5 rounded-lg"
                            style={{ background: "rgba(24,119,242,0.15)", color: FB_BLUE }}
                            onClick={() => publishMutation.mutate(post.id)}
                            disabled={publishMutation.isPending}
                            title="نشر على فيسبوك">
                            <PlayCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {post.externalPostId && (
                          <a
                            href={`https://www.facebook.com/${post.externalPostId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg"
                            style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80" }}
                            title="فتح على فيسبوك">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          className="p-1.5 rounded-lg"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}
                          onClick={() => deletePostMutation.mutate(post.id)}
                          title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* سجل أوامر AI */}
            {commands.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <p className="text-sm font-semibold arabic-text mb-3 flex items-center gap-2" style={{ color: D_TEXT }}>
                  <Zap className="w-4 h-4 text-purple-400" />
                  آخر أوامر AI ({commands.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {commands.slice(0, 5).map(cmd => (
                    <div key={cmd.id} className="rounded-lg p-3 border" style={{ background: D_SEC, borderColor: cmd.status === "done" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.2)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium arabic-text" style={{ color: D_TEXT }}>"{cmd.command}"</p>
                        <span className="text-xs" style={{ color: D_MUTED }}>{new Date(cmd.createdAt!).toLocaleDateString("ar-DZ")}</span>
                      </div>
                      {cmd.result && (
                        <p className="text-xs arabic-text line-clamp-3" style={{ color: D_MUTED }}>{cmd.result}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* تقرير AI المختصر */}
            {latestReport?.reportData && (
              <div className="rounded-xl border p-4" style={{ background: D_CARD, borderColor: D_BORDER }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold arabic-text flex items-center gap-2" style={{ color: D_TEXT }}>
                    <Brain className="w-4 h-4 text-purple-400" />
                    تقرير الذكاء الاصطناعي
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${latestReport.reportData.overallScore >= 70 ? "text-green-400" : latestReport.reportData.overallScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                      {latestReport.reportData.overallScore}
                    </span>
                    <span className="text-xs" style={{ color: D_MUTED }}>/100</span>
                    <button className="text-xs px-2 py-1 rounded-lg arabic-text"
                      style={{ background: "linear-gradient(135deg, #3b82f6, #9333ea)", color: "white" }}
                      onClick={() => analyzeMutation.mutate(selectedPage.id)}
                      disabled={analyzeMutation.isPending}>
                      {analyzeMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin inline" /> : "تحديث"}
                    </button>
                  </div>
                </div>
                <p className="text-xs arabic-text mb-3" style={{ color: D_MUTED }}>{latestReport.reportData.growthAnalysis}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {latestReport.reportData.errors.slice(0, 2).map((e, i) => (
                    <div key={i} className="text-xs p-2 rounded-lg arabic-text" style={{ background: "rgba(239,68,68,0.08)", color: "#f87171" }}>
                      ❌ {e.message}
                    </div>
                  ))}
                  {latestReport.reportData.strengths.slice(0, 2).map((s, i) => (
                    <div key={i} className="text-xs p-2 rounded-lg arabic-text" style={{ background: "rgba(74,222,128,0.08)", color: "#4ade80" }}>
                      ✅ {s}
                    </div>
                  ))}
                  {latestReport.reportData.recommendations.slice(0, 1).map((r, i) => (
                    <div key={i} className="text-xs p-2 rounded-lg arabic-text" style={{ background: "rgba(96,165,250,0.08)", color: "#60a5fa" }}>
                      💡 {r}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <p className="text-xs arabic-text mb-1" style={{ color: D_MUTED }}>أفضل أوقات النشر:</p>
                  <div className="flex gap-2 flex-wrap">
                    {latestReport.reportData.bestPostingTimes.map((t, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: D_SEC, color: D_TEXT }}>
                        🕐 {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!latestReport && (
              <div className="rounded-xl border p-4 flex items-center justify-between" style={{ background: "rgba(168,85,247,0.06)", borderColor: "rgba(168,85,247,0.2)" }}>
                <div>
                  <p className="text-sm font-medium arabic-text" style={{ color: "#c084fc" }}>لم يتم تحليل هذه الصفحة بعد</p>
                  <p className="text-xs arabic-text mt-0.5" style={{ color: D_MUTED }}>احصل على تقرير ذكاء اصطناعي شامل عن أداء صفحتك</p>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm arabic-text shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #9333ea)", color: "white" }}
                  onClick={() => analyzeMutation.mutate(selectedPage.id)} disabled={analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  تحليل الصفحة الآن
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
