import crypto from 'crypto';

const FB_API_VERSION = 'v19.0';

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

interface OrderData {
  id: number;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  items: any[];
  createdAt?: Date | string;
  fbclid?: string | null;
  utmCampaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
}

export async function sendPurchaseEvent(order: OrderData, clientIp?: string, userAgent?: string) {
  const pixelId = process.env.FB_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.log('Facebook CAPI: مفاتيح غير مكوّنة، تم التخطي');
    return;
  }

  const eventTime = Math.floor(Date.now() / 1000);

  // تنظيف رقم الهاتف وتجهيزه
  const phone = order.customerPhone?.replace(/\D/g, '');
  const hashedPhone = phone ? sha256(phone) : undefined;

  // تجهيز fbc من fbclid — أهم إشارة لربط الشراء بالإعلان
  let fbc: string | undefined;
  if (order.fbclid) {
    const createdTs = order.createdAt
      ? Math.floor(new Date(order.createdAt).getTime() / 1000)
      : eventTime;
    fbc = `fb.1.${createdTs}.${order.fbclid}`;
  }

  const contents = (order.items || []).map((item: any, idx: number) => {
    const rawId = item.productId ?? item.id;
    const id = (rawId !== null && rawId !== undefined && String(rawId).trim() !== '' && String(rawId) !== '0')
      ? String(rawId)
      : (item.sku || item.nameAr || item.name || `order_${order.id}_item_${idx}`);
    return {
      id: String(id).slice(0, 100),
      quantity: Number(item.quantity) || 1,
      item_price: parseFloat(item.price || '0') || 0,
    };
  });

  const numItems = contents.reduce((s: number, c: any) => s + c.quantity, 0);
  const totalIQD = parseFloat(order.totalAmount || '0');
  const totalUSD = parseFloat((totalIQD / 1500).toFixed(2));

  const userData: Record<string, any> = {};
  if (hashedPhone) userData.ph = [hashedPhone];
  if (fbc) userData.fbc = fbc;
  if (clientIp) userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTime,
        action_source: 'website',
        event_id: `order_${order.id}`,
        user_data: userData,
        custom_data: {
          currency: 'USD',
          value: totalUSD,
          content_ids: contents.map((c: any) => c.id),
          contents,
          num_items: numItems,
          order_id: String(order.id),
          ...(order.utmCampaign ? { campaign_id: order.utmCampaign } : {}),
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/${FB_API_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`✅ Facebook CAPI: حدث شراء أُرسل للطلب #${order.id} | fbc=${fbc || 'لا يوجد'} | ${totalUSD}$`, JSON.stringify(data));
  } else {
    console.error(`❌ Facebook CAPI خطأ للطلب #${order.id}:`, JSON.stringify(data));
  }
}
