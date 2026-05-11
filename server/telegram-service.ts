import TelegramBot from 'node-telegram-bot-api';
import type { Order } from '@shared/schema';
import { storage } from './storage';

class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;

  constructor() {
    // Initialize from database settings when needed
  }

  private async initializeBot() {
    try {
      // Get settings from database
      const botTokenSetting = await storage.getStoreSetting('telegram_bot_token');
      const chatIdSetting = await storage.getStoreSetting('telegram_chat_id');

      const token = botTokenSetting?.value;
      const chatId = chatIdSetting?.value;

      console.log('Telegram settings check:', {
        tokenExists: !!token,
        chatIdExists: !!chatId,
        tokenLength: token?.length || 0
      });

      if (!token || !chatId) {
        throw new Error('إعدادات البوت غير مكتملة - يجب إدخال رمز البوت ومعرف المحادثة');
      }

      if (!token.includes(':')) {
        throw new Error('رمز البوت غير صحيح - يجب أن يحتوي على : في الوسط');
      }

      this.bot = new TelegramBot(token, { polling: false });
      this.chatId = chatId;
      console.log('Telegram bot initialized successfully from database settings');
      return true;
    } catch (error) {
      console.error('Failed to initialize Telegram bot:', error);
      throw error;
    }
  }

  async sendOrderNotification(order: Order) {
    // Initialize bot if not already done
    if (!this.bot || !this.chatId) {
      const initialized = await this.initializeBot();
      if (!initialized) {
        console.log('Telegram bot not configured - skipping notification');
        return;
      }
    }

    try {
      const message = this.formatOrderMessage(order);
      await this.bot!.sendMessage(this.chatId!, message, { parse_mode: 'HTML' });
      console.log(`Order notification sent to Telegram for order #${order.id}`);
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  private formatOrderMessage(order: Order): string {
    const orderDate = new Date(order.createdAt || new Date()).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let itemsList = '';
    if (Array.isArray(order.items)) {
      itemsList = order.items.map(item => {
        const ref = item.sku ? item.sku : (item.nameAr || item.name || '').substring(0, 20);
        let sizeInfo = '';
        if (item.sizes) {
          if (typeof item.sizes === 'string' && item.sizes.trim().length > 0) {
            // sizes stored as string e.g. "42×1" or "42×1 43×2"
            sizeInfo = ` [${item.sizes.trim()}]`;
          } else if (typeof item.sizes === 'object' && Object.keys(item.sizes).length > 0) {
            const sizeParts = Object.entries(item.sizes as Record<string,number>)
              .filter(([, q]) => q > 0)
              .map(([s, q]) => `${s}×${q}`)
              .join(' ');
            sizeInfo = ` [${sizeParts}]`;
          } else {
            sizeInfo = ` ×${item.quantity}`;
          }
        } else {
          sizeInfo = ` ×${item.quantity}`;
        }
        return `• ${ref}${sizeInfo} ${parseFloat(item.price).toLocaleString('en-US')} د.ع`;
      }).join('\n');
    }

    const notesLine = order.notes ? `\n📝 ${order.notes}` : '';

    return `
🔔 <b>طلب جديد #${order.id}</b>

👤 ${order.customerName}
📱 ${order.customerPhone}
🏙️ ${order.city} — ${order.shippingAddress}

${itemsList}${notesLine}

💰 <b>${parseFloat(order.totalAmount).toLocaleString('en-US')} د.ع</b>
`.trim();
  }

  async sendTestMessage() {
    // Initialize bot with fresh settings
    const initialized = await this.initializeBot();
    if (!initialized) {
      throw new Error('Telegram bot not configured - missing bot token or chat ID');
    }

    try {
      await this.bot!.sendMessage(this.chatId!, 
        '✅ تم تفعيل بوت إشعارات سنتر المستودع للساعات والعطور بنجاح!'
      );
      return true;
    } catch (error) {
      console.error('Failed to send test message:', error);
      throw error;
    }
  }

  async sendCancellationNotification(cancelData: {
    orderId: number;
    customerName: string;
    customerPhone: string;
    totalAmount: string;
    cancelledBy: string;
  }) {
    // Initialize bot if not already done
    if (!this.bot || !this.chatId) {
      const initialized = await this.initializeBot();
      if (!initialized) {
        console.log('Telegram bot not configured - skipping cancellation notification');
        return;
      }
    }

    try {
      const message = this.formatCancellationMessage(cancelData);
      await this.bot!.sendMessage(this.chatId!, message, { parse_mode: 'HTML' });
      console.log(`Cancellation notification sent to Telegram for order #${cancelData.orderId}`);
    } catch (error) {
      console.error('Failed to send Telegram cancellation notification:', error);
    }
  }

  private formatCancellationMessage(cancelData: {
    orderId: number;
    customerName: string;
    customerPhone: string;
    totalAmount: string;
    cancelledBy: string;
  }): string {
    const cancelDate = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `🚫 <b>تم إلغاء طلب - سنتر المستودع</b>

🆔 <b>رقم الطلب:</b> #${cancelData.orderId}
📅 <b>تاريخ الإلغاء:</b> ${cancelDate}

👤 <b>بيانات العميل:</b>
• <b>الاسم:</b> ${cancelData.customerName}
• <b>الهاتف:</b> ${cancelData.customerPhone}

💰 <b>المبلغ المسترد:</b> ${cancelData.totalAmount} د.ع

👨‍💼 <b>تم الإلغاء بواسطة:</b> ${cancelData.cancelledBy}

⚠️ <b>ملاحظة:</b> تم خصم المبلغ من إجمالي الإيرادات تلقائياً`;
  }
}

export const telegramService = new TelegramService();