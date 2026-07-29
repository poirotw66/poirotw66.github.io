import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

type Gtag = (
  command: 'event',
  eventName: string,
  params?: Record<string, string | number | boolean>,
) => void;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: Gtag;
  }
}

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag(...args) {
  window.dataLayer.push(args);
};

function track(
  eventName: string,
  params: Record<string, string | number | boolean> = {},
) {
  window.gtag('event', eventName, {
    page_path: window.location.pathname,
    ...params,
  });
}

function linkLabel(link: HTMLAnchorElement): string {
  return (link.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const link = target.closest<HTMLAnchorElement>('a[href]');
  if (!link) return;

  const href = link.getAttribute('href') ?? '';
  const params = {
    link_url: link.href,
    link_text: linkLabel(link),
  };

  if (link.matches('[data-related-article]')) {
    track('related_article_click', params);
  } else if (link.closest('.topic-path')) {
    track('topic_path_click', params);
  } else if (link.closest('.lang-switcher')) {
    track('language_switch', params);
  } else if (href.startsWith('mailto:')) {
    track(
      /newsletter|電子報/i.test(href) ? 'newsletter_intent' : 'contact_intent',
      params,
    );
  } else if (/\/(?:en\/)?feed\.xml/.test(href)) {
    track('rss_follow', params);
  } else if (/\/(?:en\/)?projects\//.test(href)) {
    track('project_click', params);
  } else if (
    link.origin === window.location.origin
    && /\/(?:en\/)?blog\//.test(link.pathname)
    && /\/(?:en\/)?blog\//.test(window.location.pathname)
  ) {
    track('article_internal_click', params);
  } else if (link.origin !== window.location.origin && /^https?:/.test(link.href)) {
    track('outbound_click', params);
  }
}, { passive: true });

const article = document.querySelector<HTMLElement>('[data-article-reader]');
if (article) {
  let sent75 = false;
  const reportDepth = () => {
    if (sent75) return;
    const rect = article.getBoundingClientRect();
    const start = window.scrollY + rect.top;
    const distance = Math.max(article.scrollHeight - window.innerHeight, 1);
    const depth = (window.scrollY - start + window.innerHeight * 0.7) / distance;
    if (depth >= 0.75) {
      sent75 = true;
      track('article_read_75', {
        article_title: document.querySelector('h1')?.textContent?.trim() ?? '',
      });
      window.removeEventListener('scroll', reportDepth);
    }
  };
  window.addEventListener('scroll', reportDepth, { passive: true });
  reportDepth();
}

function reportWebVital(metric: Metric) {
  track('web_vital', {
    metric_name: metric.name,
    metric_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    metric_id: metric.id,
    metric_rating: metric.rating,
  });
}

onCLS(reportWebVital);
onINP(reportWebVital);
onLCP(reportWebVital);

