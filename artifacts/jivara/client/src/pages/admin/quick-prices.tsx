import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Tag, Filter, Copy, Check } from "lucide-react";
import type { Product, Category } from "@shared/schema";

function formatPrice(v: string | number | null | undefined) {
  if (v == null) return "—";
  const n = parseFloat(String(v));
  if (isNaN(n)) return "—";
  return n.toLocaleString("en-US") + " د.ع";
}

export default function QuickPricesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [store, setStore] = useState<"all" | "jivara" | "jadaf">("all");
  const [copied, setCopied] = useState<number | null>(null);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      if (store === "jivara" && !p.showOnJivara) return false;
      if (store === "jadaf" && !p.showOnJadaf) return false;
      if (categoryId != null && p.categoryId !== categoryId) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        return (
          p.name?.toLowerCase().includes(q) ||
          p.nameAr?.includes(search.trim()) ||
          p.sku?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, store, categoryId, search]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const copyAll = () => {
    const lines = filtered
      .map((p) => `${p.nameAr || p.name} — ${formatPrice(p.price)}`)
      .join("\n");
    navigator.clipboard.writeText(lines);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 arabic-text flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#C9A14A]" />
            الأسعار السريعة
          </h1>
          <p className="text-sm text-gray-500 arabic-text mt-0.5">
            {filtered.length} منتج
          </p>
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A14A] text-white text-sm font-medium hover:bg-[#b8903f] transition-colors arabic-text"
        >
          <Copy className="w-3.5 h-3.5" />
          نسخ الكل
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث باسم أو SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/30 arabic-text"
          />
        </div>

        {/* Store filter */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["all", "jivara", "jadaf"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStore(s)}
              className={`px-3 py-2 transition-colors arabic-text ${
                store === s
                  ? "bg-[#C9A14A] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "الكل" : s === "jivara" ? "JIVARA" : "جداف"}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={categoryId ?? ""}
            onChange={(e) =>
              setCategoryId(e.target.value ? Number(e.target.value) : null)
            }
            className="pr-8 pl-3 py-2 text-sm rounded-lg border border-gray-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/30 arabic-text"
          >
            <option value="">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameAr || c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#C9A14A] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 arabic-text">لا توجد منتجات</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 arabic-text w-8">#</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 arabic-text">المنتج</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 arabic-text hidden sm:table-cell">SKU</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 arabic-text">السعر</th>
                <th className="text-right px-4 py-2.5 font-semibold text-gray-600 arabic-text hidden md:table-cell">السعر الأصلي</th>
                <th className="px-3 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-amber-50/40 transition-colors"
                >
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-900 arabic-text leading-tight">
                      {p.nameAr || p.name}
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {p.showOnJivara && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          JIVARA
                        </span>
                      )}
                      {p.showOnJadaf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium arabic-text">
                          جداف
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 font-mono text-xs hidden sm:table-cell">
                    {p.sku}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-[#C9A14A] text-base">
                      {formatPrice(p.price)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    {p.originalPrice && parseFloat(String(p.originalPrice)) > 0 ? (
                      <span className="text-gray-400 line-through text-xs">
                        {formatPrice(p.originalPrice)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() =>
                        handleCopy(
                          p.id,
                          `${p.nameAr || p.name} — ${formatPrice(p.price)}`
                        )
                      }
                      title="نسخ"
                      className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                    >
                      {copied === p.id ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
