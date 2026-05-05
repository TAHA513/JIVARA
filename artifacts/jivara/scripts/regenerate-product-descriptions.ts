import { db, pool } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

interface ProductRow {
  id: number;
  name: string;
  nameAr: string;
  description: string | null;
  descriptionAr: string | null;
  price: string;
  categoryName: string | null;
}

const SYSTEM_PROMPT = `أنت كاتب محتوى تسويقي محترف باللغة العربية لمتجر JIVARA الإلكتروني العراقي (ساعات، عطور، أحذية، إكسسوارات، ملابس).
مهمتك: توليد وصف منتج جذّاب ومنظّم باللغة العربية الفصحى البسيطة (مع لهجة عراقية خفيفة عند الحاجة).

أعد JSON صالح فقط بالشكل التالي بدون أي نص إضافي:
{
  "short": "جملة أو جملتان قصيرتان جداً (حد أقصى 140 حرف) تلخّص المنتج وتجذب الزبون",
  "full": "وصف كامل ومنظّم: يبدأ بسطر افتتاحي قوي، ثم نقاط مرقّمة بإيموجي تبيّن المميزات والخامات والاستخدامات، وينتهي بدعوة للشراء. استخدم \\n للأسطر الجديدة. لا تضع أرقام هواتف ولا أسعار."
}

قواعد:
- لا تخترع مواصفات غير موجودة. إن لم تكن لديك معلومة استخدم وصفاً عاماً مناسباً للفئة.
- ابتعد عن الكلمات المبالَغة أو الكاذبة.
- لا تذكر أسعاراً ولا أرقاماً للتواصل (تُعرض من النظام).
- لا تستخدم أكثر من 6-8 نقاط في الوصف الكامل.
- اجعل النبرة فاخرة وعصرية.`;

async function generate(p: ProductRow): Promise<{ short: string; full: string } | null> {
  const userPrompt = `اسم المنتج: ${p.nameAr || p.name}
الفئة: ${p.categoryName || "غير محدد"}
الوصف الحالي (للاسترشاد فقط): ${(p.descriptionAr || p.description || "").slice(0, 800)}

ولّد JSON بالوصف الجديد.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    if (!res.ok) {
      console.error(`  ✗ OpenAI ${res.status} for product ${p.id}: ${await res.text()}`);
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (typeof parsed.short !== "string" || typeof parsed.full !== "string") return null;
    return { short: parsed.short.trim(), full: parsed.full.trim() };
  } catch (e) {
    console.error(`  ✗ Error for product ${p.id}:`, e);
    return null;
  }
}

async function processBatch(batch: ProductRow[]): Promise<{ ok: number; fail: number }> {
  let ok = 0,
    fail = 0;
  const results = await Promise.all(
    batch.map(async (p) => {
      const gen = await generate(p);
      if (!gen) return { id: p.id, ok: false };
      // description -> short, descriptionAr -> full (final, used by frontend)
      await db
        .update(products)
        .set({ description: gen.short, descriptionAr: gen.full })
        .where(eq(products.id, p.id));
      return { id: p.id, ok: true, short: gen.short.slice(0, 60) };
    })
  );
  for (const r of results) {
    if (r.ok) {
      ok++;
      console.log(`  ✓ #${r.id} → ${r.short}…`);
    } else {
      fail++;
      console.log(`  ✗ #${r.id}`);
    }
  }
  return { ok, fail };
}

async function main() {
  console.log("📦 جلب المنتجات النشطة…");
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      nameAr: products.nameAr,
      description: products.description,
      descriptionAr: products.descriptionAr,
      price: products.price,
      categoryName: categories.nameAr,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(products.id);

  console.log(`📊 العدد: ${rows.length} منتج`);

  const BATCH = 5;
  let total = { ok: 0, fail: 0 };
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    console.log(`\n— دفعة ${Math.floor(i / BATCH) + 1}/${Math.ceil(rows.length / BATCH)} (${slice.length} منتج)`);
    const r = await processBatch(slice);
    total.ok += r.ok;
    total.fail += r.fail;
  }

  console.log(`\n✅ تم: ${total.ok} | ❌ فشل: ${total.fail}`);
  await pool.end();
  process.exit(total.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
