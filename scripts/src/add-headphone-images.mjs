import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const ASSETS = '/home/runner/workspace/attached_assets';

async function storeImage(filename, productId) {
  const filepath = path.join(ASSETS, filename);
  if (!fs.existsSync(filepath)) { console.log(`❌ غير موجود: ${filename}`); return null; }
  const buf = fs.readFileSync(filepath);
  const b64 = `data:image/png;base64,${buf.toString('base64')}`;
  const imageId = `img${productId}_${Date.now()}_${Math.random().toString(36).slice(2,5)}`;
  await client.query(
    `INSERT INTO store_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [`temp_image_${imageId}`, b64]
  );
  console.log(`  ✅ رُفعت: ${filename.slice(-20)} → /api/images/${imageId}`);
  return `/api/images/${imageId}`;
}

const tasks = [
  // Hoco W35 MAX (id=74)
  { productId: 74, files: [
    'ChatGPT_Image_27_مايو_2026،_03_54_58_ص_1779843468817.png',
    'ChatGPT_Image_27_مايو_2026،_03_54_50_ص_1779843468818.png',
    'ChatGPT_Image_27_مايو_2026،_03_54_41_ص_1779843468818.png',
  ]},
  // Hoco W35 AIR (id=75)
  { productId: 75, files: [
    'ChatGPT_Image_27_مايو_2026،_03_54_30_ص_1779843468819.png',
  ]},
  // Marshal ME01 Bluetooth (id=76) — هو Marshal VIP ME-01
  { productId: 76, files: [
    'ChatGPT_Image_27_مايو_2026،_03_54_06_ص_1779843468821.png',
    'ChatGPT_Image_27_مايو_2026،_03_53_58_ص_1779843468821.png',
  ]},
  // Anker / Soundcore Q20i (id=80)
  { productId: 80, files: [
    'ChatGPT_Image_27_مايو_2026،_03_54_22_ص_1779843468820.png',
    'ChatGPT_Image_27_مايو_2026،_03_54_13_ص_1779843468820.png',
  ]},
];

for (const task of tasks) {
  console.log(`\n📦 المنتج id=${task.productId}`);
  const urls = [];
  for (const f of task.files) {
    const url = await storeImage(f, task.productId);
    if (url) urls.push(url);
  }
  if (urls.length) {
    const arr = '{' + urls.map(u => `"${u}"`).join(',') + '}';
    await client.query(`UPDATE products SET images = $1 WHERE id = $2`, [arr, task.productId]);
    console.log(`  🔗 ربطت ${urls.length} صور بالمنتج ${task.productId}`);
  }
}

await client.end();
console.log('\n🎉 انتهى!');
