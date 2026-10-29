import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseDigest, validateReleaseManifest } from './write-release-manifest.mjs';
import { decodeSearchItems } from '../public/js/search-index-codec.js';

async function readBytes(url, limit, timeoutMs) {
  const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(timeoutMs), headers: { 'Cache-Control': 'no-cache' } });
  if (response.status !== 200) throw new Error(`${url.pathname} returned HTTP ${response.status}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error(`${url.pathname} exceeded the expected size`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Verify the deployed version and sampled bytes without running page scripts. */
export async function verifyDeployment({ url, sha, attempts = 4, delayMs = 10000, timeoutMs = 10000, onRetry = () => {} }) {
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('An expected 40-character Git SHA is required');
  const base = new URL(url);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Deployment URL must be an HTTP(S) site origin');
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10 || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > 30000
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) throw new Error('Invalid bounded retry settings');
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const manifestUrl = new URL('/release.json', base);
      const manifest = validateReleaseManifest(JSON.parse((await readBytes(manifestUrl, 128 * 1024, timeoutMs)).toString('utf8')), sha);
      await Promise.all(manifest.entries.map(async (entry) => {
        const target = new URL(entry.path, base);
        if (target.origin !== base.origin) throw new Error('Cross-origin release entry');
        const bytes = await readBytes(target, entry.bytes + 1, timeoutMs);
        if (bytes.length !== entry.bytes || releaseDigest(bytes) !== entry.sha256) throw new Error(`${entry.path} does not match release ${sha}`);
        const text = bytes.toString('utf8');
        if (entry.role === 'page' && !new RegExp(`<html\\b[^>]*\\blang=["']${entry.lang}["']`, 'i').test(text)) throw new Error(`${entry.path} has the wrong HTML language`);
        if (entry.role === 'search-index') {
          const data = JSON.parse(text);
          if (data.version !== 1 || decodeSearchItems(data).length === 0) throw new Error(`${entry.path} has no compact search items`);
        }
        if (entry.role === 'paper-essence') {
          const points = JSON.parse(text);
          if (!Array.isArray(points) || points.some((point) => !Array.isArray(point) || point.length !== 2 || point.some((value) => typeof value !== 'string'))) throw new Error(`${entry.path} has invalid essence data`);
        }
      }));
      return { sha, files: manifest.entries.length, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      onRetry({ attempt, error: error.message });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`Deployment verification failed after ${attempts} attempts: ${lastError.message}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  try {
    const result = await verifyDeployment({ url: value('url'), sha: value('sha') ?? process.env.GITHUB_SHA, attempts: Number(value('attempts') ?? 4), delayMs: Number(value('delay-ms') ?? 10000), timeoutMs: Number(value('timeout-ms') ?? 10000), onRetry: ({ attempt, error }) => console.warn(`Propagation retry ${attempt}: ${error}`) });
    console.log(`Deployment verified: ${JSON.stringify(result)}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
