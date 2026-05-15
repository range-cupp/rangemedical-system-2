import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const EXCLUDED_PREFIXES = ['/admin', '/api', '/portal', '/consent', '/onboard', '/dashboard', '/clinic-tv'];

function shouldTrack(path) {
  return !EXCLUDED_PREFIXES.some(p => path.startsWith(p));
}

function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = sessionStorage.getItem('_rm_sid');
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('_rm_sid', id);
  }
  return id;
}

function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const stored = sessionStorage.getItem('_rm_utm');
  if (stored) return JSON.parse(stored);

  const params = new URLSearchParams(window.location.search);
  const utm = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem('_rm_utm', JSON.stringify(utm));
  }
  return utm;
}

function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  return window.innerWidth <= 768 ? 'mobile' : 'desktop';
}

function sendPageView(path) {
  const utm = getUtmParams();
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: path.replace(/^\//, '') || 'home',
      event: 'page_view',
      sessionId: getSessionId(),
      path,
      deviceType: getDeviceType(),
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
      metadata: { ...utm, url: window.location.href },
      referrer: document.referrer || null,
    }),
  }).catch(() => {});
}

export default function PageTracker() {
  const router = useRouter();
  const lastPath = useRef(null);

  useEffect(() => {
    const path = router.asPath.split('?')[0];
    if (shouldTrack(path) && path !== lastPath.current) {
      lastPath.current = path;
      sendPageView(path);
    }
  }, []);

  useEffect(() => {
    function onRouteChange(url) {
      const path = url.split('?')[0];
      if (shouldTrack(path) && path !== lastPath.current) {
        lastPath.current = path;
        sendPageView(path);
      }
    }
    router.events.on('routeChangeComplete', onRouteChange);
    return () => router.events.off('routeChangeComplete', onRouteChange);
  }, [router.events]);

  return null;
}
