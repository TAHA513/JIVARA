/**
 * يقطع صورة 3x3 (كولاج منتجات) إلى 9 صور ويضيفها مباشرة للمنتجات في قاعدة البيانات
 * تشغيل: node scripts/split-and-attach-collage.mjs
 */
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const sharp = require("/home/runner/workspace/artifacts/jivara/node_modules/sharp");
const { Pool } = require("/home/runner/workspace/artifacts/jivara/node_modules/pg");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGE_PATH = "/home/runner/workspace/attached_assets/ChatGPT_Image_26_مايو_2026،_10_49_08_م_1779824976697.png";

// خريطة الخلايا (صف،عمود) → معرّف المنتج في قاعدة البيانات
// محدّدة يدوياً بعد مراجعة قاعدة البيانات
const CELLS = [
  { row: 0, col: 0, productId: 70,   label: "VH-42  → VOXR-VH14 سماعة فوكسر VH14" },
  { row: 0, col: 1, productId: null,  label: "Bi13   → غير موجود في قاعدة البيانات — تخطي" },
  { row: 0, col: 2, productId: 68,   label: "MA-13  → MSHL-MA13 سماعة مارشال MA13" },
  { row: 1, col: 0, productId: null,  label: "MA-15  → غير موجود في قاعدة البيانات — تخطي" },
  { row: 1, col: 1, productId: 66,   label: "MA-14  → MSHL-MA14 سماعة مارشال MA14 (أبيض)" },
  { row: 1, col: 2, productId: 66,   label: "MA-14  → MSHL-MA14 سماعة مارشال MA14 (صورة 2)" },
  { row: 2, col: 0, productId: 74,   label: "HOCO ANC+ENC Sandy → HOCO-W35-ANC سماعة هوكو W35 MAX ANC" },
  { row: 2, col: 1, productId: 78,   label: "HOCO TWS → HOCO-ES71 سماعة بلوتوث هوكو ES71" },
  { row: 2, col: 2, productId: 83,   label: "OTW-324 → ORM-OTW324 سماعة Oraimo OTW324" },
];

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
  });

  const meta = await sharp(IMAGE_PATH).metadata();
  const W = meta.width;
  const H = meta.height;
  const cellW = Math.floor(W / 3);
  const cellH = Math.floor(H / 3);
  console.log(`\n📐 أبعاد الصورة: ${W}×${H} — كل خلية: ${cellW}×${cellH}\n`);

  for (const cell of CELLS) {
    console.log(`▶ ${cell.label}`);

    if (!cell.productId) {
      console.log("   ⏭ تخطي\n");
      continue;
    }

    // قطع الخلية من الصورة
    const left   = cell.col * cellW;
    const top    = cell.row * cellH;
    const width  = cell.col === 2 ? W - left : cellW;
    const height = cell.row === 2 ? H - top  : cellH;

    const buf = await sharp(IMAGE_PATH)
      .extract({ left, top, width, height })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    const dataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
    const sizeKB  = Math.round(buf.length / 1024);
    console.log(`   📸 اقتصاص: ${width}×${height}px — ${sizeKB}KB`);

    // تخزين الصورة في store_settings كـ temp_image
    const tempKey = `temp_image_script_${cell.productId}_${cell.row}_${cell.col}`;
    await pool.query(
      `INSERT INTO store_settings (key, value, store_id, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [tempKey, dataUrl]
    );

    // إنشاء رابط الصورة
    const imageUrl = `/api/images/${tempKey}`;

    // إضافة الرابط إلى مصفوفة images_data للمنتج
    await pool.query(
      `UPDATE products SET
         images_data = array_append(
           COALESCE(images_data, ARRAY[]::text[]),
           $1
         ),
         images = array_append(
           COALESCE(images, ARRAY[]::text[]),
           $1
         )
       WHERE id = $2
         AND NOT ($1 = ANY(COALESCE(images_data, ARRAY[]::text[])))`,
      [imageUrl, cell.productId]
    );

    console.log(`   ✅ تمت إضافة الصورة للمنتج #${cell.productId}\n`);
  }

  // التحقق النهائي
  console.log("📊 النتيجة النهائية:\n");
  const ids = [...new Set(CELLS.filter(c => c.productId).map(c => c.productId))];
  const { rows } = await pool.query(
    `SELECT id, name_ar, sku,
            array_length(images, 1) AS img_count
     FROM products WHERE id = ANY($1) ORDER BY id`,
    [ids]
  );
  for (const r of rows) {
    console.log(`  #${r.id} ${r.sku} — ${r.name_ar} — ${r.img_count ?? 0} صورة`);
  }

  await pool.end();
  console.log("\n✅ انتهى\n");
}

main().catch(e => { console.error("❌ خطأ:", e.message); process.exit(1); });
