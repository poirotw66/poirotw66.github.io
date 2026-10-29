const { routeBudget } = require('./lighthouserc.budgets.cjs');

module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: [
        'http://localhost/',
        'http://localhost/blog/',
        'http://localhost/paper-reading/',
        'http://localhost/en/paper-reading/',
        'http://localhost/paper-reading/16-past-bench-recursive-self-improvement/',
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
        routeBudget('https?://[^/]+/$', 'home'),
        routeBudget('https?://[^/]+/blog/$', 'archive'),
        routeBudget('https?://[^/]+/(en/)?paper-reading/$', 'archive'),
        routeBudget('https?://[^/]+/paper-reading/16-past-bench-recursive-self-improvement/$', 'paper'),
        routeBudget('https?://[^/]+/blog/64-ai-agent-guide/$', 'article'),
        routeBudget('https?://[^/]+/projects/agentic-rag/$', 'article'),
        routeBudget('https?://[^/]+/search/$', 'search'),
        routeBudget('https?://[^/]+/404\\.html$', 'notFound'),
      ],
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
