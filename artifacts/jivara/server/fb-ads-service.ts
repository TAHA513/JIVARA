const FB_API_VERSION = 'v19.0';

export interface CampaignInsight {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  reach: number;
  actions: number;
  messages: number;
  postEngagements: number;
  leads: number;
  objective: string;
  thumbnail: string | null;
  dailyBudget: number;
  lifetimeBudget: number;
  startTime: string;
  stopTime: string;
}

export interface AdAccountSummary {
  name: string;
  currency: string;
  totalSpend: number;
  campaigns: CampaignInsight[];
  connected: boolean;
  error?: string;
}

export async function fetchAdAccountData(dateRange = 'last_30d', tokenOverride?: string, accountIdOverride?: string): Promise<AdAccountSummary> {
  const token = tokenOverride || process.env.FB_ACCESS_TOKEN;
  const accountId = accountIdOverride || process.env.FB_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    return { name: '', currency: 'IQD', totalSpend: 0, campaigns: [], connected: false, error: 'مفاتيح غير مكوّنة' };
  }

  const id = accountId.startsWith('act_') ? accountId : 'act_' + accountId;

  try {
    // Fetch account info
    const accountRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${id}?fields=name,currency,amount_spent&access_token=${token}`
    );
    const accountData = await accountRes.json();

    if (accountData.error) {
      return { name: '', currency: 'IQD', totalSpend: 0, campaigns: [], connected: false, error: accountData.error.message };
    }

    // جلب الحملات مع الإحصائيات وصورة أول إعلان في كل حملة
    const fields = [
      'name',
      'status',
      'objective',
      'daily_budget',
      'lifetime_budget',
      'start_time',
      'stop_time',
      `insights.date_preset(${dateRange}){spend,impressions,clicks,cpc,cpm,reach,actions,frequency,cost_per_action_type}`,
      'ads.limit(1){creative{thumbnail_url,image_url,body,title}}'
    ].join(',');

    const insightsRes = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${id}/campaigns?fields=${fields}&limit=50&access_token=${token}`
    );
    const insightsData = await insightsRes.json();

    if (insightsData.error) {
      return { name: accountData.name || '', currency: accountData.currency || 'USD', totalSpend: 0, campaigns: [], connected: false, error: insightsData.error.message };
    }

    const campaigns: CampaignInsight[] = (insightsData.data || []).map((c: any) => {
      const ins = c.insights?.data?.[0] || {};
      const actArr: any[] = ins.actions || [];

      const getVal = (...types: string[]) => {
        const found = actArr.find((a: any) => types.includes(a.action_type));
        return parseInt(found?.value || '0');
      };

      // جلب الصورة من أول إعلان
      const firstAd = c.ads?.data?.[0];
      const creative = firstAd?.creative || {};
      const thumbnail = creative.thumbnail_url || creative.image_url || null;

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective || '',
        dailyBudget: parseFloat(c.daily_budget || '0') / 100,
        lifetimeBudget: parseFloat(c.lifetime_budget || '0') / 100,
        startTime: c.start_time || '',
        stopTime: c.stop_time || '',
        thumbnail,
        spend: parseFloat(ins.spend || '0'),
        impressions: parseInt(ins.impressions || '0'),
        clicks: parseInt(ins.clicks || '0'),
        cpc: parseFloat(ins.cpc || '0'),
        cpm: parseFloat(ins.cpm || '0'),
        reach: parseInt(ins.reach || '0'),
        actions: getVal('purchase', 'offsite_conversion.fb_pixel_purchase'),
        messages: getVal(
          'onsite_conversion.messaging_conversation_started_7d',
          'messaging_first_replies',
          'onsite_conversion.total_messaging_connection',
          'messaging_welcome_message_view'
        ),
        postEngagements: getVal('post_engagement', 'page_engagement'),
        leads: getVal('lead', 'onsite_conversion.lead_grouped'),
      };
    });

    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);

    return {
      name: accountData.name || '',
      currency: accountData.currency || 'USD',
      totalSpend,
      campaigns,
      connected: true,
    };
  } catch (e: any) {
    return { name: '', currency: 'IQD', totalSpend: 0, campaigns: [], connected: false, error: e.message };
  }
}
