(function () {
  var KEY = 'tf-course:v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
  }
  function stageOf(d, id) {
    d.stages = d.stages || {};
    d.stages[id] = d.stages[id] || {};
    return d.stages[id];
  }
  function patch(id, fn) {
    var d = load();
    fn(stageOf(d, id));
    save(d);
  }

  window.TFStore = {
    available: (function () {
      try { localStorage.setItem('__tf_probe', '1'); localStorage.removeItem('__tf_probe'); return true; }
      catch (e) { return false; }
    })(),
    get: function (id) {
      var d = load();
      return (d.stages && d.stages[id]) || {};
    },
    setTask: function (id, task, val) {
      patch(id, function (s) { s.tasks = s.tasks || {}; if (val) s.tasks[task] = true; else delete s.tasks[task]; });
    },
    setAnswer: function (id, key, val) {
      patch(id, function (s) { s.answers = s.answers || {}; if (val) s.answers[key] = val; else delete s.answers[key]; });
    },
    setSelf: function (id, key, val) {
      patch(id, function (s) { s.self = s.self || {}; if (val) s.self[key] = val; else delete s.self[key]; });
    },
    setPart: function (id, part, open) {
      patch(id, function (s) { s.parts = s.parts || {}; s.parts[part] = !!open; });
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    all: function () { return load(); }
  };
})();
