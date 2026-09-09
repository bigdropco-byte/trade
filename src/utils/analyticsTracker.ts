/**
 * Google Analytics 4 (GA4) Tracker for TradeScrapbook
 * Measurement ID: G-HT87NWEHNT
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-HT87NWEHNT';

/**
 * Sends a page_view event to Google Analytics 4
 * @param pageTitle Title of the page or tab
 * @param pagePath Path of the page or virtual tab (e.g. '/', '/calendar', '/analytics')
 */
export const trackPageView = (pageTitle: string, pagePath: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: window.location.origin + pagePath,
      page_path: pagePath,
      send_to: GA_MEASUREMENT_ID,
    });
  }
};

/**
 * Sends a custom interaction event to GA4
 * @param eventName Event name (e.g. 'statement_uploaded', 'demo_loaded', 'share_card')
 * @param params Additional event parameters
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      send_to: GA_MEASUREMENT_ID,
    });
  }
};
