# Interactive course site

A static, no-build version of the Terraform course. Open `index.html` in a browser — no server, no install. It covers stages M01–M09; the capstone (M10) is not included.

## What is generated

Do **not** hand-edit these. They are produced from the markdown sources at the repository root and in `modules/`:

| File | Source |
| --- | --- |
| `index.html` | `README.md` |
| `m01.html` … `m09.html` | `modules/<stage>/tutorial.md` (Tour tab) and `modules/<stage>/tasks.md` (Checklist tab) |
| `assets/js/search-index.js` | commands, parts and prompts collected from the tutorials; task totals from `tasks.md` |

Hand-authored and safe to edit:

| File | Purpose |
| --- | --- |
| `assets/css/site.css` | All styling, including light/dark and print. |
| `assets/js/store.js` | Progress/answers stored in `localStorage` under `tf-course:v1`. |
| `assets/js/site.js` | Tabs, checkboxes, answer boxes, self-check, copy buttons, search. |

## Regenerate

Whenever a tutorial, a checklist or the root README changes:

```
node tools/build-site.mjs
node tools/check-site.mjs
```

`build-site.mjs` is zero-dependency Node. `check-site.mjs` asserts the output has no leftover markdown, that every `Your turn` prompt has an answer box, that every task has a checkbox, and that the search index is valid — it exits non-zero on failure.

## Features

- **Tour / Checklist / Self-check / Commands** tabs per stage.
- **Progress** — tick tasks and parts; stored per browser, shown in the ring and sidebar.
- **Your turn answers** — every research prompt has an autosaved box, exportable as markdown per stage (“Download my answers”).
- **Self-check** — rate each prompt *Can explain* / *Revisit*; answers are never supplied.
- **Search** — across parts, commands and prompts, from the top bar.
- **Copy** — every code block has a copy button.

Progress lives only in the browser (`localStorage`); the “Reset” button clears it. Nothing is sent anywhere.
