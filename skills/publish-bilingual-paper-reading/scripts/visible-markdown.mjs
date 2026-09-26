// Preserve offsets while excluding comments and code from prose-only audits.
export function visibleMarkdown(body) {
  let fence = null;
  let inComment = false;
  const mask = (text) => text.replace(/[^\r\n]/g, ' ');
  return body.split('\n').map((line) => {
    if (fence) {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) fence = null;
      return mask(line);
    }
    const opening = !inComment && line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (opening && (opening[1][0] !== '`' || !opening[2].includes('`'))) {
      fence = opening[1];
      return mask(line);
    }
    if (!inComment && /^(?: {4}|\t)/.test(line)) return mask(line);
    let result = '';
    let offset = 0;
    while (offset < line.length) {
      if (inComment) {
        const end = line.indexOf('-->', offset);
        const stop = end < 0 ? line.length : end + 3;
        result += mask(line.slice(offset, stop));
        offset = stop;
        if (end >= 0) inComment = false;
      } else {
        const start = line.indexOf('<!--', offset);
        if (start < 0) return result + line.slice(offset);
        result += line.slice(offset, start);
        offset = start;
        inComment = true;
      }
    }
    return result;
  }).join('\n');
}
