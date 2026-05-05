import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import AdminSidebar from "@/components/admin/sidebar";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, User, Trash2, Copy, RotateCcw, Sparkles } from "lucide-react";

type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  content: string;
  ts: number;
}

const QUICK_QUESTIONS = [
  "كيف أكتب إعلان فيسبوك ناجح لمنتج جوارب؟",
  "اكتب لي 5 عناوين إعلانية جذابة",
  "ما هي أفضل استراتيجية تسعير للمنتجات العراقية؟",
  "كيف أرفع معدل تحويل صفحة المنتج؟",
  "اقترح لي أفكار محتوى لسوشيال ميديا",
  "كيف أكتب وصف منتج يبيع؟",
];

const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي متخصص في التجارة الإلكترونية والتسويق الرقمي في السوق العراقي والعربي.
تساعد أصحاب المتاجر الإلكترونية في:
- كتابة إعلانات فيسبوك وإنستغرام فعّالة
- تحسين وصف المنتجات
- استراتيجيات التسعير والمبيعات
- التسويق بالمحتوى
- تحليل المنافسين
- خدمة العملاء
تجيب باللغة العربية دائماً بأسلوب واضح ومفيد.`;

export default function AiChatPage() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [idCounter, setIdCounter] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMsg: string) => {
      const token = localStorage.getItem("adminToken");
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg },
          ],
          system: SYSTEM_PROMPT,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.reply as string;
    },
    onSuccess: (reply, userMsg) => {
      setMessages(prev => [
        ...prev,
        { id: idCounter + 1, role: "assistant", content: reply, ts: Date.now() },
      ]);
      setIdCounter(c => c + 2);
    },
    onError: (e: any) => {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    },
  });

  const sendMessage = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || chatMutation.isPending) return;
    setMessages(prev => [...prev, { id: idCounter, role: "user", content: msg, ts: Date.now() }]);
    setIdCounter(c => c + 1);
    setInput("");
    chatMutation.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "✅ تم النسخ" });
  };

  const clearChat = () => {
    setMessages([]);
    toast({ title: "تم مسح المحادثة" });
  };

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 arabic-text">مساعد الذكاء الاصطناعي</h1>
              <p className="text-xs text-emerald-600 arabic-text flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                متصل ومستعد للمساعدة
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-gray-500 hover:text-red-500 arabic-text">
              <Trash2 className="w-4 h-4" /> مسح المحادثة
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center pb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 arabic-text">مساعد التجارة الإلكترونية</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm arabic-text">
                اسألني أي شيء عن التسويق، الإعلانات، المنتجات، أو استراتيجيات المبيعات
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-right px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 text-sm text-gray-700 transition-all arabic-text shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-blue-500"
                      : "bg-gradient-to-br from-emerald-500 to-teal-600"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-white" />}
                  </div>

                  {/* Bubble */}
                  <div className={`group max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <Card className={`px-4 py-3 rounded-2xl shadow-sm border-0 ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm"
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap arabic-text">{msg.content}</p>
                    </Card>
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-1"
                      >
                        <Copy className="w-3 h-3" /> نسخ
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border-0 shadow-sm">
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </Card>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا... (Enter للإرسال، Shift+Enter لسطر جديد)"
              rows={1}
              className="flex-1 resize-none min-h-[44px] max-h-32 arabic-text text-sm rounded-xl border-gray-200 focus:border-emerald-400"
              style={{ overflow: "hidden" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 128) + "px";
              }}
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || chatMutation.isPending}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 p-0 flex-shrink-0"
            >
              {chatMutation.isPending
                ? <RotateCcw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2 arabic-text">
            مدعوم بـ GPT-4o — قد تحتوي الإجابات على أخطاء، تحقق دائماً
          </p>
        </div>
      </div>
    </div>
  );
}
