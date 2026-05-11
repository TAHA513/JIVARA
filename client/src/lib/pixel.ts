declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

function fbq(...args: any[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

export function pixelViewContent(opts: {
  contentName: string;
  contentIds: string[];
  value: number;
  currency?: string;
}) {
  fbq('track', 'ViewContent', {
    content_name: opts.contentName,
    content_ids: opts.contentIds,
    content_type: 'product',
    value: opts.value,
    currency: opts.currency ?? 'USD',
  });
}

export function pixelInitiateCheckout(opts: {
  contentIds: string[];
  value: number;
  numItems?: number;
  currency?: string;
}) {
  fbq('track', 'InitiateCheckout', {
    content_ids: opts.contentIds,
    content_type: 'product',
    value: opts.value,
    num_items: opts.numItems ?? 1,
    currency: opts.currency ?? 'USD',
  });
}

export function pixelPurchase(opts: {
  orderId: string | number;
  contentIds: string[];
  value: number;
  numItems?: number;
  currency?: string;
}) {
  fbq('track', 'Purchase', {
    content_ids: opts.contentIds,
    content_type: 'product',
    value: opts.value,
    num_items: opts.numItems ?? 1,
    currency: opts.currency ?? 'USD',
    order_id: String(opts.orderId),
  }, { eventID: `order_${opts.orderId}` }); // نفس event_id مع CAPI للـ deduplication
}

export function pixelAddToCart(opts: {
  contentIds: string[];
  value: number;
  numItems?: number;
  currency?: string;
}) {
  fbq('track', 'AddToCart', {
    content_ids: opts.contentIds,
    content_type: 'product',
    value: opts.value,
    num_items: opts.numItems ?? 1,
    currency: opts.currency ?? 'USD',
  });
}
