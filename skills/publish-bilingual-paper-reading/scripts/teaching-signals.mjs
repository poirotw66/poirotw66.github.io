import { visibleMarkdown } from './visible-markdown.mjs';

export const PAPER_TYPES = ['empirical', 'systems', 'theoretical', 'conceptual', 'mixed'];
export function paperTypeFromFrontmatter(frontmatter = '') {
  const line = frontmatter.match(/^paperType:[^\r\n]*$/m)?.[0];
  if (!line) return 'empirical';
  const value = line.match(/^paperType:[ \t]*["']?([a-z-]+)["']?[ \t]*(?:#.*)?$/)?.[1];
  if (!PAPER_TYPES.includes(value)) throw new Error(`Unsupported or malformed paperType: ${line}`);
  return value;
}

const anchor = /(?:\b(?:Figure|Fig\.?|Table|Section|Appendix|Equation|Theorem|Lemma|Definition|Proposition)\s+[A-Z0-9]|§\s*\d|(?:圖|表|第|附錄|定理|引理|定義|公式)\s*[A-Z0-9一二三])/i;
const relation = /because|instead|rather than|so that|before|whereas|unlike|therefore|hence|maps? .+ (?:to|into)|transforms? .+ (?:to|into)|因為|因此|所以|先.{1,400}再|不是.{1,80}而是|將.{1,80}(?:轉|變|映射)|讓.{1,80}(?:能|可|不)|由.{1,60}(?:得到|推出)/i;
const operations = /input|output|select|build|parse|retrieve|verify|update|state|representation|algorithm|輸入|輸出|選擇|建立|檢索|驗證|更新|狀態|表示|演算法/i;
const assumptions = /assum(?:e|es|ing|ption)|provided that|given that|假設|前提|在.{1,35}條件下/i;
const argument = /proof|prove|deriv|deduc|impli|contradiction|counterexample|therefore|hence|證明|推導|推出|反例|反證|因此|故而/i;
const definition = /defin|denot|entities|relations?|invariant|定義|記為|實體|關係|不變量/i;

// Content signals are review prompts, never a semantic correctness certificate.
// Headings, comments and code cannot supply missing explanation.
export function teachingSignals(body, paperType = 'empirical') {
  if (!PAPER_TYPES.includes(paperType)) throw new Error(`Unsupported paperType: ${paperType}`);
  const visible = visibleMarkdown(body);
  const prose = visible.replace(/^#{1,6}\s+.*$/gm, '').replace(/[*_`]/g, '');
  const paragraphs = prose.split(/\n\s*\n/).map((s) => s.trim()).filter((s) => s.length >= 20);
  const substantial = (pattern) => paragraphs.some((p) => pattern.test(p));
  const prior = substantial(/insufficient|bottleneck|fails?|cannot|independen|limitation|prior|previous|traditional|問題|不足|瓶頸|無法|不能|舊方法|既有|傳統/i);
  const intuition = paragraphs.some((p) => relation.test(p));
  const steps = prose.match(/^\s*\d+\.\s+[^\n]{8,}/gm) ?? [];
  const mechanism = steps.length >= 2 || paragraphs.some((p) => operations.test(p) && relation.test(p)) ||
    (['theoretical', 'conceptual'].includes(paperType) && substantial(definition) && paragraphs.some((p) => argument.test(p) && relation.test(p)));
  const example = steps.length >= 2 || substantial(/for example|consider .+|suppose .+|imagine .+|例如|假設.{6,}|以.{2,30}為例|想像.{6,}/i);
  const evidence = paragraphs.some((p) => anchor.test(p) && /support|show|mean|establish|prove|deriv|impli|demonstrat|支持|顯示|意味|證明|推導|推出|不代表/i.test(p));
  const boundary = substantial(/limitation|\bboundar(?:y|ies)\b|does not|cannot|do not|under .+ assumption|not .{0,15}(?:prove|show)|限制|邊界|不能推論|尚未證明|沒有證明|不代表|不保證/i);
  const consequence = substantial(/when not|engineering|practitioner|adopt|design|should|useful|工程|不適用|不適合|設計|採用|應該|值得|讀者/i);
  return {
    essenceMap: prior && intuition,
    priorLimitation: prior,
    coreIntuition: intuition,
    workedExample: example,
    mechanism,
    evidenceInterpretation: evidence,
    boundary,
    engineeringTransfer: consequence,
    exitRecap: boundary && consequence,
    assumptions: substantial(assumptions),
    reasoning: paragraphs.some((p) => argument.test(p) && relation.test(p)),
    definitions: substantial(definition),
  };
}

// Normalize common measurement notation, not arbitrary numbers such as source dates.
export function quantitativeClaims(body) {
  const prose = visibleMarkdown(body).normalize('NFKC').replace(/[*_`]/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/(\d[\d,.]*)\s*[-–—]\s*(\d[\d,.]*)\s*(%|percent\b|×|x\b|倍)/gi, '$1$3 $2$3');
  const unit = /([\d][\d,]*(?:\.\d+)?)\s*(%|percent\b|×|x\b|倍|ms\b|milliseconds?\b|毫秒|seconds?\b|s\b|秒|tokens?\s*(?:\/\s*s\b|per\s+second\b)|tok\s*\/\s*s\b)/gi;
  return [...prose.matchAll(unit)].map((m) => ({
    value: String(Number(m[1].replaceAll(',', '')) * (/^(?:s|seconds?|秒)$/i.test(m[2]) ? 1000 : 1)),
    unit: /^(?:%|percent)$/i.test(m[2]) ? '%' : /^(?:×|x|倍)$/i.test(m[2]) ? '×' : /^(?:ms|milliseconds?|毫秒|s|seconds?|秒)$/i.test(m[2]) ? 'ms' : 'tokens/s',
  }));
}

// Catch obvious unscoped performance claims. A source anchor alone cannot
// supply missing measurement conditions or establish scientific support.
export function unconditionedMeasurements(body) {
  const visible = visibleMarkdown(body).normalize('NFKC').replace(/[*_`]/g, '');
  const performance = /accuracy|recall|precision|success|speedup|faster|latency|throughput|improv|準確|召回|精確|成功率|完成率|加速|更快|吞吐|延遲|提升/i;
  const setting = /dataset|benchmark|corpus|\b[A-Z][\w-]*Bench\b|ImageNet|CIFAR|HotpotQA|WebShop|LoCoMo|LongMemEval|\b(?:H100|A100|GPU|CPU|TPU)\b|sample|tasks?|crops?|queries|trial|測試|任務|樣本|語料|查詢|資料集|硬體|工作負載|基準/i;
  const comparative = /speedup|faster|improv|gain|加速|更快|提升|提高/i;
  const comparison = /baseline|compared|versus|\bvs\.?\b|than|relative to|\bAR\b|對照|基線|相較|相比|對比|比.{1,60}(?:快|高|低)|從.{1,90}(?:到|至)|由.{1,90}(?:到|至)/i;
  const issues = [];
  // A heading cannot satisfy a missing teaching function, but its factual
  // numerical claims still need context in the immediately following prose.
  const headingParts = visible.split(/(^#{1,6}\s+.*$)/m);
  for (let i = 1; i < headingParts.length; i += 2) {
    const heading = headingParts[i].replace(/^#{1,6}\s+/, '');
    if (!quantitativeClaims(heading).length || !performance.test(heading)) continue;
    const next = (headingParts[i + 1] ?? '').trim().split(/\n\s*\n/)[0] ?? '';
    const context = heading + '\n' + next;
    const supported = context.replace(/[^.!?。！？\n]*(?:unspecified|unknown|missing|not (?:reported|specified|provided)|未(?:交代|說明|指定|提供)|未知|缺少)[^.!?。！？\n]*/gi, '');
    if (!setting.test(supported) || (comparative.test(heading) && !comparison.test(supported))) issues.push(heading.slice(0, 160));
  }
  for (const section of visible.split(/^#{1,6}\s+.*$/m)) {
    const paragraphs = section.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (let i = 0; i < paragraphs.length; i += 1) {
      const p = paragraphs[i];
      if (!quantitativeClaims(p).length || !performance.test(p)) continue;
      // Only tables inherit an adjacent explanation. An ordinary claim cannot
      // borrow a different experiment's setup from an unrelated paragraph.
      const scope = /^\|/.test(p) ? [paragraphs[i - 1], p, paragraphs[i + 1]].filter(Boolean).join('\n') : p;
      const supportedScope = scope.replace(/[^.!?。！？\n]*(?:unspecified|unknown|missing|not (?:reported|specified|provided)|未(?:交代|說明|指定|提供)|未知|缺少)[^.!?。！？\n]*/gi, '');
      const complete = setting.test(supportedScope) && (!comparative.test(p) || comparison.test(supportedScope));
      if (!complete) issues.push(p.slice(0, 160));
    }
  }
  return issues;
}
