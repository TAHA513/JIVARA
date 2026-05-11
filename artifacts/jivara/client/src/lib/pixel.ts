declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    ttq: any;
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

// ── TikTok Pixel helpers ──────────────────────────────────────────────────────

function ttq(...args: any[]) {
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(...args);
  }
}

export function tiktokViewContent(opts: {
  contentName: string;
  contentIds: string[];
  value: number;
  currency?: string;
}) {
  ttq('ViewContent', {
    contents: opts.contentIds.map(id => ({
      content_id: id,
      content_type: 'product',
      content_name: opts.contentName,
      price: opts.value,
      quantity: 1,
    })),
    value: opts.value,
    currency: opts.currency ?? 'USD',
  });
}

export function tiktokInitiateCheckout(opts: {
  contentIds: string[];
  value: number;
  numItems?: number;
  currency?: string;
}) {
  ttq('InitiateCheckout', {
    contents: opts.contentIds.map(id => ({
      content_id: id,
      content_type: 'product',
      price: opts.value,
      quantity: opts.numItems ?? 1,
    })),
    value: opts.value,
    currency: opts.currency ?? 'USD',
  });
}

export function tiktokPurchase(opts: {
  orderId: string | number;
  contentIds: string[];
  value: number;
  numItems?: number;
  currency?: string;
}) {
  ttq('CompletePayment', {
    contents: opts.contentIds.map(id => ({
      content_id: id,
      content_type: 'product',
      price: opts.value,
      quantity: opts.numItems ?? 1,
    })),
    value: opts.value,
    currency: opts.currency ?? 'USD',
  });
}
