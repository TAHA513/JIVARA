import cron from "node-cron";
import { storage } from "./storage";

/* ═══════════════════════════════════════════════════════════
   📊 خدمة التقرير اليومي للإعلانات
   يُرسل تقرير تلقائي كل يوم الساعة 11 مساءً (توقيت العراق)
   العراق UTC+3 → الساعة 11 م = 20:00 UTC
═══════════════════════════════════════════════════════════ */

function numFmt(n: number, decimals = 0) {
  return n.toLocaleString("ar-IQ", { maximumFractionDigits: decimals });
}

function usdFmt(n: number) {
  return `$${n.toFixed(2)}`;
}

async function fetchTodayAdsData() {
  const tokenSetting = await storage.getStoreSetting("fb_ads_access_token");
  const token = (tokenSetting?.value && tokenSetting.value.length > 10)
    ? tokenSetting.value
    : process.env.FB_ACCESS_TOKEN;

  const acctSetting = await storage.getStoreSetting("fb_ads_account_id");
  const rawId = acctSetting?.value || process.env.FB_AD_ACCOUNT_ID || "";
  const actId = rawId.startsWith("act_") ? rawId : `act_${rawId}`;

  if (!token || !actId || actId === "act_") {
    throw new Error("لا يوجد توكن أو معرف حساب إعلانات");
  }

  // جلب بيانات اليوم
  const todayUrl = `https://graph.facebook.com/v19.0/${actId}/insights?fields=spend,impressions,clicks,reach,actions,cost_per_action_type&date_preset=today&access_token=${token}`;

  // جلب بيانات أمس للمقارنة
  const yesterdayUrl = `https://graph.facebook.com/v19.0/${actId}/insights?fields=spend,impressions,clicks,reach,actions,cost_per_action_type&date_preset=yesterday&access_token=${token}`;

  // جلب بيانات الشهر
  const monthUrl = `https://graph.facebook.com/v19.0/${actId}/insights?fields=spend,impressions,clicks,reach,actions&date_preset=this_month&access_token=${token}`;

  const [rToday, rYesterday, rMonth] = await Promise.all([
    fetch(todayUrl).then(r => r.json()),
    fetch(yesterdayUrl).then(r => r.json()),
    fetch(monthUrl).then(r => r.json()),
  ]);

  function parseData(d: any) {
    const row = d?.data?.[0] || {};
    const actions = row.actions || [];
    const cpa = row.cost_per_action_type || [];

    const msgs = actions
      .filter((a: any) => [
        "onsite_conversion.total_messaging_connection",
        "onsite_conversion.messaging_first_reply",
      ].includes(a.action_type))
      .reduce((sum: number, a: any) => sum + parseFloat(a.value || "0"), 0);

    const costPerMsg = cpa.find((c: any) =>
      c.action_type === "onsite_conversion.total_messaging_connection"
    );

    return {
      spend:       parseFloat(row.spend || "0"),
      impressions: parseInt(row.impressions || "0"),
      clicks:      parseInt(row.clicks || "0"),
      reach:       parseInt(row.reach || "0"),
      messages:    Math.round(msgs),
      costPerMsg:  costPerMsg ? parseFloat(costPerMsg.value) : 0,
    };
  }

  return {
    today:     parseData(rToday),
    yesterday: parseData(rYesterday),
    month:     parseData(rMonth),
  };
}

async function sendTelegramMessage(text: string) {
  const botTokenSetting = await storage.getStoreSetting("telegram_bot_token");
  const chatIdSetting   = await storage.getStoreSetting("telegram_chat_id");

  const botToken = botTokenSetting?.value;
  const chatId   = chatIdSetting?.value;

  if (!botToken || !chatId) {
    throw new Error("لا يوجد إعدادات تيليغرام");
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "فشل إرسال تيليغرام");
  return data;
}

function buildReportMessage(today: any, yesterday: any, month: any, exchangeRate: number) {
  const now = new Date();
  const iraqTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const dateStr = iraqTime.toLocaleDateString("ar-IQ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  function changeIcon(today: number, yesterday: number) {
    if (!yesterday) return "➖";
    const diff = today - yesterday;
    if (diff > 0) return "📈";
    if (diff < 0) return "📉";
    return "➖";
  }

  function pctChange(today: number, yesterday: number) {
    if (!yesterday) return "";
    const pct = ((today - yesterday) / yesterday * 100).toFixed(0);
    const sign = Number(pct) >= 0 ? "+" : "";
    return ` (${sign}${pct}%)`;
  }

  const spendIQD  = today.spend * exchangeRate;
  const mSpendIQD = month.spend * exchangeRate;
  const cpmIQD    = today.impressions > 0
    ? (today.spend / today.impressions * 1000 * exchangeRate) : 0;
  const cpcIQD    = today.clicks > 0
    ? (today.spend / today.clicks * exchangeRate) : 0;
  const cpMsgIQD  = today.costPerMsg * exchangeRate;

  return `
📊 <b>التقرير اليومي للإعلانات</b>
📅 ${dateStr}
━━━━━━━━━━━━━━━━━━━━━

💰 <b>الإنفاق اليوم</b>
${usdFmt(today.spend)} (${numFmt(spendIQD)} د.ع) ${changeIcon(today.spend, yesterday.spend)}${pctChange(today.spend, yesterday.spend)}

📨 <b>الرسائل اليوم</b>
${numFmt(today.messages)} رسالة ${changeIcon(today.messages, yesterday.messages)}${pctChange(today.messages, yesterday.messages)}
💬 تكلفة الرسالة: ${usdFmt(today.costPerMsg)} (${numFmt(cpMsgIQD)} د.ع)

👁 <b>الوصول والتفاعل</b>
• الوصول: ${numFmt(today.reach)} شخص
• الظهورات: ${numFmt(today.impressions)}
• النقرات: ${numFmt(today.clicks)}
• CPM: ${numFmt(cpmIQD)} د.ع
• CPC: ${numFmt(cpcIQD)} د.ع

🗓 <b>الشهر الحالي</b>
💸 الإنفاق: ${usdFmt(month.spend)} (${numFmt(mSpendIQD)} د.ع)
📨 الرسائل: ${numFmt(month.messages)} رسالة
👁 الوصول: ${numFmt(month.reach)} شخص

━━━━━━━━━━━━━━━━━━━━━
🏪 جيفارا للتسوق | تقرير تلقائي 11:00 م
`.trim();
}

export async function sendDailyReport() {
  try {
    console.log("📊 جاري إرسال التقرير اليومي...");

    const { today, yesterday, month } = await fetchTodayAdsData();

    const rateSetting = await storage.getStoreSetting("usd_to_iqd_rate");
    const exchangeRate = parseFloat(rateSetting?.value || "1500");

    const message = buildReportMessage(today, yesterday, month, exchangeRate);
    await sendTelegramMessage(message);

    console.log("✅ تم إرسال التقرير اليومي بنجاح");
  } catch (err: any) {
    console.error("❌ فشل إرسال التقرير اليومي:", err.message);
  }
}

export function startDailyReportScheduler() {
  // كل يوم الساعة 11 مساءً توقيت العراق = 8:00 مساءً UTC
  // تنسيق cron: الدقيقة الساعة اليوم_الشهر الشهر اليوم_الأسبوع
  cron.schedule("0 20 * * *", async () => {
    console.log("⏰ حان وقت التقرير اليومي (11 م توقيت العراق)");
    await sendDailyReport();
  }, {
    timezone: "UTC",
  });

  console.log("📅 جدولة التقرير اليومي مفعّلة — الإرسال كل يوم 11:00 م (توقيت العراق)");
}
