# Salesforce Architect Career Workspace

A zero-to-hero curriculum for the path to Salesforce Architect: a single-page app shell
with a persistent sheet map (left), a reading canvas (centre), and a per-sheet Study Desk
for notes (bottom). Twenty sheets with real teaching content — not just reading lists —
across platform foundations, Apex, Lightning Web Components, the five Architect Journey
domains (Data Architecture, Sharing & Visibility, Integration, Identity & Access
Management, Development Lifecycle), the agentic-enterprise module, a 40-question scored
Quiz Bank, hands-on Connected Case scenario practice, an Artefact Studio, and the
certification track through Certified Technical Architect. Built from the official
Trailhead ["Build Your Architect Career on Salesforce"](https://trailhead.salesforce.com/content/learn/trails/salesforce-architect-careers)
trail, cross-referenced against [Salesforce Dictionary](https://salesforcedictionary.com/dashboard),
and extended to cover the domains a real exam or review board actually tests.

## Getting started

1. Visit the live site: [myintp.github.io/SalesForceArchitect](https://myintp.github.io/SalesForceArchitect/)
2. Use the left-hand map to move through Start → The Role → Foundations → Architecture
   Domains → Practice → Certification → Interview Bridge → Reference → Progress
3. Check items off as you complete them — the **Progress** sheet tracks completion across
   every sheet
4. In **Quiz Bank**, answer is scored immediately with an inline explanation; filter by
   domain or run all 40 questions, and progress is saved automatically
5. In **Connected Case Practice**, decide before you reveal — each scenario has a model
   approach and a self-score rubric behind a "Reveal" toggle
6. Star a sheet with **Bookmark** to pin it to the review queue
7. Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>K</kbd> anywhere to jump straight to a sheet by name
8. Jot notes as you go in the Study Desk at the bottom — it remembers a separate note per sheet

## Repository structure

| File | Description |
|---|---|
| `index.html` | The app shell: context bar, sidebar navigation, canvas, and Study Desk |
| `quiz.html` | Redirect stub to `index.html#quiz`, kept so old links/bookmarks still resolve |
| `styles.css` | Design system: dark app shell, light reading canvas, one accent colour |
| `app.js` | Shell behaviour: sheet content and routing, sidebar sync, Study Desk notes, progress tracker, bookmarks, search, and the quiz bank/scoring engine |
| `favicon.svg` | Site favicon |

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
