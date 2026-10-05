// Builds the public Privacy Policy / Terms pages (docs/*.html) from the same JSON the app shows.
// Host the docs/ folder with GitHub Pages to get the live URLs that App Store / Play Console require.
//   node scripts/build_legal.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs');
mkdirSync(out, { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function page(doc) {
  const body = doc.sections
    .map((s) => `<h2>${esc(s.h)}</h2>\n${s.p.map((p) => `<p>${esc(p)}</p>`).join('\n')}`)
    .join('\n');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TinyCare — ${esc(doc.title)}</title>
<style>
  :root{color-scheme:light dark}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px;line-height:1.6;color:#16302A;background:#F3FAF6}
  h1{color:#2F9E7A} h2{margin-top:28px;border-bottom:2px solid #DDF3EA;padding-bottom:4px}
  .meta{color:#5B746B} a{color:#2F9E7A}
  @media (prefers-color-scheme:dark){body{color:#E8F5EF;background:#0E1F19}h1{color:#5ED6B0}h2{border-color:#24463C}.meta{color:#9DB9AE}a{color:#5ED6B0}}
</style></head><body>
<h1>TinyCare — ${esc(doc.title)}</h1>
<p class="meta">Last updated: ${esc(doc.updated)}</p>
${body}
<p class="meta"><a href="privacy.html">Privacy Policy</a> · <a href="terms.html">Terms of Service</a></p>
</body></html>
`;
}

for (const name of ['privacy', 'terms']) {
  const doc = JSON.parse(readFileSync(join(root, 'src', 'legal', `${name}.json`), 'utf8'));
  writeFileSync(join(out, `${name}.html`), page(doc));
  console.log(`wrote docs/${name}.html`);
}
writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=privacy.html"><a href="privacy.html">Privacy Policy</a>`,
);
