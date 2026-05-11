import * as fs from 'fs';

const TOKEN = process.env.FB_ACCESS_TOKEN || process.env.FB_ADS_TOKEN || '';
const FB_API = 'https://graph.facebook.com/v19.0';
const WEBSITE_URL = 'https://guevarashopping.com/socks-pack';
const PIXEL_ID = '1971505830382460';
const VIDEO_FILE = 'attached_assets/0198-ab175bf3-a1d168e5-98a7dbad-40b1-556359596_1777634819496.mp4';

const AD_BODY =
  'تعبت من جواريب تتلف كل أسبوع؟ 🧦\n\n' +
  'جرّب جواريب بامبو البريطانية — ناعمة، متينة، وتزيل الروائح طبيعياً.\n\n' +
  '✅ كل بوكس = 5 أزواج\n' +
  '✅ الدفع عند الاستلام\n' +
  '✅ توصيل مجاني لكل العراق\n' +
  '🔥 اشتري 4 بوكسات وفّر 30 ألف!';

const AD_TITLE = 'جواريب بامبو البريطانية الأصيلة';
const AD_DESC  = 'وفّر أكثر كلما زدت — الدفع عند الاستلام';

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

async function uploadVideo(actId: string, videoPath: string): Promise<string> {
  console.log('▶ رفع الفيديو... (قد يستغرق دقيقة)');
  const buf = fs.readFileSync(videoPath);
  const blob = new Blob([buf], { type: 'video/mp4' });
  const form = new FormData();
  form.append('access_token', TOKEN);
  form.append('file', blob, 'socks-pack-ad.mp4');
  form.append('title', 'Socks Pack Ad Video');
  const r = await fetch(`${FB_API}/${actId}/advideos`, { method: 'POST', body: form });
  const d = await r.json();
  if (d.error) throw new Error(`فشل رفع الفيديو: ${d.error.message}`);
  if (!d.id) throw new Error('لم يُعد video id: ' + JSON.stringify(d));
  console.log(`✅ الفيديو: ${d.id}`);
  return d.id as string;
}

async function waitVideoReady(videoId: string, maxWait = 120000): Promise<void> {
  console.log('⏳ انتظار معالجة الفيديو...');
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const r = await fetch(`${FB_API}/${videoId}?fields=status&${tok()}`);
    const d = await r.json();
    const status = d?.status?.processing_progress;
    const ready = d?.status?.video_status;
    if (ready === 'ready') { console.log('✅ الفيديو جاهز\n'); return; }
    console.log(`  معالجة: ${status ?? '?'}% — الحالة: ${ready ?? '?'}`);
    await new Promise(res => setTimeout(res, 5000));
  }
  throw new Error('انتهت المهلة — الفيديو لم يجهز');
}

async function main() {
  if (!TOKEN) throw new Error('FB_ADS_TOKEN أو FB_ACCESS_TOKEN غير موجود');

  // 1. الحسابات
  console.log('▶ جلب الحسابات...');
  const accts = await get('me/adaccounts?fields=name,account_id,account_status&limit=20');
  if (accts.error) throw new Error(accts.error.message);
  const bc1 = accts.data[0];
  const actId = `act_${bc1.account_id}`;
  console.log(`✅ الحساب: ${bc1.name} (${actId})\n`);

  // 2. الصفحة
  console.log('▶ جلب الصفحات...');
  const pages = await get('me/accounts?fields=id,name&limit=30');
  if (pages.error) throw new Error(pages.error.message);
  const page = pages.data.find((p: any) =>
    p.name?.includes('جيفارا') || p.name?.toLowerCase().includes('guevara')
  ) || pages.data[0];
  if (!page) throw new Error('لا توجد صفحة');
  console.log(`✅ الصفحة: ${page.name} (${page.id})\n`);

  // 3. رفع الفيديو (تم الرفع مسبقاً — نستخدم ID المحفوظ)
  const videoId = '993322930053100';
  console.log(`✅ الفيديو جاهز (ID محفوظ): ${videoId}\n`);

  // 4. الحملة (تم إنشاؤها مسبقاً)
  const camp = { id: '120244678455310073' };
  console.log(`✅ الحملة موجودة: ${camp.id}\n`);

  // 5. المجموعة الإعلانية (تم إنشاؤها مسبقاً)
  const adset = { id: '120244678487690073' };
  console.log(`✅ المجموعة موجودة: ${adset.id}\n`);

  // 6. الكريتف بالفيديو
  console.log('▶ إنشاء الكريتف (فيديو)...');
  const creative = await post(`${actId}/adcreatives`, {
    name: 'Socks Pack — فيديو',
    object_story_spec: {
      page_id: page.id,
      video_data: {
        video_id: videoId,
        message: AD_BODY,
        title: AD_TITLE,
        link_description: AD_DESC,
        image_url: 'https://guevarashopping.com/api/images/93gfv1761792063953',
        call_to_action: { type: 'SHOP_NOW', value: { link: WEBSITE_URL } },
      },
    },
  });
  if (creative.error) throw new Error('فشل الكريتف: ' + JSON.stringify(creative.error));
  console.log(`✅ الكريتف: ${creative.id}\n`);

  // 7. الإعلان
  console.log('▶ إنشاء الإعلان...');
  const ad = await post(`${actId}/ads`, {
    name: 'إعلان Socks Pack — فيديو',
    adset_id: adset.id,
    creative: { creative_id: creative.id },
    status: 'ACTIVE',
  });
  if (ad.error) throw new Error('فشل الإعلان: ' + JSON.stringify(ad.error));
  console.log(`✅ الإعلان: ${ad.id}\n`);

  console.log('══════════════════════════════════════════');
  console.log('🎉 الحملة أُطلقت بنجاح!');
  console.log(`📊 الحساب     : ${bc1.name}`);
  console.log(`📄 الصفحة     : ${page.name}`);
  console.log(`🎯 الهدف      : OUTCOME_SALES → Purchase`);
  console.log(`👥 الجمهور    : رجال العراق 22-50`);
  console.log(`💰 الميزانية  : $15 يومياً`);
  console.log(`🎬 الإعلان    : فيديو`);
  console.log(`🔗 الرابط     : ${WEBSITE_URL}`);
  console.log(`🆔 ID الحملة  : ${camp.id}`);
  console.log(`🆔 ID المجموعة: ${adset.id}`);
  console.log(`🆔 ID الإعلان : ${ad.id}`);
  console.log('══════════════════════════════════════════');
}

main().catch(e => { console.error('\n❌ خطأ:', e.message); process.exit(1); });
