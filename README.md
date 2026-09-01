# Salesforce Architect Career Workspace

A certification and career workspace for the path to Salesforce Architect: a single-page
app shell with a persistent sheet map (left), a reading canvas (centre), and a per-sheet
Study Desk for notes (bottom). Content is built from the official Trailhead
["Build Your Architect Career on Salesforce"](https://trailhead.salesforce.com/content/learn/trails/salesforce-architect-careers)
trail and cross-referenced against [Salesforce Dictionary](https://salesforcedictionary.com/dashboard)'s
certification and learning resources.

## Getting started

1. Visit the live site: [myintp.github.io/SalesForceArchitect](https://myintp.github.io/SalesForceArchitect/)
2. Use the left-hand map to move through Start → The Role → Foundations → Architecture →
   Certification → Interview Bridge → Reference → Progress
3. Check items off as you complete them — the **Progress** sheet tracks completion across
   every sheet
4. Star a sheet with **Bookmark** to pin it to the review queue
5. Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd> anywhere to jump straight to a sheet by name
6. Jot notes as you go in the Study Desk at the bottom — it remembers a separate note per sheet

## Repository structure

| File | Description |
|---|---|
| `index.html` | The app shell: context bar, sidebar navigation, canvas, and Study Desk |
| `styles.css` | Design system: dark app shell, light reading canvas, one accent colour |
| `app.js` | Shell behaviour: sheet content and routing, sidebar sync, Study Desk notes, progress tracker, bookmarks, search |

## Local development

No build step, framework, or package installation required.

```bash
python -m http.server 8420
```

Then open `http://localhost:8420`.

## Notes

- All progress, bookmarks, and notes are stored in the browser's `localStorage` — nothing
  is sent anywhere.
- The employer position description referenced while drafting the Interview Bridge sheet
  is intentionally excluded from this repository (see `.gitignore`) as it is marked
  confidential by the issuing organisation.
