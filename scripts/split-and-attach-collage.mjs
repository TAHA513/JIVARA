/**
 * يقطع صورة كولاج منتجات ويضيفها مباشرة للمنتجات في قاعدة البيانات
 *
 * كيفية الاستخدام:
 *   node scripts/split-and-attach-collage.mjs
 *
 * قبل التشغيل:
 *   1. ضع صورة الكولاج في attached_assets/ أو أي مسار
 *   2. حدّث IMAGE_PATH أدناه
 *   3. حدّث CELLS بخريطة (صف،عمود) → معرّف المنتج في DB
 *
 * ملاحظات:
 *   - الصفوف والأعمدة تبدأ من 0
 *   - ضع null في productId إذا لم يُعرف المنتج
 *   - الصور تُخزّن في store_settings وتُربط بالمنتج
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const sharp = require("/home/runner/workspace/artifacts/jivara/node_modules/sharp");
const { Pool } = require("/home/runner/workspace/artifacts/jivara/node_modules/pg");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── إعدادات ────────────────────────────────────────────────────────────────

const IMAGE_PATH = "/home/runner/workspace/attached_assets/ChatGPT_Image_26_مايو_2026،_10_49_08_م_1779824976697.png";

// عدد الأعمدة والصفوف في الكولاج
const COLS = 3;
const ROWS = 3;

// خريطة الخلايا: { row, col, productId, label }
// productId = null → تخطي هذه الخلية
const CELLS = [
  { row: 0, col: 0, productId: 70,   label: "VH-42  → VOXR-VH14 سماعة فوكسر VH14" },
  { row: 0, col: 1, productId: null,  label: "Bi13   → غير موجود — تخطي" },
  { row: 0, col: 2, productId: 68,   label: "MA-13  → MSHL-MA13 سماعة مارشال MA13" },
  { row: 1, col: 0, productId: null,  label: "MA-15  → غير موجود — تخطي" },
  { row: 1, col: 1, productId: 66,   label: "MA-14  → MSHL-MA14 سماعة مارشال MA14 (أبيض نوع C)" },
  { row: 1, col: 2, productId: 66,   label: "MA-14  → MSHL-MA14 سماعة مارشال MA14 (صورة 2)" },
  { row: 2, col: 0, productId: 74,   label: "HOCO ANC+ENC Sandy → HOCO-W35-ANC" },
  { row: 2, col: 1, productId: 78,   label: "HOCO TWS → HOCO-ES71" },
  { row: 2, col: 2, productId: 83,   label: "OTW-324 → ORM-OTW324 سماعة Oraimo" },
];

// جودة JPEG (92 = جودة عالية، حجم معقول)
const JPEG_QUALITY = 92;

// هل تجعل أول صورة هي الرئيسية للمنتج؟
const MAKE_FIRST_MAIN = true;

// ─── الكود الرئيسي ───────────────────────────────────────────────────────────

async function main() {
  // استخدام متغيرات PG البيئية مباشرة (نفس قاعدة البيانات التي يستخدمها الخادم)
  const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  const meta = await sharp(IMAGE_PATH).metadata();
  const W = meta.width;
  const H = meta.height;
  const cellW = Math.floor(W / COLS);
  const cellH = Math.floor(H / ROWS);
  console.log(`\n📐 أبعاد الكولاج: ${W}×${H} — كل خلية: ${cellW}×${cellH}\n`);

  const seenProducts = new Set();

  for (const cell of CELLS) {
    console.log(`▶ ${cell.label}`);

    if (!cell.productId) {
      console.log("   ⏭ تخطي\n");
      continue;
    }

    // قطع الخلية
    const left   = cell.col * cellW;
    const top    = cell.row * cellH;
    const width  = cell.col === COLS - 1 ? W - left : cellW;
    const height = cell.row === ROWS - 1 ? H - top  : cellH;

    const buf = await sharp(IMAGE_PATH)
      .extract({ left, top, width, height })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
    const sizeKB  = Math.round(buf.length / 1024);
    console.log(`   📸 اقتصاص: ${width}×${height}px — ${sizeKB}KB`);

    // مفتاح التخزين: 'temp_image_script_{productId}_{row}_{col}'
    // الـ endpoint /api/images/{imageId} يبحث عن key='temp_image_{imageId}'
    // إذن imageId = 'script_{productId}_{row}_{col}'
    const imageId = `script_${cell.productId}_${cell.row}_${cell.col}`;
    const storeKey = `temp_image_${imageId}`;
    const imageUrl = `/api/images/${imageId}`;

    // تخزين في store_settings
    await pool.query(
      `INSERT INTO store_settings (key, value, store_id, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [storeKey, dataUrl]
    );

    // إضافة URL للمنتج (لا تكرار)
    const isFirst = !seenProducts.has(cell.productId);
    const makeMain = MAKE_FIRST_MAIN && isFirst;
    seenProducts.add(cell.productId);

    if (makeMain) {
      // الصورة الرئيسية: تضاف في البداية
      await pool.query(
        `UPDATE products SET
           images = array_prepend($1::text,
             COALESCE(array_remove(images, $1::text), '{}')),
           images_data = array_prepend($1::text,
             COALESCE(array_remove(images_data, $1::text), '{}'))
         WHERE id = $2`,
        [imageUrl, cell.productId]
      );
      console.log(`   ✅ أضيفت كصورة رئيسية للمنتج #${cell.productId}\n`);
    } else {
      // إضافة في النهاية، تجنّب التكرار
      await pool.query(
        `UPDATE products SET
           images = array_append(
             COALESCE(array_remove(images, $1::text), '{}'), $1::text),
           images_data = array_append(
             COALESCE(array_remove(images_data, $1::text), '{}'), $1::text)
         WHERE id = $2`,
        [imageUrl, cell.productId]
      );
      console.log(`   ✅ أضيفت للمنتج #${cell.productId}\n`);
    }
  }

  // ملخص نهائي
  const ids = [...new Set(CELLS.filter(c => c.productId).map(c => c.productId))];
  if (ids.length) {
    const { rows } = await pool.query(
      `SELECT id, sku, name_ar, array_length(images, 1) AS img_count
       FROM products WHERE id = ANY($1) ORDER BY id`,
      [ids]
    );
    console.log("📊 ملخّص:\n");
    for (const r of rows) {
      console.log(`  ✅ #${r.id} ${r.sku} — ${r.name_ar} — ${r.img_count ?? 0} صورة`);
    }
  }

  await pool.end();
  console.log("\n✅ انتهى\n");
}

main().catch(e => { console.error("❌ خطأ:", e.message); process.exit(1); });
