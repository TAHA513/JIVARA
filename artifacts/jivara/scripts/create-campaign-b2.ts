import * as fs from 'fs';
import * as path from 'path';

const TOKEN = process.env.FB_ACCESS_TOKEN || '';
const FB_API = 'https://graph.facebook.com/v19.0';
const WEBSITE_URL = 'https://guevarashopping.com/zt2';

const IMAGE_FILES = [
  'public/generated/bamboo-black.png',
  'public/generated/bamboo-navy.png',
  'public/generated/bamboo-white.png',
  'public/generated/bamboo-gray.png',
  'public/generated/bamboo-brown.png',
  'public/generated/bamboo-box.png',
];

const CARD_TITLES = [
  'جوارب بامبو أسود',
  'جوارب بامبو كحلي',
  'جوارب بامبو أبيض',
  'جوارب بامبو رمادي',
  'جوارب بامبو بني',
  'بوكس 5 أزواج كامل',
];

const AD_BODY = '🧦 جوارب بامبو البريطانية الفاخرة — ناعمة تمتص الرطوبة وتدوم طويلاً\n✅ بوكس 5 أزواج بألوان مختلفة | 45,000 دينار\n🚚 توصيل لجميع محافظات العراق | الدفع عند الاستلام';
const AD_TITLE = '🇬🇧 جوارب بامبو الفاخرة | بوكس 5 أزواج';

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

// رفع صورة وإرجاع الـ hash — يستخدم native FormData + Blob
async function uploadImage(actId: string, imgPath: string): Promise<string> {
  const buf = fs.readFileSync(imgPath);
  const blob = new Blob([buf], { type: 'image/png' });
  const form = new FormData();
  form.append('access_token', TOKEN);
  form.append('filename', blob, path.basename(imgPath));
  const r = await fetch(`${FB_API}/${actId}/adimages`, { method: 'POST', body: form });
  const d = await r.json();
  if (d.error) throw new Error(`فشل رفع الصورة: ${d.error.message}`);
  const val = Object.values(d.images || {})[0] as any;
  if (!val?.hash) throw new Error('لم يُعد hash: ' + JSON.stringify(d));
  return val.hash as string;
}

async function main() {
  if (!TOKEN) throw new Error('FB_ACCESS_TOKEN غير موجود');

  // ── 1. الحساب B2
  console.log('▶ جلب الحسابات...');
  const accts = await get('me/adaccounts?fields=name,account_id,account_status&limit=20');
  if (accts.error) throw new Error(accts.error.message);
  accts.data.forEach((a: any, i: number) => console.log(`  ${i + 1}. ${a.name} — ${a.account_id}`));
  if (accts.data.length < 2) throw new Error('حساب B2 غير موجود');
  const b2 = accts.data[1];
  const actId = `act_${b2.account_id}`;
  console.log(`✅ B2: ${b2.name} (${actId})\n`);

  // ── 2. صفحة ZT
  console.log('▶ جلب الصفحات...');
  const pages = await get('me/accounts?fields=id,name&limit=30');
  if (pages.error) throw new Error(pages.error.message);
  console.log('  الصفحات:', pages.data.map((p: any) => p.name).join(' | '));
  const ztPage = pages.data.find((p: any) => p.name?.toLowerCase().includes('zt'));
  if (!ztPage) throw new Error('صفحة ZT غير موجودة');
  console.log(`✅ الصفحة: ${ztPage.name} (${ztPage.id})\n`);

  // ── 3. رفع الصور والحصول على الـ hashes
  console.log('▶ رفع الصور...');
  const hashes: string[] = [];
  for (let i = 0; i < IMAGE_FILES.length; i++) {
    const h = await uploadImage(actId, IMAGE_FILES[i]);
    hashes.push(h);
    console.log(`  ✅ صورة ${i + 1}/6 — hash: ${h.slice(0, 10)}...`);
  }
  console.log();

  // ── 4. إنشاء الحملة — هدف مبيعات
  console.log('▶ إنشاء حملة مبيعات...');
  const camp = await post(`${actId}/campaigns`, {
    name: `جوارب بامبو ZT2 — مبيعات — ${new Date().toLocaleDateString('ar-IQ')}`,
    objective: 'OUTCOME_SALES',
    status: 'ACTIVE',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  });
  if (camp.error) throw new Error('فشل الحملة: ' + JSON.stringify(camp.error));
  console.log(`✅ الحملة: ${camp.id}\n`);

  // ── 5. المجموعة الإعلانية — $10/يوم — العراق
  console.log('▶ إنشاء المجموعة (10$ يومياً — العراق)...');
  const adset = await post(`${actId}/adsets`, {
    name: 'جوارب بامبو ZT2 — العراق',
    campaign_id: camp.id,
    status: 'ACTIVE',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: 10 * 100,   // cents → $10
    promoted_object: { pixel_id: '1971505830382460', custom_event_type: 'PURCHASE' },
    targeting: {
      geo_locations: { countries: ['IQ'] },
      age_min: 18,
      age_max: 55,
      genders: [1, 2],
      device_platforms: ['mobile'],
      publisher_platforms: ['facebook', 'instagram'],
    },
  });
  if (adset.error) throw new Error('فشل المجموعة: ' + JSON.stringify(adset.error));
  console.log(`✅ المجموعة: ${adset.id}\n`);

  // ── 6. الكريتف الكاروسيل (6 صور دوارة)
  console.log('▶ إنشاء الكريتف الكاروسيل...');
  const child_attachments = hashes.map((hash, i) => ({
    link: WEBSITE_URL,
    name: CARD_TITLES[i],
    description: '45,000 دينار | الدفع عند الاستلام',
    image_hash: hash,
    call_to_action: { type: 'SHOP_NOW', value: { link: WEBSITE_URL } },
  }));

  const creative = await post(`${actId}/adcreatives`, {
    name: 'كاروسيل جوارب بامبو ZT2',
    object_story_spec: {
      page_id: ztPage.id,
      link_data: {
        link: WEBSITE_URL,
        message: AD_BODY,
        name: AD_TITLE,
        child_attachments,
        multi_share_optimized: true,
        call_to_action: { type: 'SHOP_NOW', value: { link: WEBSITE_URL } },
      },
    },
  });
  if (creative.error) throw new Error('فشل الكريتف: ' + JSON.stringify(creative.error));
  console.log(`✅ الكريتف: ${creative.id}\n`);

  // ── 7. الإعلان النهائي
  console.log('▶ إنشاء الإعلان...');
  const ad = await post(`${actId}/ads`, {
    name: 'إعلان كاروسيل جوارب بامبو ZT2',
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: 'ACTIVE',
  });
  if (ad.error) throw new Error('فشل الإعلان: ' + JSON.stringify(ad.error));
  console.log(`✅ الإعلان: ${ad.id}\n`);

  console.log('═══════════════════════════════');
  console.log('🎉 تمت الحملة بنجاح!');
  console.log(`📊 الحساب    : ${b2.name}`);
  console.log(`📄 الصفحة    : ${ztPage.name}`);
  console.log(`🎯 الهدف     : مبيعات`);
  console.log(`💰 الميزانية : $10 يومياً`);
  console.log(`🔗 الرابط    : ${WEBSITE_URL}`);
  console.log(`🆔 ID الإعلان : ${ad.id}`);
  console.log('═══════════════════════════════');
}

main().catch(e => { console.error('\n❌ خطأ:', e.message); process.exit(1); });
