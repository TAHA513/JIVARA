import { useEffect, useRef } from "react";
import { safeStorage } from "@/lib/safe-storage";
import { apiRequest } from "@/lib/queryClient";

export interface FunnelData {
  fbclid: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  landingPage: string;
  sessionId: string;
}

function parseUrlParams(): Omit<FunnelData, "sessionId"> {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  const utmSource = params.get("utm_source");
  const utmCampaign = params.get("utm_campaign");
  const landingPage = window.location.pathname;

  if (fbclid) safeStorage.setItem("fbclid", fbclid);
  if (utmSource) safeStorage.setItem("utm_source", utmSource);
  if (utmCampaign) safeStorage.setItem("utm_campaign", utmCampaign);

  return {
    fbclid: fbclid || safeStorage.getItem("fbclid"),
    utmSource: utmSource || safeStorage.getItem("utm_source"),
    utmCampaign: utmCampaign || safeStorage.getItem("utm_campaign"),
    landingPage,
  };
}

export function getFunnelData(sessionId: string): FunnelData {
  return {
    ...parseUrlParams(),
    sessionId,
  };
}

async function sendEvent(event: string, sessionId: string, metadata?: Record<string, any>) {
  try {
    const { fbclid, utmSource, utmCampaign, landingPage } = parseUrlParams();
    await apiRequest("POST", "/api/funnel/event", {
      sessionId,
      event,
      fbclid,
      utmSource,
      utmCampaign,
      landingPage,
      metadata: metadata || {},
    });
  } catch (_) {}
}

export function useFunnelTracker(sessionId: string, pageName: string) {
  const formStartedRef = useRef(false);

  useEffect(() => {
    sendEvent("page_view", sessionId, { page: pageName });
  }, [sessionId, pageName]);

  const trackFormStart = () => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      sendEvent("form_start", sessionId, { page: pageName });
    }
  };

  const trackFormSubmit = () => {
    sendEvent("form_submit", sessionId, { page: pageName });
  };

  const trackOrderSuccess = (orderId: number, amount: number) => {
    sendEvent("order_success", sessionId, { page: pageName, orderId, amount });
  };

  const trackOrderFail = (reason: string) => {
    sendEvent("order_fail", sessionId, { page: pageName, reason });
  };

  return { trackFormStart, trackFormSubmit, trackOrderSuccess, trackOrderFail };
}
