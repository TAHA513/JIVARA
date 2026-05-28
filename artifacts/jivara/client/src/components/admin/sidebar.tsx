import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  LayoutDashboard, Package, LayoutGrid, ShoppingBag, Users, BarChart2,
  Tag, Megaphone, Link2, Zap, TrendingUp, CreditCard, FileText,
  Bot, Palette, Settings, LogOut, Store, Menu, X, Target, Truck,
  ChevronDown, ChevronUp, Star, MessageCircle, Radio,
  Warehouse, RotateCcw, Receipt, Bell, ShieldCheck, ShoppingCart, Printer, Camera, DollarSign, BadgeCheck
} from "lucide-react";
import { Link, useLocation } from "wouter";

type NavItem = { title: string; href: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[]; defaultOpen?: boolean; alwaysOpen?: boolean };

const navGroups: NavGroup[] = [
  {
    label: "الرئيسية",
    alwaysOpen: true,
    defaultOpen: true,
    items: [
      { title: "لوحة التحكم",  href: "/admin",                icon: LayoutDashboard },
      { title: "الإشعارات",    href: "/admin/notifications",  icon: Bell },
    ],
  },
  {
    label: "التشغيل اليومي",
    defaultOpen: true,
    items: [
      { title: "الكاشير 🏪",    href: "/admin/cashier",    icon: ShoppingCart },
      { title: "الطلبات",      href: "/admin/orders",     icon: ShoppingBag },
      { title: "طباعة الطلبات", href: "/admin/print-orders", icon: Printer },
      { title: "المنتجات",     href: "/admin/products",   icon: Package },
      { title: "الأسعار السريعة 💰", href: "/admin/quick-prices", icon: DollarSign },
      { title: "استديو صور المنتجات", href: "/admin/product-photo-studio", icon: Camera },
      { title: "المخزون",      href: "/admin/inventory",  icon: Warehouse },
      { title: "المرتجعات",    href: "/admin/returns",    icon: RotateCcw },
      { title: "الفئات",       href: "/admin/categories", icon: LayoutGrid },
      { title: "العملاء",      href: "/admin/customers",  icon: Users },
      { title: "نظام الوسيط", href: "/admin/alwaseet",   icon: Truck },
      { title: "طلب يدوي ➕",  href: "/admin/manual-order", icon: Truck },
      { title: "الضمان التجاري 🛡️", href: "/admin/warranty", icon: BadgeCheck },
    ],
  },
  {
    label: "المالية",
    defaultOpen: false,
    items: [
      { title: "المبيعات",     href: "/admin/sales-tracker",      icon: TrendingUp },
      { title: "الأرباح",     href: "/admin/financial-products", icon: CreditCard },
      { title: "المصروفات",   href: "/admin/expenses",           icon: Receipt },
      { title: "التقارير",    href: "/admin/reports",            icon: BarChart2 },
    ],
  },
  {
    label: "التسويق والنمو",
    defaultOpen: false,
    items: [
      { title: "أكواد الخصم",     href: "/admin/discount-codes",      icon: Tag },
      { title: "الحملات",         href: "/admin/fb-ads",              icon: Radio },
      { title: "روابط الحملات",   href: "/admin/campaign-links",      icon: Link2 },
      { title: "البكسل والتحويل", href: "/admin/funnel-analytics",    icon: Target },
      { title: "الرسائل",         href: "/admin/messenger-broadcast", icon: MessageCircle },
      { title: "السوشيال ميديا",  href: "/admin/social-manager",      icon: Megaphone },
    ],
  },
  {
    label: "الذكاء الاصطناعي",
    defaultOpen: false,
    items: [
      { title: "مصمم AI",  href: "/admin/ai-designer", icon: Palette },
      { title: "مساعد AI", href: "/admin/ai-chat",      icon: Bot },
    ],
  },
  {
    label: "الإعدادات",
    defaultOpen: false,
    items: [
      { title: "إعدادات المتجر", href: "/admin/settings",      icon: Settings },
      { title: "الثيمات",        href: "/admin/theme-gallery", icon: Star },
      { title: "الصلاحيات",      href: "/admin/permissions",   icon: ShieldCheck },
    ],
  },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const { logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map(g => [g.label, g.defaultOpen ?? false]))
  );

  const toggleGroup = (label: string) => setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  const isActive = (href: string) =>
    location === href || (href !== "/admin" && location?.startsWith(href));

  const NavItemEl = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link href={item.href} onClick={onClick}>
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-150 arabic-text",
          active
            ? "bg-[#C9A14A] text-white shadow-sm"
            : "text-gray-700 hover:bg-[#FAF3E0] hover:text-[#C9A14A]"
        )}>
          <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-gray-500")} strokeWidth={1.8} />
          <span className="text-[13px] font-medium">{item.title}</span>
        </div>
      </Link>
    );
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-white border-l border-gray-100" dir="rtl">

      {/* Logo */}
      <div className="px-4 py-2.5 border-b border-gray-100 shrink-0">
        <Link href="/" onClick={onClose}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C9A14A] flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight tracking-wide">JIVARA</p>
              <p className="text-[10px] text-gray-500 arabic-text leading-tight">لوحة التحكم</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.label] ?? false;
          const hasActive = group.items.some(i => isActive(i.href));

          return (
            <div key={group.label}>
              {/* Section header */}
              {!group.alwaysOpen ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-all text-right arabic-text mt-1",
                    hasActive
                      ? "text-[#C9A14A] font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <span className="text-[12px] font-extrabold tracking-wide">{group.label}</span>
                  {isOpen
                    ? <ChevronUp className="w-3 h-3 shrink-0" />
                    : <ChevronDown className="w-3 h-3 shrink-0" />
                  }
                </button>
              ) : null}

              {/* Items */}
              {(group.alwaysOpen || isOpen) && (
                <div className="space-y-1 mt-0.5">
                  {group.items.map((item) => (
                    <NavItemEl key={item.href} item={item} onClick={onClose} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer — fixed at bottom */}
      <div className="px-2 py-2 border-t border-gray-100 space-y-0.5 shrink-0">
        <Link href="/" onClick={onClose}>
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md cursor-pointer text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all arabic-text">
            <Store className="w-4 h-4 shrink-0 text-gray-500" strokeWidth={1.8} />
            <span className="text-[13px] font-medium">عرض المتجر</span>
          </div>
        </Link>
        <div
          onClick={() => { onClose?.(); logout(); }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-md cursor-pointer text-red-500 hover:bg-red-50 transition-all arabic-text"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          <span className="text-[13px] font-medium">تسجيل الخروج</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE top bar */}
      <div className="lg:hidden">
        <div className="fixed top-0 right-0 left-0 z-40 flex items-center justify-between bg-white border-b border-gray-100 px-4 py-2.5 shadow-sm" dir="rtl">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-sm font-bold text-black tracking-wide">JIVARA</span>
          <Link href="/">
            <div className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <Store className="w-4 h-4 text-gray-500" />
            </div>
          </Link>
        </div>
        <div className="h-12" />

        {/* Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)} />
        )}

        {/* Drawer */}
        <div className={cn(
          "fixed top-0 right-0 h-full w-64 z-50 shadow-2xl transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block w-60 h-screen sticky top-0 shrink-0 shadow-sm">
        <SidebarContent />
      </div>
    </>
  );
}
