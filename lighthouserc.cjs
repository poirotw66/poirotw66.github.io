module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost/', 'http://localhost/blog/'],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        chromeFlags: '--headless=new --no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median-run' }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800, aggregationMethod: 'median-run' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median-run' }],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod: 'median-run' }],
        'speed-index': ['error', { maxNumericValue: 3400, aggregationMethod: 'median-run' }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 90 * 1024 }],
        'resource-summary:document:size': ['error', { maxNumericValue: 130 * 1024 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
};
