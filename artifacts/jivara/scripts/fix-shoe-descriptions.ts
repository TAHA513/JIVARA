import { db, pool } from "../server/db";
import { products } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

const apiKey = process.env.OPENAI_API_KEY!;
const SHOE_IDS = [23, 27, 30, 31];

const SYSTEM_PROMPT = `أنت كاتب محتوى تسويقي عربي محترف لمتجر JIVARA العراقي.
ولّد JSON صالح فقط بالشكل: { "short": "...", "full": "..." }

قواعد صارمة:
- ممنوع منعاً باتاً ذكر "جلد طبيعي" أو "leather" أو "خامة جلدية" أو أي ادعاء بنوع الخامة.
- استخدم أوصافاً محايدة مثل: "تصميم رسمي أنيق"، "خامة متينة ومريحة"، "مظهر فاخر"، "تشطيب راقٍ".
- ركّز على: الأناقة، التصميم الرسمي، الراحة، المقاسات المتوفرة، التوصيل المجاني.
- short: جملة قصيرة ≤140 حرف.
- full: افتتاحية + 5-6 نقاط بإيموجي + سطر ختامي. استخدم \\n للأسطر.
- لا أسعار ولا أرقام تواصل.`;

async function gen(name: string): Promise<{ short: string; full: string }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `حذاء رجالي رسمي FASHIO من JIVARA — تصميم أنيق للعمل والمناسبات. متوفر مقاسات 40-45.\n\nولّد JSON بدون ذكر نوع الخامة إطلاقاً.` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 700,
    }),
  });
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return { short: parsed.short.trim(), full: parsed.full.trim() };
}

async function main() {
  for (const id of SHOE_IDS) {
    const { short, full } = await gen("FASHIO");
    // safety net: strip any leftover leather mentions
    const clean = (s: string) =>
      s.replace(/جلد\s*طبيعي/g, "تشطيب فاخر")
        .replace(/جلد(ية|ي)?\s*(فاخر|عالي|متين)?/g, "تشطيب فاخر")
        .replace(/leather/gi, "");
    await db
      .update(products)
      .set({ description: clean(short), descriptionAr: clean(full) })
      .where(eq(products.id, id));
    console.log(`✓ #${id} → ${clean(short).slice(0, 70)}…`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
