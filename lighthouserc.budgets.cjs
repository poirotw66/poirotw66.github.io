const qualityAssertions = {
  'categories:performance': ['error', { minScore: 0.75 }],
  'categories:accessibility': ['error', { minScore: 1 }],
  'categories:best-practices': ['error', { minScore: 1 }],
  'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
  'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
  'total-blocking-time': ['error', { maxNumericValue: 200 }],
  'speed-index': ['error', { maxNumericValue: 4000 }],
  'errors-in-console': ['error', { maxLength: 0 }],
};

const mobileBudgets = {
  home: { maxBytes: 430 * 1024 },
  archive: { maxBytes: 850 * 1024 },
  paper: { maxBytes: 500 * 1024 },
  article: { maxBytes: 400 * 1024 },
  search: { maxBytes: 430 * 1024, indexable: false },
  notFound: { maxBytes: 300 * 1024, indexable: false },
};

const routeBudget = (matchingUrlPattern, budgetName) => {
  const budget = mobileBudgets[budgetName];
  if (!budget) throw new Error(`Unknown mobile budget: ${budgetName}`);
  const { maxBytes, indexable = true } = budget;
  return {
    matchingUrlPattern,
    assertions: {
      ...qualityAssertions,
      ...(indexable ? { 'categories:seo': ['error', { minScore: 1 }] } : {}),
      'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
      'total-byte-weight': ['error', { maxNumericValue: maxBytes }],
    },
  };
};

module.exports = { routeBudget };
