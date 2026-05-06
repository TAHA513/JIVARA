import * as fs from 'fs';
import * as path from 'path';

const TOKEN = process.env.FB_ACCESS_TOKEN || process.env.FB_ADS_TOKEN || '';
const FB_API = 'https://graph.facebook.com/v19.0';
const PIXEL_ID = '1971505830382460';
const WEBSITE_URL = 'https://guevarashopping.com/socks-uae';

// صور الكاروسيل — 4 ألوان + صورتان ترويجيتان
const IMAGE_FILES = [
  'client/public/caps/promo1.png',
  'client/public/caps/promo2.jpg',
  'client/public/caps/grey.jpg',
  'client/public/caps/navy.jpg',
  'client/public/caps/black.jpg',
  'client/public/caps/beige.jpg',
];

const CARD_TITLES = [
  '🧢 STAY COOL, LOOK SHARP',
  '4 ألوان فاخرة — اختر اللون المناسب',
  'لون رمادي فاتح — أنيق وعصري',
  'لون كحلي — احترافي وجذاب',
  'لون أسود — كلاسيكي لا يُقاوم',
  'لون بيج — فاخر وراقي',
];

const AD_BODY =
  '🧢 كاب MARICO Mesh Sport الرياضي — 4 ألوان حصرية للإمارات\n\n' +
  'شبكة تهوية متطورة تتيح مرور الهواء تحميك من الشمس\n' +
  'مناسب للرياضة والاستخدام اليومي\n\n' +
  '💰 السعر:\n' +
  '• القطعة الواحدة: 99 درهم\n' +
  '• 🎁 الباقة الكاملة (4 ألوان): 300 درهم فقط بدل 396 درهم\n\n' +
  '🚚 توصيل مجاني لجميع الإمارات خلال 72 ساعة\n' +
  '✅ الدفع عند الاستلام\n' +
  '⚡ اطلب الآن والكمية محدودة!';

const AD_TITLE = '🧢 MARICO Mesh Sport Cap — الإمارات';
const AD_DESC  = 'توصيل مجاني · الدفع عند الاستلام · 4 ألوان';

const tok = () => `access_token=${encodeURIComponent(TOKEN)}`;

async function post(endpoint: string, body: any) {
  const r = await fetch(`${FB_API}/${endpoint}?${tok()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function get(endpoint: string) {
  const r = await fetch(`${FB_API}/${endpoint}&${tok()}`);
  return r.json();
}

async function uploadImage(actId: string, imgPath: string): Promise<string> {
  const buf = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  const blob = new Blob([buf], { type: mime });
  const form = new FormData();
  form.append('access_token', TOKEN);
  form.append('filename', blob, path.basename(imgPath));
  const r = await fetch(`${FB_API}/${actId}/adimages`, { method: 'POST', body: form });
  const d = await r.json();
  if (d.error) throw new Error(`فشل رفع الصورة ${path.basename(imgPath)}: ${d.error.message}`);
  const val = Object.values(d.images || {})[0] as any;
  if (!val?.hash) throw new Error('لم يُعد hash: ' + JSON.stringify(d));
  return val.hash as string;
}

async function main() {
  if (!TOKEN) throw new Error('FB_ACCESS_TOKEN غير موجود في البيئة');

  // ── 1. الحسابات الإعلانية
  console.log('▶ جلب الحسابات الإعلانية...');
  const accts = await get('me/adaccounts?fields=name,account_id,account_status,currency&limit=20');
  if (accts.error) throw new Error(accts.error.message);
  accts.data.forEach((a: any, i: number) =>
    console.log(`  ${i + 1}. ${a.name} — ${a.account_id} — ${a.currency}`)
  );
  const bc1 = accts.data[0];
  const actId = `act_${bc1.account_id}`;
  console.log(`✅ الحساب: ${bc1.name} (${actId}) — العملة: ${bc1.currency}\n`);

  // ── 2. البحث عن صفحة إيوان
  console.log('▶ جلب الصفحات...');
  const pages = await get('me/accounts?fields=id,name&limit=30');
  if (pages.error) throw new Error(pages.error.message);
  console.log('  الصفحات المتاحة:', pages.data.map((p: any) => p.name).join(' | '));

  const ewanPage = pages.data.find((p: any) =>
    p.name?.includes('إيوان') ||
    p.name?.toLowerCase().includes('ewan') ||
    p.name?.toLowerCase().includes('iwan')
  );
  if (!ewanPage) {
    console.log('\n❌ صفحة إيوان لم تُوجد. الصفحات المتاحة:');
    pages.data.forEach((p: any, i: number) => console.log(`  ${i + 1}. ${p.name} — ${p.id}`));
    throw new Error('صفحة إيوان غير موجودة — راجع الأسماء أعلاه واضبط البحث');
  }
  console.log(`✅ الصفحة: ${ewanPage.name} (${ewanPage.id})\n`);

  // ── 3. رفع الصور (6 صور)
  console.log('▶ رفع الصور...');
  const hashes: string[] = [];
  for (let i = 0; i < IMAGE_FILES.length; i++) {
    const h = await uploadImage(actId, IMAGE_FILES[i]);
    hashes.push(h);
    console.log(`  ✅ صورة ${i + 1}/${IMAGE_FILES.length} — ${path.basename(IMAGE_FILES[i])}`);
  }
  console.log();

  // ── 4. إنشاء الحملة — هدف مبيعات
  console.log('▶ إنشاء حملة مبيعات...');
  const camp = await post(`${actId}/campaigns`, {
    name: `MARICO Cap UAE — مبيعات — ${new Date().toLocaleDateString('ar-AE')}`,
    objective: 'OUTCOME_SALES',
    status: 'ACTIVE',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  });
  if (camp.error) throw new Error('فشل الحملة: ' + JSON.stringify(camp.error));
  console.log(`✅ الحملة: ${camp.id}\n`);

  // ── 5. المجموعة الإعلانية — 15 درهم/يوم — الإمارات
  // AED account: daily_budget = 1500 (15 AED × 100 fils)
  // USD account: daily_budget = 408 (≈ $4.08 ≈ 15 AED)
  const isAED = bc1.currency === 'AED';
  const dailyBudget = isAED ? 15 * 100 : Math.round((15 / 3.67) * 100);
  console.log(`▶ إنشاء المجموعة (${isAED ? '15 AED' : `$${(dailyBudget/100).toFixed(2)}`}/يوم — الإمارات)...`);
  const adset = await post(`${actId}/adsets`, {
    name: 'MARICO Cap — الإمارات — رجال 18-50',
    campaign_id: camp.id,
    status: 'ACTIVE',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: dailyBudget,
    promoted_object: { pixel_id: PIXEL_ID, custom_event_type: 'PURCHASE' },
    targeting: {
      geo_locations: { countries: ['AE'] },
      age_min: 18,
      age_max: 50,
      genders: [1],
      device_platforms: ['mobile'],
      publisher_platforms: ['facebook', 'instagram'],
      targeting_automation: { advantage_audience: 0 },
    },
  });
  if (adset.error) throw new Error('فشل المجموعة: ' + JSON.stringify(adset.error));
  console.log(`✅ المجموعة: ${adset.id}\n`);

  // ── 6. الكريتف الكاروسيل (6 صور)
  console.log('▶ إنشاء الكريتف الكاروسيل...');
  const child_attachments = hashes.map((hash, i) => ({
    link: WEBSITE_URL,
    name: CARD_TITLES[i],
    description: AD_DESC,
    image_hash: hash,
    call_to_action: { type: 'SHOP_NOW', value: { link: WEBSITE_URL } },
  }));

  const creative = await post(`${actId}/adcreatives`, {
    name: 'MARICO Cap UAE — كاروسيل 6 صور',
    object_story_spec: {
      page_id: ewanPage.id,
      link_data: {
        link: WEBSITE_URL,
        message: AD_BODY,
        name: AD_TITLE,
        description: AD_DESC,
        child_attachments,
        multi_share_optimized: true,
        call_to_action: { type: 'SHOP_NOW', value: { link: WEBSITE_URL } },
      },
    },
  });
  if (creative.error) throw new Error('فشل الكريتف: ' + JSON.stringify(creative.error));
  console.log(`✅ الكريتف: ${creative.id}\n`);

  // ── 7. الإعلان
  console.log('▶ إنشاء الإعلان...');
  const ad = await post(`${actId}/ads`, {
    name: 'MARICO Cap UAE — كاروسيل',
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: 'ACTIVE',
  });
  if (ad.error) throw new Error('فشل الإعلان: ' + JSON.stringify(ad.error));
  console.log(`✅ الإعلان: ${ad.id}\n`);

  console.log('══════════════════════════════════════════════');
  console.log('🎉 الحملة أُطلقت بنجاح!');
  console.log(`📊 الحساب      : ${bc1.name}`);
  console.log(`📄 الصفحة      : ${ewanPage.name} (${ewanPage.id})`);
  console.log(`🎯 الهدف       : OUTCOME_SALES → Purchase`);
  console.log(`🌍 الجمهور     : رجال الإمارات — عمر 18–50 — موبايل`);
  console.log(`📱 المنصات     : Facebook + Instagram`);
  console.log(`💰 الميزانية   : 15 AED يومياً`);
  console.log(`🖼️  الإعلان    : كاروسيل 6 صور`);
  console.log(`🔗 الرابط      : ${WEBSITE_URL}`);
  console.log(`🆔 ID الحملة   : ${camp.id}`);
  console.log(`🆔 ID المجموعة : ${adset.id}`);
  console.log(`🆔 ID الإعلان  : ${ad.id}`);
  console.log('══════════════════════════════════════════════');
}

main().catch(e => { console.error('\n❌ خطأ:', e.message); process.exit(1); });
