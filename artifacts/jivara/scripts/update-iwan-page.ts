const TOKEN = process.env.FB_ACCESS_TOKEN || '';
const PAGE_ID = '166893323180509';
const CTA_URL = 'https://guevarashopping.com/socks-uae';

const NEW_ABOUT =
  '🛍️ متجر IWAN — تسوق أونلاين بكل سهولة\n' +
  'منتجات عالية الجودة بأسعار مناسبة 💎\n' +
  '🚚 توصيل سريع لجميع الإمارات\n' +
  '✅ الدفع عند الاستلام — بدون مخاطرة\n' +
  '📦 منتجاتنا الحالية: كاب MARICO Mesh Sport — 4 ألوان | 99 AED\n' +
  '⚡ اطلب الآن واستلم خلال 72 ساعة';

const NEW_DESCRIPTION =
  'متجر IWAN — تسوق ذكي وتوصيل سريع لجميع الإمارات. ' +
  'منتجات مختارة بعناية وجودة عالية بأسعار تنافسية. ' +
  'الدفع عند الاستلام متاح على جميع الطلبات.';

const WEBSITE_URL = CTA_URL;

async function get(endpoint: string, pageToken: string) {
  const r = await fetch(`https://graph.facebook.com/v19.0/${endpoint}&access_token=${encodeURIComponent(pageToken)}`);
  return r.json();
}

async function postForm(endpoint: string, body: Record<string, string>) {
  const form = new URLSearchParams({ ...body });
  const r = await fetch(`https://graph.facebook.com/v19.0/${endpoint}`, {
    method: 'POST',
    body: form,
  });
  return r.json();
}

async function main() {
  if (!TOKEN) throw new Error('FB_ACCESS_TOKEN غير موجود');

  // ── 1. جلب توكن الصفحة
  console.log('▶ جلب توكن صفحة IWAN...');
  const acc = await get(`me/accounts?fields=id,name,access_token&limit=30`, TOKEN);
  if (acc.error) throw new Error(acc.error.message);
  const page = acc.data.find((p: any) => p.id === PAGE_ID);
  if (!page) throw new Error('صفحة IWAN غير موجودة في الحسابات');
  const PAGE_TOKEN = page.access_token;
  console.log(`✅ الصفحة: ${page.name} (${PAGE_ID})\n`);

  // ── 2. تحديث about (الوصف القصير)
  console.log('▶ تحديث وصف الصفحة (about)...');
  const aboutRes = await postForm(`${PAGE_ID}`, {
    about: NEW_ABOUT,
    access_token: PAGE_TOKEN,
  });
  if (aboutRes.error) {
    console.log(`⚠️  about: ${aboutRes.error.message}`);
  } else {
    console.log('✅ about محدَّث\n');
  }

  // ── 3. تحديث description
  console.log('▶ تحديث description...');
  const descRes = await postForm(`${PAGE_ID}`, {
    description: NEW_DESCRIPTION,
    access_token: PAGE_TOKEN,
  });
  if (descRes.error) {
    console.log(`⚠️  description: ${descRes.error.message}`);
  } else {
    console.log('✅ description محدَّث\n');
  }

  // ── 4. تحديث الموقع الإلكتروني
  console.log('▶ تحديث الموقع الإلكتروني...');
  const webRes = await postForm(`${PAGE_ID}`, {
    website: WEBSITE_URL,
    access_token: PAGE_TOKEN,
  });
  if (webRes.error) {
    console.log(`⚠️  website: ${webRes.error.message}`);
  } else {
    console.log('✅ website محدَّث\n');
  }

  // ── 5. تحديث CTA الصفحة (زر الاتصال بنا)
  console.log('▶ تحديث زر CTA للصفحة...');
  // أولاً جلب الـ CTA الحالي
  const ctaGet = await fetch(
    `https://graph.facebook.com/v19.0/${PAGE_ID}?fields=call_to_action&access_token=${encodeURIComponent(PAGE_TOKEN)}`
  ).then(r => r.json());

  let ctaRes: any;
  if (!ctaGet.error && ctaGet.call_to_action?.id) {
    // تحديث CTA موجود
    ctaRes = await postForm(`${ctaGet.call_to_action.id}`, {
      type: 'SHOP_NOW',
      web_url: CTA_URL,
      access_token: PAGE_TOKEN,
    });
  } else {
    // إنشاء CTA جديد
    ctaRes = await postForm(`${PAGE_ID}/call_to_action`, {
      type: 'SHOP_NOW',
      web_url: CTA_URL,
      access_token: PAGE_TOKEN,
    });
  }

  if (ctaRes.error) {
    console.log(`⚠️  CTA: ${ctaRes.error.message}`);
  } else {
    console.log(`✅ زر CTA (SHOP_NOW) يشير إلى: ${CTA_URL}\n`);
  }

  // ── التقرير النهائي
  console.log('══════════════════════════════════════════════');
  console.log('🎉 تم تحديث صفحة IWAN بنجاح!');
  console.log(`📄 الصفحة     : ${page.name} (${PAGE_ID})`);
  console.log(`📝 الوصف      : متجر تسوق — منتجات MARICO`);
  console.log(`🔗 الموقع     : ${WEBSITE_URL}`);
  console.log(`🛒 زر CTA     : SHOP_NOW → ${CTA_URL}`);
  console.log('══════════════════════════════════════════════');
}

main().catch(e => { console.error('\n❌ خطأ:', e.message); process.exit(1); });
