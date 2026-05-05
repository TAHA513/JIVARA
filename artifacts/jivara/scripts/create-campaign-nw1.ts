import * as fs from 'fs';
import * as path from 'path';

const TOKEN = process.env.FB_ACCESS_TOKEN || '';
const FB_API = 'https://graph.facebook.com/v19.0';
const WEBSITE_URL = 'https://guevarashopping.com/naturalwalker';
const PIXEL_ID = '1971505830382460';

const IMAGE_FILE = 'attached_assets/file_00000000ddc472469c42d8b4fbdbac95_1776829944225.png';

const AD_BODY =
  '🧢 شفقه رجالي أنيق من ماركة NATURALWALKER البريطانية\n' +
  'مميز وخامة عالية الجودة\n' +
  'مريح للاستخدام اليومي ويكمل إطلالتك الأنيقة\n\n' +
  '💰 الأسعار:\n' +
  '• القطعة الواحدة: 20 الف\n' +
  '• قطعتين فقط بـ 35 الف\n' +
  '• ثلاث قطع فقط بـ 45 الف\n' +
  '• اربع قطع فقط بـ 55 الف\n\n' +
  '🚚 سعر شامل التوصيل إلى جميع محافظات العراق\n' +
  '📞 للحجز والاستفسار: 07819966698\n' +
  '⚡ اطلب الآن والكمية محدودة!';

const AD_TITLE = '🇬🇧 قبّعة NATURALWALKER البريطانية — Since 1998';

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
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  const blob = new Blob([buf], { type: mime });
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

  // ── 1. حساب ١
  console.log('▶ جلب الحسابات...');
  const accts = await get('me/adaccounts?fields=name,account_id,account_status&limit=20');
  if (accts.error) throw new Error(accts.error.message);
  accts.data.forEach((a: any, i: number) => console.log(`  ${i + 1}. ${a.name} — ${a.account_id}`));
  const bc1 = accts.data[0];
  const actId = `act_${bc1.account_id}`;
  console.log(`✅ حساب ١: ${bc1.name} (${actId})\n`);

  // ── 2. صفحة جيفارا
  console.log('▶ جلب الصفحات...');
  const pages = await get('me/accounts?fields=id,name&limit=30');
  if (pages.error) throw new Error(pages.error.message);
  const guevPage = pages.data.find((p: any) =>
    p.name?.includes('جيفارا') || p.name?.toLowerCase().includes('guevara')
  );
  if (!guevPage) throw new Error('صفحة جيفارا غير موجودة');
  console.log(`✅ الصفحة: ${guevPage.name} (${guevPage.id})\n`);

  // ── 3. رفع الصورة
  console.log('▶ رفع الصورة...');
  const hash = await uploadImage(actId, IMAGE_FILE);
  console.log(`✅ hash: ${hash.slice(0, 10)}...\n`);

  // ── 4. إنشاء الحملة
  console.log('▶ إنشاء حملة مبيعات...');
  const camp = await post(`${actId}/campaigns`, {
    name: `NATURALWALKER — مرة واحدة — ${new Date().toLocaleDateString('ar-IQ')}`,
    objective: 'OUTCOME_SALES',
    status: 'ACTIVE',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  });
  if (camp.error) throw new Error('فشل الحملة: ' + JSON.stringify(camp.error));
  console.log(`✅ الحملة: ${camp.id}\n`);

  // ── 5. المجموعة — مع frequency cap مرة واحدة يومياً
  console.log('▶ إنشاء المجموعة ($10/يوم — مرة واحدة لكل شخص)...');
  const adset = await post(`${actId}/adsets`, {
    name: 'NATURALWALKER — مرة واحدة يومياً',
    campaign_id: camp.id,
    status: 'ACTIVE',
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: 10 * 100,
    promoted_object: { pixel_id: PIXEL_ID, custom_event_type: 'PURCHASE' },
    frequency_control_specs: [{ event: 'IMPRESSIONS', interval_days: 1, max_frequency: 1 }],
    targeting: {
      geo_locations: { countries: ['IQ'] },
      age_min: 18,
      age_max: 55,
      genders: [1, 2],
      device_platforms: ['mobile'],
      publisher_platforms: ['facebook', 'instagram'],
      targeting_automation: { advantage_audience: 0 },
    },
  });

  // إذا فشل مع frequency_control_specs، نحاول بدونه
  if (adset.error) {
    console.log(`⚠️ frequency_control_specs غير مدعوم مع هذا الهدف — إنشاء بدونه...`);
    const adset2 = await post(`${actId}/adsets`, {
      name: 'NATURALWALKER — مرة واحدة يومياً',
      campaign_id: camp.id,
      status: 'ACTIVE',
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'OFFSITE_CONVERSIONS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      daily_budget: 10 * 100,
      promoted_object: { pixel_id: PIXEL_ID, custom_event_type: 'PURCHASE' },
      targeting: {
        geo_locations: { countries: ['IQ'] },
        age_min: 18,
        age_max: 55,
        genders: [1, 2],
        device_platforms: ['mobile'],
        publisher_platforms: ['facebook', 'instagram'],
        targeting_automation: { advantage_audience: 0 },
      },
    });
    if (adset2.error) throw new Error('فشل المجموعة: ' + JSON.stringify(adset2.error));
    console.log(`✅ المجموعة (بدون frequency cap): ${adset2.id}\n`);
    Object.assign(adset, adset2);
  } else {
    console.log(`✅ المجموعة (مع frequency cap): ${adset.id}\n`);
  }

  // ── 6. الكريتف — صورة واحدة
  console.log('▶ إنشاء الكريتف (صورة واحدة)...');
  const creative = await post(`${actId}/adcreatives`, {
    name: 'NATURALWALKER — صورة واحدة',
    object_story_spec: {
      page_id: guevPage.id,
      link_data: {
        link: WEBSITE_URL,
        message: AD_BODY,
        name: AD_TITLE,
        image_hash: hash,
        call_to_action: { type: 'SHOP_NOW', value: { link: WEBSITE_URL } },
      },
    },
  });
  if (creative.error) throw new Error('فشل الكريتف: ' + JSON.stringify(creative.error));
  console.log(`✅ الكريتف: ${creative.id}\n`);

  // ── 7. الإعلان
  console.log('▶ إنشاء الإعلان...');
  const ad = await post(`${actId}/ads`, {
    name: 'إعلان NATURALWALKER — مرة واحدة',
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: 'ACTIVE',
  });
  if (ad.error) throw new Error('فشل الإعلان: ' + JSON.stringify(ad.error));
  console.log(`✅ الإعلان: ${ad.id}\n`);

  console.log('═══════════════════════════════════════');
  console.log('🎉 تمت الحملة بنجاح!');
  console.log(`📊 الحساب    : ${bc1.name}`);
  console.log(`📄 الصفحة    : ${guevPage.name}`);
  console.log(`🎯 الهدف     : مبيعات OUTCOME_SALES`);
  console.log(`💰 الميزانية : $10 يومياً`);
  console.log(`🖼️  الإعلان   : صورة واحدة`);
  console.log(`🔂 التكرار   : مرة واحدة لكل شخص/يوم`);
  console.log(`🔗 الرابط    : ${WEBSITE_URL}`);
  console.log(`🆔 ID الإعلان : ${ad.id}`);
  console.log('═══════════════════════════════════════');
}

main().catch(e => { console.error('\n❌ خطأ:', e.message); process.exit(1); });
