import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script=fileURLToPath(new URL('./audit-blog-pair.mjs',import.meta.url));
function audit(t, links, englishLinks=links.map((s)=>s.replace('](/','](/en/'))) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'blog-pair-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  for(const folder of ['blog','paperReading','projects']) for(const locale of ['', 'en']) {
    const dir=path.join(root,'src/content',folder,locale);fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'03-related.md'),'Synthetic related fixture');
  }
  const publicDir=path.join(root,'public/blog/99-fixture');fs.mkdirSync(publicDir,{recursive:true});fs.writeFileSync(path.join(publicDir,'title_image.webp'),'synthetic asset');
  for(const [locale,list] of [['',links],['en',englishLinks]])fs.writeFileSync(path.join(root,'src/content/blog',locale,'99-fixture.md'),`---\ntitle: "Synthetic fixture"\ndescription: "Only a validation fixture"\npubDate: 2026-10-29\nupdatedDate: 2026-10-29\ntldr:\n  - "Fixture"\naudience:\n  - "Test"\ncategory: "Creator Tools"\ntags: ["AI"]\nkind: "article"\nshowToc: false\nimage: "/blog/99-fixture/title_image.webp"\n---\n\n[Source](https://example.com/source)\n\n${list.join('\n')}\n`);
  return spawnSync(process.execPath,[script,'--mode=new','99-fixture'],{cwd:root,encoding:'utf8'});
}
for(const route of ['blog','paper-reading','projects'])test(`accepts one useful ${route} link without a quota`,(t)=>{
  const r=audit(t,[`[Related](/${route}/03-related/)`]);assert.equal(r.status,0,r.stderr);
});
test('does not require unrelated links or a repeated branded summary',(t)=>{
  const r=audit(t,[]);assert.equal(r.status,0,r.stderr);
});
test('broken cross-content route remains an error',(t)=>{
  const r=audit(t,['[Missing](/projects/404-missing/)']);assert.equal(r.status,1);assert.match(r.stderr,/broken internal content link/);
});
test('English cross-content link must use the English route',(t)=>{
  const links=['[Related](/paper-reading/03-related/)'];const r=audit(t,links,links);assert.equal(r.status,1);assert.match(r.stderr,/non-localized content link/);
});
