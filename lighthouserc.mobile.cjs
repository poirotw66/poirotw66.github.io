const qualityAssertions = {
  'categories:performance': ['error', { minScore: 0.75 }],
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 1 }],
  'categories:seo': ['error', { minScore: 1 }],
  'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
  'total-blocking-time': ['error', { maxNumericValue: 200 }],
  'speed-index': ['error', { maxNumericValue: 4000 }],
  'errors-in-console': ['error', { maxLength: 0 }],
};

const routeBudget = (matchingUrlPattern, maxBytes) => ({
  matchingUrlPattern,
  assertions: {
    ...qualityAssertions,
    'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
    'total-byte-weight': ['error', { maxNumericValue: maxBytes }],
  },
});

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/',
        'http://localhost/blog/',
        'http://localhost/blog/64-ai-agent-guide/',
        'http://localhost/projects/agentic-rag/',
        'http://localhost/search/',
        'http://localhost/404.html',
      ],
      numberOfRuns: 1,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          disabled: false,
        },
        chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertMatrix: [
        routeBudget('https?://[^/]+/$', 430 * 1024),
        routeBudget('https?://[^/]+/blog/$', 850 * 1024),
        routeBudget('https?://[^/]+/blog/64-ai-agent-guide/$', 400 * 1024),
        routeBudget('https?://[^/]+/projects/agentic-rag/$', 400 * 1024),
        routeBudget('https?://[^/]+/search/$', 430 * 1024),
        routeBudget('https?://[^/]+/404\\.html$', 300 * 1024),
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
