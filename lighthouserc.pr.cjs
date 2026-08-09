const mobileConfig = require('./lighthouserc.mobile.cjs');

module.exports = {
  ci: {
    ...mobileConfig.ci,
    collect: {
      ...mobileConfig.ci.collect,
      url: [
        'http://localhost/',
        'http://localhost/blog/',
        'http://localhost/blog/64-ai-agent-guide/',
      ],
      // PR runners share CPU with other jobs. Use three samples so a single
      // scheduling spike cannot fail an otherwise healthy TBT budget.
      numberOfRuns: 3,
    },
  },
};
