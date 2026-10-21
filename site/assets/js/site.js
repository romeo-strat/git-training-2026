(function () {
  var page = window.TF_PAGE || { page: 'index' };
  var store = window.TFStore;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function stagePct(id) {
    var total = (window.TF_TOTALS || {})[id] || 0;
    var done = Object.keys((store.get(id) || {}).tasks || {}).length;
    return total ? Math.round(Math.min(1, done / total) * 100) : 0;
  }

  function setRing(pct) {
    var ring = $('#ring');
    if (!ring) return;
    ring.style.setProperty('--p', pct);
    var label = $('.ring__label', ring);
    if (label) label.textContent = pct + '%';
    ring.title = pct + '% of tasks complete';
  }

  function updateProgress() {
    $$('[data-stage-nav]').forEach(function (li) {
      var bar = $('.bar i', li);
      if (bar) bar.style.width = stagePct(li.getAttribute('data-stage-nav')) + '%';
    });
    $$('[data-stage-card]').forEach(function (card) {
      var pct = stagePct(card.getAttribute('data-stage-card'));
      var bar = $('.bar i', card);
      if (bar) bar.style.width = pct + '%';
      var label = $('.card__pct', card);
      if (label) label.textContent = pct + '%';
    });
    if (page.page === 'stage') {
      setRing(stagePct(page.stage));
    } else {
      var ids = Object.keys(window.TF_TOTALS || {});
      var avg = ids.length ? Math.round(ids.reduce(function (a, id) { return a + stagePct(id); }, 0) / ids.length) : 0;
      setRing(avg);
      var cont = $('#continue');
      if (cont) {
        var next = ids.find(function (id) { return stagePct(id) < 100; });
        if (next) {
          cont.href = next + '.html';
          cont.textContent = 'Continue with ' + next.toUpperCase() + ' →';
        } else {
          cont.textContent = 'Course complete — review any stage';
        }
      }
    }
  }

  function switchTab(name) {
    var tab = $('.tab[data-tab="' + name + '"]');
    if (tab) tab.click();
  }

  function initTabs() {
    $$('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.getAttribute('data-tab');
        $$('.tab').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        $$('.panel').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === name); });
        if (history.replaceState) history.replaceState(null, '', '#' + name);
      });
    });
  }

  function initTasks(stageId) {
    var saved = (store.get(stageId) || {}).tasks || {};
    $$('.task-check').forEach(function (cb) {
      var id = cb.getAttribute('data-task');
      if (saved[id]) cb.checked = true;
      cb.addEventListener('change', function () {
        store.setTask(stageId, id, cb.checked);
        updateProgress();
      });
    });
  }

  function initAnswers(stageId) {
    var saved = (store.get(stageId) || {}).answers || {};
    $$('[data-answer]').forEach(function (ta) {
      var id = ta.getAttribute('data-answer');
      if (saved[id]) ta.value = saved[id];
      ta.addEventListener('input', debounce(function () {
        store.setAnswer(stageId, id, ta.value.trim() ? ta.value : '');
      }, 350));
    });
  }

  function initSelf(stageId) {
    var saved = (store.get(stageId) || {}).self || {};
    $$('.rate').forEach(function (btn) {
      var id = btn.getAttribute('data-selfcheck');
      var val = btn.getAttribute('data-val');
      if (saved[id] === val) btn.classList.add('is-on');
      btn.addEventListener('click', function () {
        var cur = (store.get(stageId) || {}).self || {};
        var next = cur[id] === val ? '' : val;
        store.setSelf(stageId, id, next);
        $$('.rate[data-selfcheck="' + id + '"]').forEach(function (b) {
          b.classList.toggle('is-on', b.getAttribute('data-val') === next);
        });
      });
    });
  }

  function initParts(stageId) {
    var saved = (store.get(stageId) || {}).parts || {};
    $$('details.part').forEach(function (d) {
      var id = d.getAttribute('data-part');
      if (id in saved) d.open = saved[id];
      d.addEventListener('toggle', function () { store.setPart(stageId, id, d.open); });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      resolve();
    });
  }

  function initCopy() {
    $$('.code').forEach(function (box) {
      var btn = $('.code__copy', box);
      var code = $('code', box);
      if (!btn || !code) return;
      btn.addEventListener('click', function () {
        copyText(code.textContent).then(function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-done');
          setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1400);
        });
      });
    });
  }

  function initGoto() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('[data-goto-answer]') : null;
      if (!a) return;
      e.preventDefault();
      var id = a.getAttribute('data-goto-answer');
      switchTab('tour');
      var el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var ta = $('.answer__input', el);
        if (ta) ta.focus();
      }
    });
  }

  function initSearch() {
    var input = $('#search');
    var results = $('#search-results');
    if (!input || !results) return;
    var data = window.TF_SEARCH_INDEX || [];
    var active = -1;

    function render(qraw) {
      var q = qraw.trim().toLowerCase();
      if (!q) { results.hidden = true; results.innerHTML = ''; active = -1; return; }
      var matches = data.filter(function (it) {
        return it.t.toLowerCase().indexOf(q) > -1 || it.st.toLowerCase().indexOf(q) > -1;
      }).slice(0, 24);
      if (!matches.length) {
        results.innerHTML = '<div class="muted" style="padding:10px">No matches.</div>';
        results.hidden = false;
        return;
      }
      results.innerHTML = matches.map(function (it) {
        return '<a href="' + it.h + '"><span class="badge">' + escapeHtml(it.st) + '</span>' + escapeHtml(it.t) + '<span class="kind">' + it.type + '</span></a>';
      }).join('');
      results.hidden = false;
      active = -1;
    }

    input.addEventListener('input', debounce(function () { render(input.value); }, 120));
    input.addEventListener('focus', function () { if (input.value) render(input.value); });
    input.addEventListener('keydown', function (e) {
      var links = $$('#search-results a');
      if (e.key === 'ArrowDown') active = Math.min(links.length - 1, active + 1);
      else if (e.key === 'ArrowUp') active = Math.max(0, active - 1);
      else if (e.key === 'Enter') {
        var go = links[active] || links[0];
        if (go) window.location.href = go.href;
        return;
      } else if (e.key === 'Escape') { results.hidden = true; input.blur(); return; }
      else return;
      e.preventDefault();
      links.forEach(function (l, i) { l.classList.toggle('is-active', i === active); });
      if (links[active]) links[active].scrollIntoView({ block: 'nearest' });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.search')) results.hidden = true;
    });
  }

  function initCmdFilter() {
    var input = $('#cmd-filter');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      $$('#commands tbody tr').forEach(function (tr) {
        var t = tr.getAttribute('data-cmd') || '';
        tr.style.display = (!q || t.indexOf(q) > -1) ? '' : 'none';
      });
    });
  }

  function download(name, text) {
    var blob = new Blob([text], { type: 'text/markdown' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function initExport() {
    var btn = $('#export');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var id = page.stage;
      var data = store.get(id) || {};
      var lines = ['# ' + id.toUpperCase() + ' — my answers', ''];
      $$('.answer').forEach(function (box) {
        var key = box.getAttribute('id');
        var prompt = $('.answer__prompt', box);
        var ta = $('.answer__input', box);
        var val = (data.answers || {})[key] || (ta ? ta.value : '');
        lines.push('## ' + (prompt ? prompt.textContent : key));
        lines.push('');
        lines.push(val ? val : '_No answer recorded._');
        lines.push('');
      });
      download(id + '-answers.md', lines.join('\n'));
    });
  }

  function initReset() {
    var btn = $('#reset');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.confirm('Clear all saved progress, answers and self-checks in this browser?')) {
        store.reset();
        window.location.reload();
      }
    });
  }

  function initHash() {
    var h = (window.location.hash || '').replace('#', '');
    if (['tour', 'checklist', 'selfcheck', 'commands', 'brief', 'writeup'].indexOf(h) > -1) switchTab(h);
  }

  function warnNoStorage() {
    if (store.available) return;
    var bar = document.createElement('div');
    bar.className = 'callout callout--warn';
    bar.style.cssText = 'max-width:1320px;margin:12px auto 0;';
    bar.innerHTML = '<p>This browser is blocking local storage (private mode). Your progress and answers will not be saved between visits.</p>';
    var layout = $('.layout');
    if (layout && layout.parentNode) layout.parentNode.insertBefore(bar, layout);
  }

  ready(function () {
    initTabs();
    initCopy();
    initSearch();
    initGoto();
    initCmdFilter();
    initReset();
    initHash();
    if (page.page === 'stage') {
      initTasks(page.stage);
      initAnswers(page.stage);
      initSelf(page.stage);
      initParts(page.stage);
      initExport();
    }
    warnNoStorage();
    updateProgress();
  });
})();
