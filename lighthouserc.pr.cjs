const mobileConfig = require('./lighthouserc.mobile.cjs');
const baseMatrix = mobileConfig.ci.assert.assertMatrix;

const matchBudget = (pattern, sourceIndex) => ({
  matchingUrlPattern: pattern,
  assertions: baseMatrix[sourceIndex].assertions,
});

module.exports = {
  ci: {
    ...mobileConfig.ci,
    collect: {
      ...mobileConfig.ci.collect,
      url: [
        'http://localhost/',
        'http://localhost/blog/',
        'http://localhost/en/blog/',
        'http://localhost/paper-reading/',
        'http://localhost/blog/64-ai-agent-guide/',
        'http://localhost/blog/100-gemini-3-8-flash-coding-agent-workflow/',
      ],
      // PR runners share CPU with other jobs. Use three samples so a single
      // scheduling spike cannot fail an otherwise healthy TBT budget.
      numberOfRuns: 3,
    },
    assert: {
      ...mobileConfig.ci.assert,
      assertMatrix: [
        ...baseMatrix,
        matchBudget('https?://[^/]+/en/blog/$', 1),
        matchBudget('https?://[^/]+/paper-reading/$', 1),
        matchBudget('https?://[^/]+/blog/100-gemini-3-8-flash-coding-agent-workflow/$', 2),
      ],
    },
  },
};
