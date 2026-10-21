#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES = join(ROOT, 'modules');
const SITE = join(ROOT, 'site');
const ASSETS = join(SITE, 'assets');
const JS = join(ASSETS, 'js');

let REWRITE = (h) => h;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escAttr(s) {
  return esc(s).replace(/"/g, '&quot;');
}

function inline(text) {
  const codes = [];
  let t = String(text).replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return '\u0000' + (codes.length - 1) + '\u0000';
  });
  t = esc(t);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    return '<a href="' + escAttr(REWRITE(href)) + '">' + label + '</a>';
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
  t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + esc(codes[+i]) + '</code>');
  return t;
}

function slug(text, set) {
  const base = String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
  if (!set) return base;
  let id = base, i = 1;
  while (set.has(id)) id = base + '-' + (++i);
  set.add(id);
  return id;
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  const cells = [];
  let cur = '', inCode = false, depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '`') inCode = !inCode;
    if (!inCode) {
      if (ch === '[') depth++;
      else if (ch === ']') depth = Math.max(0, depth - 1);
      else if (ch === '(' && depth > 0) depth++;
      else if (ch === ')' && depth > 0) depth = Math.max(0, depth - 1);
      if (ch === '|' && depth === 0) { cells.push(cur.trim()); cur = ''; continue; }
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

const CMD_RE = /^(?:sudo\s+)?\$?\s*(?:terraform|tofu|aws|gcloud|az|git|jq|tfenv|asdf|brew|choco|winget|scoop|export|source|curl|ssh-keygen|gpg|grep|rg|cat|echo|file|openssl|sops|kubectl|docker)\b/;

function collectCommands(text, ctx) {
  if (!ctx.commands) return;
  text.split('\n').forEach((raw) => {
    const line = raw.replace(/^\$\s*/, '').trim();
    if (!line || line.startsWith('#')) return;
    if (CMD_RE.test(line) && !ctx.commands.some((c) => c.cmd === line)) {
      ctx.commands.push({ cmd: line, part: ctx.partLabel || '' });
    }
  });
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  const n = lines.length;
  const isList = (l) => /^(\s*)([-*]|\d+\.)\s+/.test(l);
  while (i < n) {
    const line = lines[i];
    if (line.trim() === '') { i++; continue; }
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      i++;
      const buf = [];
      while (i < n && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: 'code', lang, text: buf.join('\n') });
      continue;
    }
    let m;
    if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      blocks.push({ type: 'h', level: m[1].length, text: m[2].trim() });
      i++; continue;
    }
    if (/^---+\s*$/.test(line)) { blocks.push({ type: 'hr' }); i++; continue; }
    if (/^>/.test(line)) {
      const buf = [];
      while (i < n && /^>/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      const paras = [];
      let cur = [];
      for (const q of buf) {
        if (q.trim() === '') { if (cur.length) paras.push(cur.join(' ')); cur = []; }
        else cur.push(q);
      }
      if (cur.length) paras.push(cur.join(' '));
      blocks.push({ type: 'quote', paras });
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const buf = [];
      while (i < n && /^\s*\|/.test(lines[i])) { buf.push(lines[i]); i++; }
      const rows = buf.map(splitRow).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
      blocks.push({ type: 'table', rows });
      continue;
    }
    if (isList(line)) {
      const items = [];
      while (i < n && isList(lines[i])) {
        const mm = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        items.push({ level: mm[1].length >= 2 ? 1 : 0, ordered: /\d+\./.test(mm[2]), text: mm[3] });
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }
    const buf = [];
    while (i < n) {
      const l = lines[i];
      if (l.trim() === '' || /^```/.test(l) || /^#{1,6}\s/.test(l) || /^>/.test(l) || /^\s*\|/.test(l) || isList(l) || /^---+\s*$/.test(l)) break;
      buf.push(l); i++;
    }
    blocks.push({ type: 'para', text: buf.join(' ') });
  }
  return blocks;
}

const CALLOUTS = [
  { type: 'try', re: /^\*\*Try it\*\*$/ },
  { type: 'check', re: /^\*\*Checkpoint\*\*$/ },
  { type: 'turn', re: /^\*\*Your turn\*\*$/ },
  { type: 'predict', re: /^\*\*Pause and predict[^*]*\*\*\s*(.*)$/ },
  { type: 'example', re: /^\*\*Example(?:\s*(—[^*]*?))?\*\*$/ },
];

function calloutOf(block) {
  if (block.type !== 'para') return null;
  for (const c of CALLOUTS) {
    const m = c.re.exec(block.text);
    if (!m) continue;
    if (c.type === 'predict') return { type: 'predict', label: 'Pause and predict', rest: (m[1] || '').trim() };
    if (c.type === 'example') {
      const suffix = (m[1] || '').trim();
      return { type: 'example', label: 'Example' + (suffix ? ' ' + suffix : ''), rest: '' };
    }
    const labels = { try: 'Try it', check: 'Checkpoint', turn: 'Your turn' };
    return { type: c.type, label: labels[c.type], rest: '' };
  }
  return null;
}

function renderNodes(nodes) {
  if (!nodes.length) return '';
  const tag = nodes[0].ordered ? 'ol' : 'ul';
  let h = '<' + tag + '>';
  for (const nd of nodes) {
    h += '<li>' + inline(nd.text);
    if (nd.children && nd.children.length) h += renderNodes(nd.children);
    h += '</li>';
  }
  return h + '</' + tag + '>';
}

function renderList(items) {
  const root = [];
  const stack = [{ level: -1, children: root }];
  for (const it of items) {
    const node = { ...it, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].level >= it.level) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return renderNodes(root);
}

function renderBlock(b, ctx) {
  switch (b.type) {
    case 'code':
      collectCommands(b.text, ctx);
      return '<div class="code"><button class="code__copy" type="button" aria-label="Copy code">Copy</button><pre><code>' + esc(b.text) + '</code></pre></div>';
    case 'h': {
      const id = slug(b.text, ctx.slugSet);
      const lvl = b.level <= 2 ? 3 : b.level;
      return '<h' + lvl + ' id="' + id + '">' + inline(b.text) + '</h' + lvl + '>';
    }
    case 'hr':
      return '<hr>';
    case 'list':
      return renderList(b.items);
    case 'table': {
      if (!b.rows.length) return '';
      const rows = b.rows.slice();
      let head = '';
      let bodyRows = rows;
      if (rows[0].length && rows[0].every((c) => c === '')) {
        bodyRows = rows.slice(1);
      } else {
        head = '<thead><tr>' + rows[0].map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>';
        bodyRows = rows.slice(1);
      }
      const body = '<tbody>' + bodyRows.map((r) => '<tr>' + r.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody>';
      return '<div class="tablewrap"><table>' + head + body + '</table></div>';
    }
    case 'quote': {
      const text = b.paras.join(' ');
      let cls = 'note';
      if (/^\*\*Watch out/i.test(text)) cls = 'warn';
      else if (/^\*\*Explain it/i.test(text)) cls = 'explain';
      const inner = b.paras.map((p) => '<p>' + inline(p) + '</p>').join('');
      return '<aside class="callout callout--' + cls + '">' + inner + '</aside>';
    }
    case 'para':
      return '<p>' + inline(b.text) + '</p>';
    default:
      return '';
  }
}

function renderBlocks(blocks, ctx) {
  return blocks.map((b) => renderBlock(b, ctx)).join('\n');
}

function segment(blocks) {
  const segs = [];
  let cur = { type: 'plain', blocks: [] };
  for (const b of blocks) {
    const c = calloutOf(b);
    if (c) { segs.push(cur); cur = { type: c.type, label: c.label, rest: c.rest, blocks: [] }; }
    else cur.blocks.push(b);
  }
  segs.push(cur);
  return segs;
}

function renderSeg(seg, ctx) {
  if (seg.type === 'plain') return renderBlocks(seg.blocks, ctx);
  let inner = '';
  if (seg.rest) inner += '<p>' + inline(seg.rest) + '</p>';
  if (seg.type === 'turn') {
    const prompts = [];
    seg.blocks.forEach((b) => {
      if (b.type === 'list') b.items.filter((it) => it.level === 0).forEach((it) => prompts.push(it.text));
    });
    inner += renderBlocks(seg.blocks, ctx);
    if (prompts.length) {
      let boxes = '';
      for (const p of prompts) {
        const id = ctx.partId + '-turn-' + (++ctx.turnCount);
        ctx.prompts.push({ id, text: p });
        boxes += '<label class="answer" id="' + id + '"><span class="answer__prompt">' + inline(p) + '</span><textarea class="answer__input" data-answer="' + id + '" rows="3" placeholder="Record your answer here — it is saved in this browser."></textarea></label>';
      }
      inner += '<div class="answers">' + boxes + '</div>';
    }
  } else {
    inner += renderBlocks(seg.blocks, ctx);
  }
  return '<section class="box box--' + seg.type + '"><p class="box__label">' + inline(seg.label) + '</p>' + inner + '</section>';
}

function renderSectionBody(blocks, ctx) {
  return segment(blocks).map((seg) => renderSeg(seg, ctx)).join('\n');
}

function parseDoc(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return parseBlocks(lines);
}

function splitDoc(blocks) {
  let title = '', subtitle = '', i = 0;
  if (blocks[0] && blocks[0].type === 'h') {
    title = blocks[0].text;
    i = 1;
    if (blocks[1] && blocks[1].type === 'para' && /^\*[^*]+\*$/.test(blocks[1].text.trim())) {
      subtitle = blocks[1].text.trim().replace(/^\*/, '').replace(/\*$/, '');
      i = 2;
    }
  }
  const sections = [];
  let cur = null;
  for (; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'h' && b.level === 2) {
      cur = { title: b.text, blocks: [] };
      sections.push(cur);
    } else {
      if (!cur) { cur = { title: '', blocks: [] }; sections.push(cur); }
      cur.blocks.push(b);
    }
  }
  return { title, subtitle, sections };
}

function parseTasks(raw, stageId) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const groups = [];
  let title = '', objective = '', intro = [], cur = null, seenSection = false, counter = 0;
  for (const line of lines) {
    let m;
    if ((m = /^#\s+(.*)$/.exec(line))) { title = m[1].replace(/\s*—\s*Tasks\s*$/, ''); continue; }
    if ((m = /^\*\*Objective:\*\*\s*(.*)$/.exec(line))) { objective = m[1]; continue; }
    if (/^##\s+/.test(line)) {
      seenSection = true;
      cur = { title: line.replace(/^##\s+/, '').trim(), items: [] };
      groups.push(cur);
      continue;
    }
    if ((m = /^-\s+\[( |x)\]\s+(.*)$/.exec(line))) {
      if (!cur) { cur = { title: '', items: [] }; groups.push(cur); }
      const rest = m[2];
      const tm = /^\*\*(TASK-[A-Z0-9-]+)\*\*\s*(.*)$/.exec(rest);
      const gslug = (cur.title || 'tasks').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      cur.items.push({
        id: tm ? tm[1] : stageId + '-' + gslug + '-' + (++counter),
        text: tm ? tm[2] : rest,
      });
      continue;
    }
    if (!seenSection && line.trim()) intro.push(line.trim().replace(/^>\s?/, ''));
  }
  return { title, objective, intro, groups };
}

function readStages() {
  return readdirSync(MODULES)
    .filter((d) => /^m0[1-9]-/.test(d))
    .sort()
    .map((folder) => {
      const id = folder.slice(0, 3);
      const tutorialRaw = readFileSync(join(MODULES, folder, 'tutorial.md'), 'utf8');
      const doc = splitDoc(parseDoc(tutorialRaw));
      const parts = doc.title.split(' — ');
      const short = parts.length > 1 ? parts.slice(1).join(' — ') : doc.title;
      return {
        id,
        folder,
        title: doc.title,
        short,
        blurb: doc.subtitle,
        tutorialRaw,
        tasksRaw: readFileSync(join(MODULES, folder, 'tasks.md'), 'utf8'),
        briefRaw: readFileSync(join(MODULES, folder, 'brief.md'), 'utf8'),
        templateRaw: readFileSync(join(MODULES, folder, 'write-up-template.md'), 'utf8'),
      };
    });
}

function head(title) {
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(title) + '</title>\n<meta name="description" content="Interactive Terraform course — self-guided stage tours.">\n<link rel="stylesheet" href="assets/css/site.css">\n</head>\n';
}

function topbar() {
  return '<header class="topbar">\n' +
    '<a class="brand" href="index.html"><span class="brand__mark">TF</span><span class="brand__name">Terraform Course</span></a>\n' +
    '<div class="search">\n<input id="search" type="search" placeholder="Search commands, parts and prompts…" autocomplete="off" aria-label="Search the course">\n<div id="search-results" class="search__results" hidden></div>\n</div>\n' +
    '<div class="topbar__end"><div class="ring" id="ring" data-ring><span class="ring__label">0%</span></div><button id="reset" class="btn btn--ghost" type="button" title="Clear all saved progress in this browser">Reset</button></div>\n' +
    '</header>\n';
}

function sideNav(stages, activeId, parts) {
  let h = '<nav class="sidenav" aria-label="Stages">\n<div class="sidenav__section">Stages</div>\n<ul class="stagenav">';
  for (const s of stages) {
    const active = s.id === activeId ? ' is-active' : '';
    h += '<li class="stagenav__item' + active + '" data-stage-nav="' + s.id + '"><a href="' + s.id + '.html"><span class="stagenav__id">' + s.id.toUpperCase() + '</span><span class="stagenav__title">' + inline(s.short) + '</span><span class="bar"><i></i></span></a></li>';
  }
  h += '</ul>';
  if (parts && parts.length) {
    h += '<div class="sidenav__section">This stage</div><ul class="toc">';
    parts.forEach((p) => {
      h += '<li><a href="#' + p.id + '"><span class="toc__num">' + p.num + '</span>' + inline(p.displayTitle) + '</a></li>';
    });
    h += '<li><a href="#checklist"><span class="toc__num">✓</span>Checklist</a></li>';
    h += '<li><a href="#selfcheck"><span class="toc__num">?</span>Self-check</a></li>';
    h += '<li><a href="#commands"><span class="toc__num">&gt;</span>Commands</a></li>';
    h += '</ul>';
  }
  h += '</nav>\n';
  return h;
}

function foot(prev, next) {
  let h = '<footer class="foot">';
  if (prev) h += '<a class="foot__nav" href="' + prev.id + '.html">&larr; ' + prev.id.toUpperCase() + ' · ' + inline(prev.short) + '</a>';
  else h += '<a class="foot__nav" href="index.html">&larr; Course home</a>';
  h += '<a class="foot__home" href="index.html">All stages</a>';
  if (next) h += '<a class="foot__nav foot__nav--next" href="' + next.id + '.html">' + next.id.toUpperCase() + ' · ' + inline(next.short) + ' &rarr;</a>';
  else h += '<span class="foot__nav foot__nav--next">End of course</span>';
  return h + '</footer>\n';
}

function scripts(stageId) {
  const stageAttr = stageId ? ' data-stage="' + stageId + '"' : '';
  return '<script src="assets/js/store.js"></script>\n<script src="assets/js/search-index.js"></script>\n<script>window.TF_PAGE={page:"' + (stageId ? 'stage' : 'index') + '"' + (stageId ? ',stage:"' + stageId + '"' : '') + '};</script>\n<script src="assets/js/site.js"></script>\n';
}

function doRewrite() {
  return (href) => {
    if (/^(https?:|mailto:|#)/.test(href)) return href;
    const m = /modules\/(m\d+)[^/]*\/([a-z-]+)\.md(#.*)?$/.exec(href);
    if (m) {
      if (m[1] === 'm10') return 'index.html#capstone';
      if (m[2] === 'brief') return m[1] + '.html#brief';
      if (m[2] === 'write-up-template') return m[1] + '.html#writeup';
      if (m[2] === 'tasks') return m[1] + '.html#checklist';
      return m[1] + '.html' + (m[3] || '');
    }
    const rm = /(?:\.\.\/)*README\.md(#.*)?$/.exec(href);
    if (rm) return 'index.html' + (rm[1] || '');
    return href;
  };
}

function renderDocPanel(raw, partPrefix, slugSet) {
  const doc = splitDoc(parseDoc(raw.replace(/<!--[\s\S]*?-->/g, '')));
  let h = '';
  for (const sec of doc.sections) {
    if (sec.title === '') {
      const ctx = { partId: partPrefix, slugSet, prompts: [], commands: [], turnCount: 0 };
      h += renderSectionBody(sec.blocks, ctx);
    } else {
      const id = slug(sec.title, slugSet);
      const ctx = { partId: partPrefix + '-' + id, slugSet, prompts: [], commands: [], turnCount: 0 };
      h += '<section class="sec" id="' + id + '"><h2>' + inline(sec.title) + '</h2>' + renderSectionBody(sec.blocks, ctx) + '</section>\n';
    }
  }
  return h;
}

function buildStage(stage, stages) {
  REWRITE = doRewrite();
  const doc = splitDoc(parseDoc(stage.tutorialRaw));
  const slugSet = new Set();
  const parts = [];
  const prompts = [];
  let commands = [];
  let tourHtml = '';
  let partIndex = 0;

  for (const sec of doc.sections) {
    if (/^Part\b/i.test(sec.title) && sec.title !== '') {
      partIndex++;
      const id = stage.id + '-p' + partIndex;
      const numMatch = /^Part\s+(\d+)\s*—\s*(.*)$/.exec(sec.title);
      const displayTitle = numMatch ? numMatch[2].trim() : sec.title.replace(/^Part\s+\d+\s*—?\s*/, '');
      const num = numMatch ? numMatch[1] : String(partIndex);
      const ctx = { partId: id, partLabel: 'Part ' + num + ' — ' + displayTitle, prompts: [], commands: [], slugSet, turnCount: 0 };
      const body = renderSectionBody(sec.blocks, ctx);
      parts.push({ id, num, displayTitle });
      prompts.push(...ctx.prompts);
      commands.push(...ctx.commands);
      tourHtml += '<details class="part" id="' + id + '" data-part="' + id + '" open><summary class="part__head"><span class="part__num">Part ' + num + '</span><span class="part__title">' + inline(displayTitle) + '</span></summary><div class="part__body">' + body + '</div></details>\n';
    } else if (sec.title === '') {
      const ctx = { partId: stage.id + '-intro', prompts: [], commands: [], slugSet, turnCount: 0, partLabel: 'Introduction' };
      tourHtml += '<section class="sec sec--intro">' + renderSectionBody(sec.blocks, ctx) + '</section>\n';
      prompts.push(...ctx.prompts);
      commands.push(...ctx.commands);
    } else {
      const id = slug(sec.title, slugSet);
      const ctx = { partId: stage.id + '-' + id, partLabel: sec.title, prompts: [], commands: [], slugSet, turnCount: 0 };
      const body = renderSectionBody(sec.blocks, ctx);
      tourHtml += '<section class="sec" id="' + id + '"><h2>' + inline(sec.title) + '</h2>' + body + '</section>\n';
      prompts.push(...ctx.prompts);
      commands.push(...ctx.commands);
    }
  }

  const tasks = parseTasks(stage.tasksRaw, stage.id);
  let checkHtml = '<section class="sec" id="checklist"><h2>Checklist</h2>';
  checkHtml += '<p class="objective">' + inline(tasks.objective) + '</p>';
  if (tasks.intro.length) checkHtml += '<aside class="callout callout--note"><p>' + inline(tasks.intro.join(' ')) + '</p></aside>';
  for (const g of tasks.groups) {
    checkHtml += '<fieldset class="checklist__group"><legend>' + inline(g.title) + '</legend><ul>';
    for (const it of g.items) {
      checkHtml += '<li><label class="check"><input type="checkbox" class="task-check" data-task="' + escAttr(it.id) + '"><span>' + inline(it.text) + '</span></label></li>';
    }
    checkHtml += '</ul></fieldset>';
  }
  checkHtml += '</section>';

  let selfHtml = '<section class="sec" id="selfcheck"><h2>Self-check</h2><p class="hint">Every <strong>Your turn</strong> prompt from this stage. Rate yourself honestly — the answers are yours to write, not supplied here. “Answer box” jumps to the box in the tour.</p><ul class="selfcheck__list">';
  if (!prompts.length) selfHtml += '<li class="selfcheck__empty">No research prompts found for this stage.</li>';
  for (const p of prompts) {
    selfHtml += '<li class="selfcheck__item" data-selfcheck-item="' + p.id + '"><span class="selfcheck__q">' + inline(p.text) + '</span><span class="selfcheck__actions"><button class="rate" data-selfcheck="' + p.id + '" data-val="confident" type="button">Can explain</button><button class="rate" data-selfcheck="' + p.id + '" data-val="revisit" type="button">Revisit</button><a class="link" href="#' + p.id + '" data-goto-answer="' + p.id + '">Answer box →</a></span></li>';
  }
  selfHtml += '</ul></section>';

  const uniqCmd = [];
  for (const c of commands) if (!uniqCmd.some((u) => u.cmd === c.cmd)) uniqCmd.push(c);
  let cmdHtml = '<section class="sec" id="commands"><h2>Commands</h2><p class="hint">Every command named in this stage. Filter below, or copy any command in the tour with its Copy button.</p>';
  cmdHtml += '<input id="cmd-filter" class="filter" type="search" placeholder="Filter commands…" aria-label="Filter commands"><div class="tablewrap"><table class="cmdtable"><thead><tr><th>Command</th><th>Where</th></tr></thead><tbody>';
  if (!uniqCmd.length) cmdHtml += '<tr><td colspan="2" class="muted">No commands detected.</td></tr>';
  for (const c of uniqCmd) cmdHtml += '<tr data-cmd="' + escAttr(c.cmd.toLowerCase()) + '"><td><code>' + esc(c.cmd) + '</code></td><td class="muted">' + inline(c.part) + '</td></tr>';
  cmdHtml += '</tbody></table></div></section>';

  const briefHtml = '<section class="sec" id="brief"><h2>Brief</h2>' +
    renderDocPanel(stage.briefRaw, stage.id + '-brief', slugSet) + '</section>';
  const writeupCallout = '<aside class="callout callout--note"><p>Copy <code>write-up.md</code> from this stage\'s folder in the repo and fill it in as you build; leave the template untouched. The course site never renders a filled write-up — answers stay in your repository.</p></aside>';
  const writeupHtml = '<section class="sec" id="writeup"><h2>Write-up</h2>' + writeupCallout +
    renderDocPanel(stage.templateRaw, stage.id + '-writeup', slugSet) + '</section>';

  const idx = stages.findIndex((s) => s.id === stage.id);
  const prev = idx > 0 ? stages[idx - 1] : null;
  const next = idx < stages.length - 1 ? stages[idx + 1] : null;

  const body = head(stage.title) +
    '<body data-page="stage" data-stage="' + stage.id + '">\n' + topbar() +
    '<div class="layout">' + sideNav(stages, stage.id, parts) +
    '<main class="content">' +
    '<div class="stagehead"><p class="stagehead__id">' + stage.id.toUpperCase() + '</p><h1>' + inline(stage.title) + '</h1><p class="stagehead__sub">' + inline(doc.subtitle) + '</p>' +
    '<div class="export"><button class="btn" id="export" type="button">Download my answers</button></div></div>' +
    '<div class="tabs" role="tablist"><button class="tab is-active" data-tab="tour" role="tab">Tour</button><button class="tab" data-tab="checklist" role="tab">Checklist</button><button class="tab" data-tab="selfcheck" role="tab">Self-check</button><button class="tab" data-tab="commands" role="tab">Commands</button><button class="tab" data-tab="brief" role="tab">Brief</button><button class="tab" data-tab="writeup" role="tab">Write-up</button></div>' +
    '<div class="panel is-active" data-panel="tour">' + tourHtml + '</div>' +
    '<div class="panel" data-panel="checklist">' + checkHtml + '</div>' +
    '<div class="panel" data-panel="selfcheck">' + selfHtml + '</div>' +
    '<div class="panel" data-panel="commands">' + cmdHtml + '</div>' +
    '<div class="panel" data-panel="brief">' + briefHtml + '</div>' +
    '<div class="panel" data-panel="writeup">' + writeupHtml + '</div>' +
    '</main></div>\n' + foot(prev, next) + scripts(stage.id) + '</body>\n</html>\n';

  return {
    html: body,
    index: [
      { s: stage.id, st: stage.id.toUpperCase(), t: stage.short, h: stage.id + '.html', type: 'stage' },
      ...parts.map((p) => ({ s: stage.id, st: stage.id.toUpperCase(), t: 'Part ' + p.num + ' — ' + p.displayTitle, h: stage.id + '.html#' + p.id, type: 'part' })),
      ...prompts.map((p) => ({ s: stage.id, st: stage.id.toUpperCase(), t: p.text, h: stage.id + '.html#' + p.id, type: 'prompt' })),
      ...uniqCmd.map((c) => ({ s: stage.id, st: stage.id.toUpperCase(), t: c.cmd, h: stage.id + '.html#commands', type: 'cmd' })),
    ],
  };
}

function buildIndex(stages) {
  REWRITE = doRewrite();
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const doc = splitDoc(parseDoc(readme));
  const slugSet = new Set();

  let grid = '<section class="stage-grid"><h2>Stages</h2><div class="cards">';
  for (const s of stages) {
    grid += '<a class="card" href="' + s.id + '.html" data-stage-card="' + s.id + '"><span class="card__id">' + s.id.toUpperCase() + '</span><h3 class="card__title">' + inline(s.short) + '</h3><p class="card__blurb">' + inline(s.blurb) + '</p><div class="card__foot"><span class="bar bar--wide"><i></i></span><span class="card__pct">0%</span></div></a>';
  }
  grid += '</div><p class="continue"><a class="btn" id="continue" href="' + stages[0].id + '.html">Start the course →</a></p></section>';

  let content = '';
  for (const sec of doc.sections) {
    if (sec.title === '') {
      const ctx = { partId: 'index-intro', slugSet, prompts: [], commands: [], turnCount: 0 };
      content += '<section class="sec sec--intro">' + renderSectionBody(sec.blocks, ctx) + '</section>\n';
    } else {
      const id = slug(sec.title, slugSet);
      const ctx = { partId: 'index-' + id, slugSet, prompts: [], commands: [], turnCount: 0 };
      const anchor = /capstone/i.test(sec.title) ? ' id="capstone"' : ' id="' + id + '"';
      content += '<section class="sec"' + anchor + '><h2>' + inline(sec.title) + '</h2>' + renderSectionBody(sec.blocks, ctx) + '</section>\n';
    }
  }

  const body = head(doc.title) +
    '<body data-page="index">\n' + topbar() +
    '<div class="layout">' + sideNav(stages, null, []) +
    '<main class="content">' +
    '<div class="stagehead"><p class="stagehead__id">Course</p><h1>' + inline(doc.title) + '</h1><p class="stagehead__sub">' + inline(doc.subtitle) + '</p></div>' +
    grid + content +
    '</main></div>\n' +
    '<footer class="foot"><span class="foot__nav">&nbsp;</span><span class="foot__home">Terraform Concepts &amp; Best Practices</span><a class="foot__nav foot__nav--next" href="' + stages[0].id + '.html">Begin M01 &rarr;</a></footer>\n' +
    scripts(null) + '</body>\n</html>\n';

  return {
    html: body,
    index: [
      { s: '', st: 'Course', t: doc.title, h: 'index.html', type: 'stage' },
      ...stages.map((s) => ({ s: s.id, st: s.id.toUpperCase(), t: s.short, h: s.id + '.html', type: 'stage' })),
    ],
  };
}

function main() {
  mkdirSync(JS, { recursive: true });
  const stages = readStages();
  let allIndex = [];

  for (const stage of stages) {
    const built = buildStage(stage, stages);
    writeFileSync(join(SITE, stage.id + '.html'), built.html);
    allIndex.push(...built.index);
  }
  const idx = buildIndex(stages);
  writeFileSync(join(SITE, 'index.html'), idx.html);
  allIndex.push(...idx.index);

  const totals = {};
  for (const stage of stages) {
    totals[stage.id] = parseTasks(stage.tasksRaw, stage.id).groups.reduce((a, g) => a + g.items.length, 0);
  }
  writeFileSync(join(JS, 'search-index.js'), 'window.TF_SEARCH_INDEX = ' + JSON.stringify(allIndex) + ';\nwindow.TF_TOTALS = ' + JSON.stringify(totals) + ';\n');
  process.stdout.write('Built ' + (stages.length + 1) + ' pages and search-index.js (' + allIndex.length + ' entries).\n');
}

main();
