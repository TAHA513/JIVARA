const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || '987971091075564';
const TOKEN = process.env.FB_ACCESS_TOKEN;

export async function sendWhatsAppConfirmation(order: {
  id: number;
  customerName: string;
  customerPhone: string;
  city?: string | null;
  totalAmount: number;
  items?: any[];
  notes?: string | null;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!TOKEN) {
      console.error('WhatsApp: FB_ACCESS_TOKEN غير موجود');
      return { success: false, error: 'Token missing' };
    }

    // تنظيف رقم الهاتف وإضافة كود الدولة
    let phone = order.customerPhone.replace(/[\s\-\(\)]/g, '');
    if (phone.startsWith('0')) phone = '964' + phone.slice(1);
    if (!phone.startsWith('964') && !phone.startsWith('+')) phone = '964' + phone;
    phone = phone.replace('+', '');

    // بناء قائمة المنتجات
    const itemsList = order.items && order.items.length > 0
      ? order.items.map((item: any) => `• ${item.productName || item.name} × ${item.quantity}`).join('\n')
      : '• منتجات جيفارا';

    // الرسالة العربية
    const message = `مرحباً ${order.customerName} 👋

✅ تم استلام طلبك بنجاح!

📦 *تفاصيل الطلب #${order.id}*
${itemsList}

💰 المبلغ الإجمالي: ${order.totalAmount.toLocaleString()} دينار
📍 المدينة: ${order.city || 'غير محدد'}
${order.notes ? `📝 الملاحظات: ${order.notes}` : ''}

🚚 سيتم التواصل معك قريباً لتأكيد موعد التوصيل.

شكراً لثقتك بـ *جيفارا للتسوق* 🛍️`;

    const response = await fetch(`https://graph.facebook.com/v19.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    const result = await response.json() as any;

    if (result.error) {
      console.error('WhatsApp إرسال فشل:', result.error.message);
      return { success: false, error: result.error.message };
    }

    const messageId = result.messages?.[0]?.id;
    console.log(`✅ WhatsApp أُرسل للعميل ${order.customerName} (${phone}) — messageId: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error('WhatsApp خطأ غير متوقع:', err.message);
    return { success: false, error: err.message };
  }
}
