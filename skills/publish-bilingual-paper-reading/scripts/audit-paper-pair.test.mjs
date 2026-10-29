import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const script=fileURLToPath(new URL('./audit-paper-pair.mjs',import.meta.url));
// Isolate metadata comparison from substantive-quality checks. Those functions
// have their own tests; real #104 is also checked against the complete pipeline.
function audit(t, mutate=(s)=>s, id='104-fixture', options=[]) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'paper-pair-metadata-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const dir=path.join(root,'src/content/paperReading');fs.mkdirSync(path.join(dir,'en'),{recursive:true});
  fs.mkdirSync(path.join(root,'scripts'));
  fs.writeFileSync(path.join(root,'scripts/validate-reading-quality.mjs'),`export const splitFrontmatter=(raw)=>({frontmatter:raw.split('---')[1],body:raw.split('---')[2]});export const validatePaperReadingFile=()=>({errors:[],warnings:[],advisories:[]});export const validatePaperReadingPair=()=>({warnings:[],advisories:[]});`);
  const yaml=`title: "Fixture"\npubDate: 2026-10-29\ntldr:\n  - "A takeaway"\naudience:\n  - "A reader"\ntopics:\n  - retrieval-rag\n  - agent-evaluation-observability\npaper:\n  title: "Exact original title"\n  authors:\n    - "First Author"\n    - "Second Author"\n  year: 2026\n  venue: "arXiv 2609.00001 v1"\n  links:\n    pdf: "https://example.org/source-v1.pdf"\nseries:\n  id: fixture\n  title: "Localized title"\n  part: 1\n  totalParts: 1\n`;
  for(const [locale,value] of [['',yaml],['en',mutate(yaml)]])fs.writeFileSync(path.join(dir,locale,id+'.md'),'---\n'+value+'---\nSynthetic metadata fixture only.');
  return spawnSync(process.execPath,[script,'--strict',...options,id],{cwd:root,encoding:'utf8'});
}
for(const id of ['03-fixture','104-fixture','1000-fixture'])test(`full pair metadata accepts numeric ID ${id}`,(t)=>{
  const r=audit(t,undefined,id);assert.equal(r.status,0,r.stderr);
});
test('full pair rejects an invalid ID',(t)=>{
  const r=audit(t,undefined,'bad-fixture');assert.equal(r.status,1);assert.match(r.stderr,/basename/);
});
for(const [label,mutate,pattern] of [
 ['second topic',(s)=>s.replace('  - agent-evaluation-observability','  - agent-safety-governance'),/topics must match/],
 ['second author',(s)=>s.replace('Second Author','Wrong Author'),/paper metadata must match/],
 ['source URL',(s)=>s.replace('source-v1.pdf','different-v2.pdf'),/paper metadata must match/],
 ['series part',(s)=>s.replace('  part: 1','  part: 2'),/series id, part/],
])test(`full YAML block comparison detects changed ${label}`,(t)=>{
 const r=audit(t,mutate);assert.equal(r.status,1);assert.match(r.stderr,pattern);
});

test('new publication review blocks a venue or version/status change',(t)=>{
 const r=audit(t,(s)=>s.replace('arXiv 2609.00001 v1','Accepted venue v2'),'104-fixture',['--new']);
 assert.equal(r.status,1);assert.match(r.stderr,/venue\/version\/status wording differs/);
});

test('a new pair cannot omit its cover while archive compatibility remains unchanged',(t)=>{
 const fresh=audit(t,undefined,'104-fixture',['--new']);
 assert.equal(fresh.status,1);assert.match(fresh.stderr,/requires an existing cover image/);
 const archive=audit(t);assert.equal(archive.status,0,archive.stderr);
});
