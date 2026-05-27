import { useState, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Tag, Filter, Check, Save, Store } from "lucide-react";
import type { Product, Category } from "@shared/schema";

function formatPrice(v: string | number | null | undefined) {
  if (v == null) return "";
  const n = parseFloat(String(v));
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US");
}

function PriceCell({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [val, setVal] = useState(formatPrice(product.price));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (newVal: string) => {
    const num = parseFloat(newVal.replace(/,/g, ""));
    if (isNaN(num) || num < 0) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: String(num) }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      onSaved();
      setTimeout(() => setStatus("idle"), 1500);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [product.id, onSaved]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value);
    setStatus("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(e.target.value), 800);
  };

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save(val);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        value={val}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-28 px-2 py-1.5 text-sm rounded-lg border text-right font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/40 ${
          status === "saved"
            ? "border-green-400 bg-green-50 text-green-700"
            : status === "error"
            ? "border-red-300 bg-red-50"
            : status === "saving"
            ? "border-amber-300 bg-amber-50"
            : "border-gray-200 bg-white text-gray-900"
        }`}
        dir="ltr"
      />
      <span className="text-xs text-gray-400 arabic-text">د.ع</span>
      {status === "saving" && (
        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      )}
      {status === "saved" && <Check className="w-3.5 h-3.5 text-green-500" />}
      {status === "error" && <span className="text-red-400 text-xs">!</span>}
    </div>
  );
}

function StoreToggle({ product, onSaved }: { product: Product; onSaved: () => void }) {
  const [jivara, setJivara] = useState(!!product.showOnJivara);
  const [jadaf, setJadaf] = useState(!!product.showOnJadaf);
  const [saving, setSaving] = useState(false);

  const toggle = async (field: "showOnJivara" | "showOnJadaf") => {
    const newJivara = field === "showOnJivara" ? !jivara : jivara;
    const newJadaf = field === "showOnJadaf" ? !jadaf : jadaf;
    setJivara(newJivara);
    setJadaf(newJadaf);
    setSaving(true);
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnJivara: newJivara, showOnJadaf: newJadaf }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex gap-1 transition-opacity ${saving ? "opacity-50" : ""}`}>
      <button
        onClick={() => toggle("showOnJivara")}
        className={`text-[11px] px-2 py-1 rounded-full font-semibold transition-colors border ${
          jivara
            ? "bg-amber-100 text-amber-700 border-amber-300"
            : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-amber-50"
        }`}
      >
        JIVARA
      </button>
      <button
        onClick={() => toggle("showOnJadaf")}
        className={`text-[11px] px-2 py-1 rounded-full font-semibold transition-colors border arabic-text ${
          jadaf
            ? "bg-blue-100 text-blue-700 border-blue-300"
            : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-blue-50"
        }`}
      >
        جداف
      </button>
    </div>
  );
}

export default function QuickPricesPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [store, setStore] = useState<"all" | "jivara" | "jadaf">("all");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  }, [queryClient]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
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

  return (
    <div className="p-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 arabic-text flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#C9A14A]" />
            التسعير السريع
          </h1>
          <p className="text-sm text-gray-500 arabic-text mt-0.5">
            {filtered.length} منتج — عدّل السعر مباشرة أو تحكم بظهور المنتج
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 arabic-text bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
          <Save className="w-3.5 h-3.5" />
          الحفظ تلقائي
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
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

        <div className="relative">
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
            className="pr-8 pl-3 py-2 text-sm rounded-lg border border-gray-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#C9A14A]/30 arabic-text"
          >
            <option value="">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
            ))}
          </select>
        </div>
      </div>

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
                <th className="text-right px-3 py-3 font-semibold text-gray-500 arabic-text w-8">#</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 arabic-text">المنتج</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 arabic-text hidden sm:table-cell">SKU</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 arabic-text">سعر البيع</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 arabic-text">
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    الظهور
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-amber-50/30 transition-colors"
                >
                  <td className="px-3 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      {((p.images as string[]) || [])[0] && (
                        <img
                          src={(p.images as string[])[0]}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 arabic-text leading-tight">
                          {p.nameAr || p.name}
                        </div>
                        {p.nameAr && p.name !== p.nameAr && (
                          <div className="text-xs text-gray-400 mt-0.5">{p.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">
                    {p.sku}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1 arabic-text">
                        <span className="text-[10px] text-gray-400">شراء:</span>
                        {p.costPrice && parseFloat(String(p.costPrice)) > 0 ? (
                          <span className="text-[11px] font-semibold text-blue-600">
                            {parseFloat(String(p.costPrice)).toLocaleString("en-US")} د.ع
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </div>
                      <PriceCell product={p} onSaved={refresh} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StoreToggle product={p} onSaved={refresh} />
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
