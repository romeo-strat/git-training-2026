#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES = join(ROOT, 'modules');
const SITE = join(ROOT, 'site');
const JS = join(SITE, 'assets', 'js');

const failures = [];
function check(cond, msg) { if (!cond) failures.push(msg); }

const stages = readdirSync(MODULES).filter((d) => /^m0[1-9]-/.test(d)).sort();

check(existsSync(join(SITE, 'index.html')), 'missing site/index.html');

let totalTasks = 0;

for (const folder of stages) {
  const id = folder.slice(0, 3);
  const page = join(SITE, id + '.html');
  const tutorial = readFileSync(join(MODULES, folder, 'tutorial.md'), 'utf8');
  const tasks = readFileSync(join(MODULES, folder, 'tasks.md'), 'utf8');

  check(existsSync(page), 'missing page ' + id + '.html');
  if (!existsSync(page)) continue;
  const html = readFileSync(page, 'utf8');

  check(!html.includes('**'), id + ': leftover ** markup');
  check(!html.includes('```'), id + ': leftover code fence');
  check(!html.includes(']>('), id + ': leftover link markup');
  check(html.includes('data-panel="brief"'), id + ': missing brief panel');
  check(html.includes('data-panel="writeup"'), id + ': missing write-up panel');
  check(html.includes('id="brief"'), id + ': missing brief anchor');
  check(html.includes('id="writeup"'), id + ': missing write-up anchor');

  const turnMarkers = (tutorial.match(/^\*\*Your turn\*\*$/gm) || []).length;
  const turnBoxes = (html.match(/box--turn/g) || []).length;
  check(turnMarkers === turnBoxes, id + ': turn boxes ' + turnBoxes + ' != markers ' + turnMarkers);

  const promptCount = (() => {
    const lines = tutorial.replace(/\r\n/g, '\n').split('\n');
    let i = 0, total = 0;
    while (i < lines.length) {
      if (lines[i].trim() === '**Your turn**') {
        i++;
        while (i < lines.length && lines[i].trim() === '') i++;
        while (i < lines.length) {
          const l = lines[i];
          if (/^(\*\*[A-Z].*\*\*|---|## )/.test(l)) break;
          if (/^[-*] /.test(l)) total++;
          i++;
        }
      } else i++;
    }
    return total;
  })();
  const answers = (html.match(/answer__input/g) || []).length;
  check(promptCount === answers, id + ': answers ' + answers + ' != prompts ' + promptCount);

  const boxes = (html.match(/data-task=/g) || []).length;
  const taskLines = (tasks.match(/^-\s+\[[ x]\]/gm) || []).length;
  check(boxes === taskLines, id + ': checkboxes ' + boxes + ' != tasks ' + taskLines);
  totalTasks += boxes;
}

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(readFileSync(join(JS, 'search-index.js'), 'utf8'), ctx);
const index = ctx.window.TF_SEARCH_INDEX;
const totals = ctx.window.TF_TOTALS || {};
check(Array.isArray(index) && index.length > 0, 'search index empty or invalid');
const totalSum = Object.values(totals).reduce((a, b) => a + b, 0);
check(totalSum === totalTasks, 'totals sum ' + totalSum + ' != checkboxes ' + totalTasks);

if (failures.length) {
  process.stderr.write('smoke check FAILED:\n' + failures.map((f) => '  - ' + f).join('\n') + '\n');
  process.exit(1);
}
process.stdout.write('smoke check passed: ' + stages.length + ' stages, ' + totalTasks + ' tasks, ' + (index ? index.length : 0) + ' search entries.\n');
